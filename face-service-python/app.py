import base64
import io
import math
from typing import List

from flask import Flask, jsonify, request

try:
    import face_recognition
    FACE_LIB_ERROR = None
except Exception as exc:  # pragma: no cover - runtime environment dependent
    face_recognition = None
    FACE_LIB_ERROR = str(exc)

app = Flask(__name__)


def decode_image(image_base64: str):
    if not image_base64:
        raise ValueError("imageBase64 is required")

    if "," in image_base64:
        _, image_base64 = image_base64.split(",", 1)

    image_bytes = base64.b64decode(image_base64)
    return face_recognition.load_image_file(io.BytesIO(image_bytes))


def ensure_face_library():
    if face_recognition is None:
        raise RuntimeError(
            "face_recognition runtime is not available. "
            "Install requirements from requirements.txt and the required face_recognition models. "
            f"Original error: {FACE_LIB_ERROR}"
        )


def extract_single_face_encoding(image_base64: str) -> List[float]:
    ensure_face_library()
    image = decode_image(image_base64)
    locations = face_recognition.face_locations(image)

    if len(locations) == 0:
        raise ValueError("No face detected. Ensure the Logitech HD 1080p camera has a clear frontal face.")

    if len(locations) > 1:
        raise ValueError("Multiple faces detected. Only one person should be visible during enrollment or verification.")

    encodings = face_recognition.face_encodings(image, known_face_locations=locations)
    if not encodings:
        raise ValueError("Face detected but encoding could not be generated.")

    return encodings[0].tolist()


def euclidean_distance(a: List[float], b: List[float]) -> float:
    return math.sqrt(sum((float(x) - float(y)) ** 2 for x, y in zip(a, b)))


@app.get("/health")
def health():
    return jsonify({
        "status": "ok" if face_recognition is not None else "warning",
        "service": "face-service",
        "libraryReady": face_recognition is not None,
        "message": "Face recognition library loaded." if face_recognition is not None else FACE_LIB_ERROR
    })


@app.post("/enroll-face")
def enroll_face():
    payload = request.get_json(silent=True) or {}
    employee_id = payload.get("employeeId")
    image_base64 = payload.get("imageBase64")

    if not employee_id:
        return jsonify({"status": "error", "message": "employeeId is required"}), 400

    try:
        face_encoding = extract_single_face_encoding(image_base64)
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 422

    return jsonify({
        "status": "enrolled",
        "employeeId": employee_id,
        "faceEncoding": face_encoding,
        "profileImage": image_base64
    })


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
        probe_encoding = extract_single_face_encoding(image_base64)
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 422

    best_match = None
    best_score = None
    threshold = 0.45

    for candidate in candidates:
        candidate_encoding = candidate.get("faceEncoding")
        if not candidate_encoding:
            continue

        distance = euclidean_distance(probe_encoding, candidate_encoding)
        if best_score is None or distance < best_score:
            best_score = distance
            best_match = candidate

    if best_match is None or best_score is None or best_score > threshold:
        return jsonify({
            "status": "no_match",
            "message": "No enrolled face matched the captured image.",
            "score": best_score
        }), 404

    return jsonify({
        "status": "matched",
        "employeeId": best_match.get("employeeId"),
        "name": best_match.get("name"),
        "cnic": best_match.get("cnic"),
        "score": best_score
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
