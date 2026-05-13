import os
import sys

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_DEP_ROOTS = []

for dep_root in LOCAL_DEP_ROOTS:
    if os.path.isdir(dep_root) and dep_root not in sys.path:
        sys.path.insert(0, dep_root)

os.environ.setdefault("FACE_SERVER_RUNTIME", "waitress")

from app import app  # noqa: E402

try:
    from waitress import serve
except Exception:
    os.environ["FACE_SERVER_RUNTIME"] = "flask-fallback"
    print("Waitress unavailable, falling back to Flask development server.")
    print("Face service ready on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
else:
    print("Face service ready on http://127.0.0.1:5000 via Waitress")
    serve(app, host="127.0.0.1", port=5000, threads=8)
