"""
Convenience launcher for the AURA FastAPI backend.
"""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("AURA_HOST", "127.0.0.1")
    port = int(os.environ.get("AURA_PORT", "49200"))
    print(f"Starting AURA Backend on http://{host}:{port}...")
    uvicorn.run("aura.main:app", host=host, port=port, reload=False)
