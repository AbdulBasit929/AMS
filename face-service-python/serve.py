import os
import runpy
import sys

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_DEP_ROOT = os.path.join(APP_ROOT, ".pydeps312")

if os.path.isdir(LOCAL_DEP_ROOT) and LOCAL_DEP_ROOT not in sys.path:
    sys.path.insert(0, LOCAL_DEP_ROOT)

runpy.run_path(os.path.join(APP_ROOT, "app.py"), run_name="__main__")
