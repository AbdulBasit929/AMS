import base64
import io
import math
import os
import sys
from typing import Dict, List, Optional, Tuple

from flask import Flask, jsonify, request

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_DEP_ROOT = os.path.join(APP_ROOT, ".pydeps312")

if os.path.isdir(LOCAL_DEP_ROOT) and LOCAL_DEP_ROOT not in sys.path:
    sys.path.insert(0, LOCAL_DEP_ROOT)

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

FACE_DISTANCE_THRESHOLD = float(os.environ.get("FACE_DISTANCE_THRESHOLD", "0.42"))
MIN_ENROLLMENT_SAMPLES = int(os.environ.get("FACE_MIN_ENROLLMENT_SAMPLES", "3"))
MIN_BLUR_VARIANCE = float(os.environ.get("FACE_MIN_BLUR_VARIANCE", "40.0"))
MIN_BRIGHTNESS = float(os.environ.get("FACE_MIN_BRIGHTNESS", "45.0"))
MAX_BRIGHTNESS = float(os.environ.get("FACE_MAX_BRIGHTNESS", "210.0"))
MIN_WIDTH = int(os.environ.get("FACE_MIN_WIDTH", "640"))
MIN_HEIGHT = int(os.environ.get("FACE_MIN_HEIGHT", "480"))
MAX_DETECTION_WIDTH = int(os.environ.get("FACE_MAX_DETECTION_WIDTH", "1280"))


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


def validate_image_quality(bgr: "np.ndarray") -> Dict[str, float]:
    height, width = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())

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

    return {
        "width": width,
        "height": height,
        "blurVariance": blur_variance,
        "brightness": brightness
    }


def detect_face_locations(rgb: "np.ndarray") -> List[Tuple[int, int, int, int]]:
    locations = face_recognition.face_locations(rgb, number_of_times_to_upsample=1, model="hog")
    if locations:
        return locations

    height, width = rgb.shape[:2]
    if width <= MAX_DETECTION_WIDTH:
        return locations

    scale = MAX_DETECTION_WIDTH / float(width)
    resized = cv2.resize(rgb, (int(width * scale), int(height * scale)))
    resized_locations = face_recognition.face_locations(resized, number_of_times_to_upsample=1, model="hog")

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


def extract_single_face_sample(image_base64: str) -> Dict[str, object]:
    bgr, rgb = decode_image(image_base64)
    quality = validate_image_quality(bgr)
    locations = detect_face_locations(rgb)

    if len(locations) == 0:
        raise ValueError("No face detected. Ensure one clear frontal face is visible in the Logitech camera frame.")

    if len(locations) > 1:
        raise ValueError("Multiple faces detected. Only one person should be visible during enrollment or verification.")

    encodings = face_recognition.face_encodings(rgb, known_face_locations=locations)
    if not encodings:
        raise ValueError("Face detected but encoding could not be generated.")

    top, right, bottom, left = locations[0]
    face_area = max(1, (right - left) * (bottom - top))
    frame_area = max(1, quality["width"] * quality["height"])

    if face_area / frame_area < 0.08:
        raise ValueError("Face is too small in the frame. Move closer to the Logitech camera.")

    return {
        "encoding": encodings[0].tolist(),
        "quality": quality,
        "faceBox": {
            "top": int(top),
            "right": int(right),
            "bottom": int(bottom),
            "left": int(left)
        },
        "imageBase64": image_base64
    }


def average_encodings(encodings: List[List[float]]) -> List[float]:
    if not encodings:
        raise ValueError("At least one face encoding is required.")
    vectors = np.array(encodings, dtype=float)
    return vectors.mean(axis=0).tolist()


def euclidean_distance(a: List[float], b: List[float]) -> float:
    return math.sqrt(sum((float(x) - float(y)) ** 2 for x, y in zip(a, b)))


def summarize_quality(samples: List[Dict[str, object]]) -> Dict[str, float]:
    blur_values = [sample["quality"]["blurVariance"] for sample in samples]
    brightness_values = [sample["quality"]["brightness"] for sample in samples]
    widths = [sample["quality"]["width"] for sample in samples]
    heights = [sample["quality"]["height"] for sample in samples]

    return {
        "averageBlurVariance": round(sum(blur_values) / len(blur_values), 2),
        "averageBrightness": round(sum(brightness_values) / len(brightness_values), 2),
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
        "libraryReady": ready,
        "pythonVersion": sys.version.split(" ")[0],
        "threshold": FACE_DISTANCE_THRESHOLD,
        "minBlurVariance": MIN_BLUR_VARIANCE,
        "message": detail
    })


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
    image_base64 = payload.get("imageBase64")
    candidates = payload.get("candidates") or []

    if not image_base64:
        return jsonify({"status": "error", "message": "imageBase64 is required"}), 400

    if not candidates:
        return jsonify({"status": "error", "message": "candidates are required"}), 400

    try:
        sample = extract_single_face_sample(image_base64)
        probe_encoding = sample["encoding"]
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 422

    best_match: Optional[Dict[str, object]] = None
    best_score: Optional[float] = None

    for candidate in candidates:
        candidate_encodings = extract_candidate_encodings(candidate)
        if not candidate_encodings:
            continue

        local_best = min(euclidean_distance(probe_encoding, encoding) for encoding in candidate_encodings)
        if best_score is None or local_best < best_score:
            best_score = local_best
            best_match = candidate

    if best_match is None or best_score is None or best_score > FACE_DISTANCE_THRESHOLD:
        return jsonify({
            "status": "no_match",
            "message": "No enrolled face matched the captured image.",
            "score": best_score,
            "threshold": FACE_DISTANCE_THRESHOLD
        }), 404

    confidence = max(0.0, min(1.0, 1.0 - (best_score / FACE_DISTANCE_THRESHOLD)))

    return jsonify({
        "status": "matched",
        "employeeId": best_match.get("employeeId"),
        "name": best_match.get("name"),
        "cnic": best_match.get("cnic"),
        "score": best_score,
        "confidence": round(confidence, 4),
        "threshold": FACE_DISTANCE_THRESHOLD,
        "quality": sample["quality"]
    })


if __name__ == "__main__":
    print("Face service ready on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
