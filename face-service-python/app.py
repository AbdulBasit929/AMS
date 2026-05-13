import base64
import io
import math
import os
import sys
from typing import Dict, List, Optional, Tuple

from flask import Flask, jsonify, request

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_DEP_ROOTS = []

for dep_root in LOCAL_DEP_ROOTS:
    if os.path.isdir(dep_root) and dep_root not in sys.path:
        sys.path.insert(0, dep_root)

try:
    import cv2
except Exception as exc:  # pragma: no cover - runtime environment dependent
    cv2 = None
    CV2_ERROR = str(exc)
else:
    CV2_ERROR = None

try:
    import face_recognition
except Exception as exc:  # pragma: no cover - runtime environment dependent
    face_recognition = None
    FACE_LIB_ERROR = str(exc)
else:
    FACE_LIB_ERROR = None

try:
    import numpy as np
except Exception as exc:  # pragma: no cover - runtime environment dependent
    np = None
    NUMPY_ERROR = str(exc)
else:
    NUMPY_ERROR = None

app = Flask(__name__)
FACE_SERVICE_VERSION = "2.2.0"

FACE_DISTANCE_THRESHOLD = float(os.environ.get("FACE_DISTANCE_THRESHOLD", "0.42"))
FACE_DISTANCE_THRESHOLD_RELAXED = float(os.environ.get("FACE_DISTANCE_THRESHOLD_RELAXED", "0.48"))
FACE_MIN_CONFIDENCE_ACCEPT = float(os.environ.get("FACE_MIN_CONFIDENCE_ACCEPT", "0.45"))
FACE_MIN_SCORE_MARGIN = float(os.environ.get("FACE_MIN_SCORE_MARGIN", "0.03"))
MIN_ENROLLMENT_SAMPLES = int(os.environ.get("FACE_MIN_ENROLLMENT_SAMPLES", "3"))
MIN_BLUR_VARIANCE = float(os.environ.get("FACE_MIN_BLUR_VARIANCE", "10.0"))
RECOMMENDED_BLUR_VARIANCE = float(os.environ.get("FACE_RECOMMENDED_BLUR_VARIANCE", "20.0"))
MIN_BRIGHTNESS = float(os.environ.get("FACE_MIN_BRIGHTNESS", "45.0"))
MAX_BRIGHTNESS = float(os.environ.get("FACE_MAX_BRIGHTNESS", "210.0"))
MIN_WIDTH = int(os.environ.get("FACE_MIN_WIDTH", "640"))
MIN_HEIGHT = int(os.environ.get("FACE_MIN_HEIGHT", "480"))
MAX_DETECTION_WIDTH = int(os.environ.get("FACE_MAX_DETECTION_WIDTH", "1280"))
FACE_DETECTION_MODEL = os.environ.get("FACE_DETECTION_MODEL", "hog")
FACE_ENCODER_JITTERS = int(os.environ.get("FACE_ENCODER_JITTERS", "2"))
FACE_VERIFY_ENCODER_JITTERS = int(os.environ.get("FACE_VERIFY_ENCODER_JITTERS", "1"))
FACE_VERIFY_CLOSEST_K = max(1, int(os.environ.get("FACE_VERIFY_CLOSEST_K", "2")))
MAX_ENROLLMENT_SAMPLE_DRIFT = float(os.environ.get("FACE_MAX_ENROLLMENT_SAMPLE_DRIFT", "0.36"))
ENROLLMENT_OUTLIER_TOLERANCE = float(os.environ.get("FACE_ENROLLMENT_OUTLIER_TOLERANCE", "0.06"))
FACE_VERIFY_MIN_PROBES_FOR_RELAXED = max(1, int(os.environ.get("FACE_VERIFY_MIN_PROBES_FOR_RELAXED", "3")))


def ensure_face_runtime():
    errors = []
    if np is None:
        errors.append(f"numpy unavailable: {NUMPY_ERROR}")
    if cv2 is None:
        errors.append(f"opencv unavailable: {CV2_ERROR}")
    if face_recognition is None:
        errors.append(f"face_recognition unavailable: {FACE_LIB_ERROR}")

    if errors:
        raise RuntimeError("Face runtime is not available. " + " | ".join(errors))


def strip_data_url(image_base64: str) -> str:
    if not image_base64:
        raise ValueError("imageBase64 is required")
    return image_base64.split(",", 1)[1] if "," in image_base64 else image_base64


def decode_image(image_base64: str) -> Tuple["np.ndarray", "np.ndarray"]:
    ensure_face_runtime()
    image_bytes = base64.b64decode(strip_data_url(image_base64))
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Image could not be decoded.")
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return bgr, rgb


def measure_image_quality(bgr: "np.ndarray") -> Dict[str, float]:
    height, width = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())

    return {
        "width": width,
        "height": height,
        "blurVariance": blur_variance,
        "brightness": brightness
    }


def validate_image_quality(quality: Dict[str, float]) -> None:
    width = int(quality["width"])
    height = int(quality["height"])
    blur_variance = float(quality["blurVariance"])
    brightness = float(quality["brightness"])

    if width < MIN_WIDTH or height < MIN_HEIGHT:
        raise ValueError(
            f"Image resolution is too low ({width}x{height}). Use the Logitech HD 1080p camera with a clear front-facing frame."
        )

    if blur_variance < MIN_BLUR_VARIANCE:
        raise ValueError(
            f"Image is too blurry (sharpness score {blur_variance:.1f}). Hold still and refocus the camera."
        )

    if brightness < MIN_BRIGHTNESS:
        raise ValueError(
            f"Image is too dark (brightness {brightness:.1f}). Improve lighting before enrollment or verification."
        )

    if brightness > MAX_BRIGHTNESS:
        raise ValueError(
            f"Image is overexposed (brightness {brightness:.1f}). Reduce glare or move away from harsh light."
        )

def build_quality_warnings(quality: Dict[str, float]) -> List[str]:
    warnings = []
    blur_variance = float(quality["blurVariance"])
    brightness = float(quality["brightness"])

    if blur_variance < RECOMMENDED_BLUR_VARIANCE:
        warnings.append(
            f"Sharpness is acceptable but soft ({blur_variance:.1f}). For stronger matching, let autofocus settle and capture a steadier frame."
        )

    if brightness < (MIN_BRIGHTNESS + 10):
        warnings.append(
            f"Lighting is near the minimum threshold ({brightness:.1f}). A brighter front light will improve consistency."
        )

    if brightness > (MAX_BRIGHTNESS - 15):
        warnings.append(
            f"Lighting is close to overexposed ({brightness:.1f}). Reduce glare for cleaner facial detail."
        )

    return warnings


def detect_face_locations(rgb: "np.ndarray") -> List[Tuple[int, int, int, int]]:
    for upsample in (1, 2):
        locations = face_recognition.face_locations(
            rgb,
            number_of_times_to_upsample=upsample,
            model=FACE_DETECTION_MODEL
        )
        if locations:
            return locations

    height, width = rgb.shape[:2]
    if width <= MAX_DETECTION_WIDTH:
        return []

    scale = MAX_DETECTION_WIDTH / float(width)
    resized = cv2.resize(rgb, (int(width * scale), int(height * scale)))
    resized_locations: List[Tuple[int, int, int, int]] = []
    for upsample in (1, 2):
        resized_locations = face_recognition.face_locations(
            resized,
            number_of_times_to_upsample=upsample,
            model=FACE_DETECTION_MODEL
        )
        if resized_locations:
            break

    if not resized_locations:
        return []

    return [
        (
            int(top / scale),
            int(right / scale),
            int(bottom / scale),
            int(left / scale),
        )
        for top, right, bottom, left in resized_locations
    ]


def analyze_face_image(
    image_base64: str,
    include_encoding: bool = False,
    encoder_jitters: Optional[int] = None
) -> Dict[str, object]:
    bgr, rgb = decode_image(image_base64)
    quality = measure_image_quality(bgr)
    validate_image_quality(quality)
    locations = detect_face_locations(rgb)

    if len(locations) == 0:
        raise ValueError("No face detected. Ensure one clear frontal face is visible in the Logitech camera frame.")

    if len(locations) > 1:
        raise ValueError("Multiple faces detected. Only one person should be visible during enrollment or verification.")

    top, right, bottom, left = locations[0]
    face_area = max(1, (right - left) * (bottom - top))
    frame_area = max(1, quality["width"] * quality["height"])
    face_coverage = face_area / frame_area

    if face_coverage < 0.08:
        raise ValueError("Face is too small in the frame. Move closer to the Logitech camera.")

    analysis = {
        "quality": quality,
        "warnings": build_quality_warnings(quality),
        "faceBox": {
            "top": int(top),
            "right": int(right),
            "bottom": int(bottom),
            "left": int(left)
        },
        "faceCoverage": round(face_coverage, 4),
        "imageBase64": image_base64
    }

    if include_encoding:
        jitters = FACE_ENCODER_JITTERS if encoder_jitters is None else max(1, int(encoder_jitters))
        encodings = face_recognition.face_encodings(
            rgb,
            known_face_locations=locations,
            num_jitters=jitters
        )
        if not encodings:
            raise ValueError("Face detected but encoding could not be generated.")
        analysis["encoding"] = encodings[0].tolist()

    return analysis


def extract_single_face_sample(image_base64: str) -> Dict[str, object]:
    return analyze_face_image(image_base64, include_encoding=True)


def extract_verification_face_sample(image_base64: str) -> Dict[str, object]:
    return analyze_face_image(
        image_base64,
        include_encoding=True,
        encoder_jitters=FACE_VERIFY_ENCODER_JITTERS
    )


def average_encodings(encodings: List[List[float]]) -> List[float]:
    if not encodings:
        raise ValueError("At least one face encoding is required.")
    vectors = np.array(encodings, dtype=float)
    return vectors.mean(axis=0).tolist()


def euclidean_distance(a: List[float], b: List[float]) -> float:
    return math.sqrt(sum((float(x) - float(y)) ** 2 for x, y in zip(a, b)))


def median(values: List[float]) -> float:
    ordered = sorted(values)
    count = len(ordered)
    middle = count // 2
    if count % 2 == 1:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2.0


def summarize_quality(samples: List[Dict[str, object]]) -> Dict[str, float]:
    blur_values = [sample["quality"]["blurVariance"] for sample in samples]
    brightness_values = [sample["quality"]["brightness"] for sample in samples]
    widths = [sample["quality"]["width"] for sample in samples]
    heights = [sample["quality"]["height"] for sample in samples]
    coverage_values = []

    for sample in samples:
        box = sample["faceBox"]
        width = sample["quality"]["width"]
        height = sample["quality"]["height"]
        face_area = max(1, (box["right"] - box["left"]) * (box["bottom"] - box["top"]))
        frame_area = max(1, width * height)
        coverage_values.append(face_area / frame_area)

    return {
        "averageBlurVariance": round(sum(blur_values) / len(blur_values), 2),
        "averageBrightness": round(sum(brightness_values) / len(brightness_values), 2),
        "averageFaceCoverage": round(sum(coverage_values) / len(coverage_values), 4),
        "minWidth": min(widths),
        "minHeight": min(heights)
    }


def normalize_enrollment_samples(payload: Dict[str, object]) -> List[str]:
    samples = payload.get("samples")
    if isinstance(samples, list) and samples:
        return [sample for sample in samples if sample]

    image_base64 = payload.get("imageBase64")
    if image_base64:
        return [image_base64]

    raise ValueError("Provide imageBase64 or a non-empty samples array.")


def normalize_verification_samples(payload: Dict[str, object]) -> List[str]:
    samples = payload.get("samples")
    if isinstance(samples, list) and samples:
        return [sample for sample in samples if sample]

    image_base64 = payload.get("imageBase64")
    if image_base64:
        return [image_base64]

    raise ValueError("Provide imageBase64 or a non-empty samples array.")


def extract_candidate_encodings(candidate: Dict[str, object]) -> List[List[float]]:
    encodings = []

    if isinstance(candidate.get("faceEncodings"), list):
        encodings.extend(candidate["faceEncodings"])

    if isinstance(candidate.get("faceEncoding"), list):
        encodings.append(candidate["faceEncoding"])

    if isinstance(candidate.get("faceProfile"), dict):
        profile = candidate["faceProfile"]
        if isinstance(profile.get("encodings"), list):
            encodings.extend(profile["encodings"])
        if isinstance(profile.get("averagedEncoding"), list):
            encodings.append(profile["averagedEncoding"])

    return [encoding for encoding in encodings if isinstance(encoding, list) and encoding]


def filter_consistent_samples(samples: List[Dict[str, object]]) -> Tuple[List[Dict[str, object]], List[Dict[str, object]]]:
    if len(samples) <= 1:
        return samples, []

    encodings = [sample["encoding"] for sample in samples]
    centroid = average_encodings(encodings)
    drift_scores = [euclidean_distance(encoding, centroid) for encoding in encodings]
    dynamic_limit = min(MAX_ENROLLMENT_SAMPLE_DRIFT, median(drift_scores) + ENROLLMENT_OUTLIER_TOLERANCE)

    ranked = sorted(zip(samples, drift_scores), key=lambda item: item[1])
    accepted = [sample for sample, drift in ranked if drift <= dynamic_limit]
    rejected = [
        {
            "sampleIndex": samples.index(sample) + 1,
            "message": f"Sample is inconsistent with the rest of the enrollment set (drift {drift:.3f}). Re-capture with a centered face and stable lighting."
        }
        for sample, drift in ranked
        if drift > dynamic_limit
    ]

    minimum_required = min(MIN_ENROLLMENT_SAMPLES, len(samples))
    if len(accepted) < minimum_required:
        accepted = [sample for sample, _ in ranked[:minimum_required]]
        retained_ids = {id(sample) for sample in accepted}
        rejected = [
            {
                "sampleIndex": index,
                "message": f"Sample is inconsistent with the rest of the enrollment set (drift {drift:.3f}). Re-capture with a centered face and stable lighting."
            }
            for index, (sample, drift) in enumerate(zip(samples, drift_scores), start=1)
            if id(sample) not in retained_ids
        ]

    return accepted, rejected


def score_candidate(probe_encoding: List[float], candidate: Dict[str, object]) -> Optional[float]:
    candidate_encodings = extract_candidate_encodings(candidate)
    if not candidate_encodings:
        return None

    individual_distances = sorted(
        euclidean_distance(probe_encoding, encoding)
        for encoding in candidate_encodings
    )
    closest_group = individual_distances[:min(len(individual_distances), FACE_VERIFY_CLOSEST_K)]
    closest_average = sum(closest_group) / len(closest_group)

    averaged_encoding = None
    face_profile = candidate.get("faceProfile")
    if isinstance(face_profile, dict) and isinstance(face_profile.get("averagedEncoding"), list):
        averaged_encoding = face_profile["averagedEncoding"]
    elif isinstance(candidate.get("faceEncoding"), list):
        averaged_encoding = candidate["faceEncoding"]

    if averaged_encoding:
        centroid_distance = euclidean_distance(probe_encoding, averaged_encoding)
        return (closest_average * 0.65) + (centroid_distance * 0.35)

    return closest_average


def score_candidate_across_probes(probe_encodings: List[List[float]], candidate: Dict[str, object]) -> Optional[float]:
    probe_scores = []
    for probe_encoding in probe_encodings:
        score = score_candidate(probe_encoding, candidate)
        if score is not None:
            probe_scores.append(score)

    if not probe_scores:
        return None

    probe_scores.sort()
    best_window = probe_scores[: min(2, len(probe_scores))]
    burst_score = sum(best_window) / len(best_window)

    if len(probe_encodings) == 1:
        return burst_score

    centroid_encoding = average_encodings(probe_encodings)
    centroid_score = score_candidate(centroid_encoding, candidate)
    if centroid_score is None:
        return burst_score

    return (burst_score + centroid_score) / 2.0


def compute_effective_threshold(
    accepted_probes: List[Dict[str, object]],
    candidate: Optional[Dict[str, object]]
) -> float:
    effective = FACE_DISTANCE_THRESHOLD

    if len(accepted_probes) < FACE_VERIFY_MIN_PROBES_FOR_RELAXED:
        return effective

    quality_summary = summarize_quality(accepted_probes)
    average_blur = float(quality_summary["averageBlurVariance"])
    average_coverage = float(quality_summary["averageFaceCoverage"])

    if average_blur >= RECOMMENDED_BLUR_VARIANCE and average_coverage >= 0.11:
        effective = max(effective, min(FACE_DISTANCE_THRESHOLD_RELAXED, FACE_DISTANCE_THRESHOLD + 0.04))

    if average_blur >= RECOMMENDED_BLUR_VARIANCE * 1.5 and average_coverage >= 0.13:
        effective = min(FACE_DISTANCE_THRESHOLD_RELAXED, effective + 0.02)

    face_profile = candidate.get("faceProfile") if isinstance(candidate, dict) else None
    if isinstance(face_profile, dict):
        sample_count = int(face_profile.get("sampleCount") or 0)
        if sample_count >= MIN_ENROLLMENT_SAMPLES + 1:
            effective = min(FACE_DISTANCE_THRESHOLD_RELAXED, effective + 0.01)

    return round(effective, 4)


def build_candidate_debug_summary(
    probe_encodings: List[List[float]],
    candidates: List[Dict[str, object]],
    limit: int = 3
) -> List[Dict[str, object]]:
    ranked = []
    for candidate in candidates:
        score = score_candidate_across_probes(probe_encodings, candidate)
        if score is None:
            continue
        ranked.append({
            "employeeId": candidate.get("employeeId"),
            "name": candidate.get("name"),
            "score": round(score, 4)
        })

    ranked.sort(key=lambda item: item["score"])
    return ranked[:limit]


def build_all_candidate_scores(
    probe_encodings: List[List[float]],
    candidates: List[Dict[str, object]]
) -> List[Dict[str, object]]:
    ranked = []
    for candidate in candidates:
        score = score_candidate_across_probes(probe_encodings, candidate)
        if score is None:
            continue
        ranked.append({
            "employeeId": candidate.get("employeeId"),
            "name": candidate.get("name"),
            "score": round(score, 4)
        })

    ranked.sort(key=lambda item: item["score"])
    return ranked


@app.get("/health")
def health():
    ready = np is not None and cv2 is not None and face_recognition is not None
    detail = "Face recognition runtime loaded."
    if not ready:
        detail = " | ".join(
            message
            for message in [
                f"numpy: {NUMPY_ERROR}" if np is None else None,
                f"opencv: {CV2_ERROR}" if cv2 is None else None,
                f"face_recognition: {FACE_LIB_ERROR}" if face_recognition is None else None
            ]
            if message
        )

    return jsonify({
        "status": "ok" if ready else "warning",
        "service": "face-service",
        "serviceVersion": FACE_SERVICE_VERSION,
        "libraryReady": ready,
        "pythonVersion": sys.version.split(" ")[0],
        "threshold": FACE_DISTANCE_THRESHOLD,
        "relaxedThreshold": FACE_DISTANCE_THRESHOLD_RELAXED,
        "minConfidenceAccept": FACE_MIN_CONFIDENCE_ACCEPT,
        "minScoreMargin": FACE_MIN_SCORE_MARGIN,
        "minBlurVariance": MIN_BLUR_VARIANCE,
        "recommendedBlurVariance": RECOMMENDED_BLUR_VARIANCE,
        "minBrightness": MIN_BRIGHTNESS,
        "maxBrightness": MAX_BRIGHTNESS,
        "minEnrollmentSamples": MIN_ENROLLMENT_SAMPLES,
        "encoderJitters": FACE_ENCODER_JITTERS,
        "verifyEncoderJitters": FACE_VERIFY_ENCODER_JITTERS,
        "detectionModel": FACE_DETECTION_MODEL,
        "serverRuntime": os.environ.get("FACE_SERVER_RUNTIME", "flask-dev"),
        "message": detail
    })


@app.post("/analyze-face")
def analyze_face():
    payload = request.get_json(silent=True) or {}
    image_base64 = payload.get("imageBase64")

    if not image_base64:
        return jsonify({"status": "error", "message": "imageBase64 is required"}), 400

    try:
        analysis = analyze_face_image(image_base64, include_encoding=False)
        return jsonify({
            "status": "ok",
            "quality": analysis["quality"],
            "warnings": analysis["warnings"],
            "faceBox": analysis["faceBox"],
            "faceCoverage": analysis["faceCoverage"]
        })
    except Exception as exc:
        quality = None
        try:
            bgr, _rgb = decode_image(image_base64)
            quality = measure_image_quality(bgr)
        except Exception:
            quality = None

        return jsonify({
            "status": "error",
            "message": str(exc),
            "quality": quality
        }), 422


@app.post("/enroll-face")
def enroll_face():
    payload = request.get_json(silent=True) or {}
    employee_id = payload.get("employeeId")

    if not employee_id:
        return jsonify({"status": "error", "message": "employeeId is required"}), 400

    try:
        sample_images = normalize_enrollment_samples(payload)
        if len(sample_images) > 1 and len(sample_images) < MIN_ENROLLMENT_SAMPLES:
            raise ValueError(f"Capture at least {MIN_ENROLLMENT_SAMPLES} face samples for enterprise-grade enrollment.")

        accepted = []
        rejected = []

        for index, sample in enumerate(sample_images, start=1):
            try:
                accepted.append(extract_single_face_sample(sample))
            except Exception as exc:
                rejected.append({
                    "sampleIndex": index,
                    "message": str(exc)
                })

        required = MIN_ENROLLMENT_SAMPLES if len(sample_images) > 1 else 1
        if len(accepted) < required:
            return jsonify({
                "status": "error",
                "message": f"Only {len(accepted)} valid face sample(s) were accepted. {required} are required.",
                "acceptedSamples": len(accepted),
                "rejectedSamples": rejected
            }), 422

        accepted, consistency_rejections = filter_consistent_samples(accepted)
        rejected.extend(consistency_rejections)

        if len(accepted) < required:
            return jsonify({
                "status": "error",
                "message": f"Enrollment samples are too inconsistent for a reliable face profile. Capture {required} new samples with the same pose and lighting.",
                "acceptedSamples": len(accepted),
                "rejectedSamples": rejected
            }), 422

        accepted.sort(key=lambda item: item["quality"]["blurVariance"], reverse=True)
        encodings = [sample["encoding"] for sample in accepted]
        averaged_encoding = average_encodings(encodings)

        return jsonify({
            "status": "enrolled",
            "employeeId": employee_id,
            "sampleCount": len(encodings),
            "faceEncoding": averaged_encoding,
            "faceEncodings": encodings,
            "qualitySummary": summarize_quality(accepted),
            "profileImage": accepted[0]["imageBase64"],
            "rejectedSamples": rejected,
            "threshold": FACE_DISTANCE_THRESHOLD
        })
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 422


@app.post("/verify-face")
def verify_face():
    payload = request.get_json(silent=True) or {}
    candidates = payload.get("candidates") or []

    if not candidates:
        return jsonify({"status": "error", "message": "candidates are required"}), 400

    try:
        sample_images = normalize_verification_samples(payload)
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400

    accepted_probes = []
    rejected_probes = []

    for index, sample_image in enumerate(sample_images, start=1):
        try:
            accepted_probes.append(extract_verification_face_sample(sample_image))
        except Exception as exc:
            rejected_probes.append({
                "sampleIndex": index,
                "message": str(exc)
            })

    if not accepted_probes:
        return jsonify({
            "status": "error",
            "message": "No valid verification face samples were accepted.",
            "rejectedSamples": rejected_probes
        }), 422

    accepted_probes.sort(key=lambda item: item["quality"]["blurVariance"], reverse=True)
    probe_encodings = [sample["encoding"] for sample in accepted_probes]
    best_probe_quality = accepted_probes[0]["quality"]
    quality_summary = summarize_quality(accepted_probes)
    ranked_candidates = build_all_candidate_scores(probe_encodings, candidates)

    best_match: Optional[Dict[str, object]] = None
    best_score: Optional[float] = None

    for candidate in candidates:
        local_best = score_candidate_across_probes(probe_encodings, candidate)
        if local_best is None:
            continue

        if best_score is None or local_best < best_score:
            best_score = local_best
            best_match = candidate

    effective_threshold = compute_effective_threshold(accepted_probes, best_match)

    if best_match is None or best_score is None or best_score > effective_threshold:
        return jsonify({
            "status": "no_match",
            "message": "No enrolled face matched the captured image.",
            "score": best_score,
            "threshold": FACE_DISTANCE_THRESHOLD,
            "appliedThreshold": effective_threshold,
            "qualitySummary": quality_summary,
            "probeCount": len(accepted_probes),
            "rejectedSamples": rejected_probes,
            "topCandidates": ranked_candidates[:3]
        }), 404

    confidence = max(0.0, min(1.0, 1.0 - (best_score / effective_threshold)))
    second_best_score = ranked_candidates[1]["score"] if len(ranked_candidates) > 1 else None
    score_margin = None if second_best_score is None else round(second_best_score - best_score, 4)

    if confidence < FACE_MIN_CONFIDENCE_ACCEPT:
        return jsonify({
            "status": "retry",
            "message": f"Possible face match for {best_match.get('name')}, but confidence is too low for attendance approval. Hold still, face the camera directly, and try again.",
            "employeeId": best_match.get("employeeId"),
            "name": best_match.get("name"),
            "score": best_score,
            "confidence": round(confidence, 4),
            "threshold": FACE_DISTANCE_THRESHOLD,
            "appliedThreshold": effective_threshold,
            "quality": best_probe_quality,
            "qualitySummary": quality_summary,
            "probeCount": len(accepted_probes),
            "rejectedSamples": rejected_probes,
            "topCandidates": ranked_candidates[:3]
        }), 409

    if score_margin is not None and score_margin < FACE_MIN_SCORE_MARGIN:
        return jsonify({
            "status": "ambiguous",
            "message": "Captured face is too close to another enrolled profile. Reposition and verify again before marking attendance.",
            "employeeId": best_match.get("employeeId"),
            "name": best_match.get("name"),
            "score": best_score,
            "confidence": round(confidence, 4),
            "scoreMargin": score_margin,
            "threshold": FACE_DISTANCE_THRESHOLD,
            "appliedThreshold": effective_threshold,
            "quality": best_probe_quality,
            "qualitySummary": quality_summary,
            "probeCount": len(accepted_probes),
            "rejectedSamples": rejected_probes,
            "topCandidates": ranked_candidates[:3]
        }), 409

    return jsonify({
        "status": "matched",
        "employeeId": best_match.get("employeeId"),
        "name": best_match.get("name"),
        "cnic": best_match.get("cnic"),
        "score": best_score,
        "confidence": round(confidence, 4),
        "threshold": FACE_DISTANCE_THRESHOLD,
        "appliedThreshold": effective_threshold,
        "quality": best_probe_quality,
        "qualitySummary": quality_summary,
        "scoreMargin": score_margin,
        "probeCount": len(accepted_probes),
        "rejectedSamples": rejected_probes
    })


if __name__ == "__main__":
    print("Face service ready on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
