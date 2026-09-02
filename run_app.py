"""
KisanQueue Single-Command Local Runner
Runs both FastAPI Backend (port 8000) and Vite Frontend (port 5173) concurrently.
"""

import subprocess
import sys
import os
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    ml_dir = os.path.join(root_dir, "ml")

    print("=" * 65)
    print("🌾 KisanQueue — Smart Mandi Queue Platform (SIH 2026)")
    print("=" * 65)

    # 1. Check / Train ML Model
    model_path = os.path.join(ml_dir, "models", "waiting_time_model.joblib")
    if not os.path.exists(model_path):
        print("\n[1/3] Training AI Waiting-Time Regressor...")
        subprocess.run([sys.executable, "train.py"], cwd=ml_dir, check=True)
    else:
        print("\n[1/3] AI Waiting-Time Model verified ->", model_path)

    # 2. Start Backend Server
    print("\n[2/3] Starting FastAPI Backend on http://localhost:8000...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=backend_dir
    )

    time.sleep(2)

    # 3. Start Frontend Server
    print("\n[3/3] Starting Vite Frontend on http://localhost:5173...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n" + "=" * 65)
    print("🚀 KisanQueue is LIVE!")
    print("👉 Frontend Application : http://localhost:5173")
    print("👉 Backend API & Swagger: http://localhost:8000/docs")
    print("=" * 65)
    print("Press Ctrl+C in terminal to stop all servers.")

    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down KisanQueue servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Done.")

if __name__ == "__main__":
    main()
