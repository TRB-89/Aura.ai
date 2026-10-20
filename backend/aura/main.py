"""
AURA Backend — FastAPI server
Manages: agent, tools, database, app discovery, file system, Office automation
"""
import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Guarantee backend directory is on sys.path
_backend_root = str(Path(__file__).resolve().parent.parent)
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

# Load secrets from %LOCALAPPDATA%\AURA\secrets.json and .env
_secrets_file = Path(os.environ.get("AURA_DATA_DIR", str(Path.home() / "AppData" / "Local" / "AURA"))) / "secrets.json"
if _secrets_file.exists():
    try:
        import json
        with open(_secrets_file, "r", encoding="utf-8") as _f:
            for _k, _v in json.load(_f).items():
                if _k not in os.environ and _v:
                    os.environ[_k] = str(_v)
    except Exception:
        pass

_env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_file.exists():
    try:
        for _line in _env_file.read_text(encoding="utf-8").splitlines():
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                _k, _v = _k.strip(), _v.strip()
                if _k not in os.environ:
                    os.environ[_k] = _v
    except Exception:
        pass

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ─── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("aura")

# ─── Config from environment ──────────────────────────────────────────────────
HOST = os.environ.get("AURA_HOST", "127.0.0.1")
PORT = int(os.environ.get("AURA_PORT", "49200"))
TOKEN = os.environ.get("AURA_TOKEN", "dev-insecure-token")

# ─── Import sub-modules ───────────────────────────────────────────────────────
from aura.storage.database import init_db
from aura.agent.router import agent_router
from aura.automation.windows.app_launcher import app_discovery_router
from aura.memory.memory_router import memory_router
from aura.scheduler.task_router import task_router
from aura.speech.speech_router import speech_router
from aura.security.auth_router import auth_router


# ─── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"AURA backend starting on {HOST}:{PORT}")
    await init_db()
    logger.info("Database initialized")
    # Kick off background app discovery
    from aura.automation.windows.app_launcher import refresh_app_registry
    try:
        await refresh_app_registry()
        logger.info("App registry refreshed")
    except Exception as e:
        logger.warning(f"App registry refresh failed (non-fatal): {e}")
    yield
    logger.info("AURA backend shutting down")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AURA Backend",
    version="0.1.0",
    docs_url=None,  # Disable public docs
    redoc_url=None,
    lifespan=lifespan,
)

# Allow local connections (Electron file:// origin null, local browser, Vite dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Auth dependency ──────────────────────────────────────────────────────────
async def verify_token(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or auth[7:] != TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ─── Health endpoint (used by Electron & frontend health checks) ─────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "0.1.0",
        "backend_ready": True,
        "host": HOST,
        "port": PORT,
    }


# ─── Register routers ─────────────────────────────────────────────────────────
app.include_router(agent_router, prefix="/agent", dependencies=[Depends(verify_token)])
app.include_router(app_discovery_router, prefix="/apps", dependencies=[Depends(verify_token)])
app.include_router(memory_router, prefix="/memory", dependencies=[Depends(verify_token)])
app.include_router(task_router, prefix="/tasks", dependencies=[Depends(verify_token)])
app.include_router(speech_router, prefix="/speech", dependencies=[Depends(verify_token)])
app.include_router(auth_router, prefix="/auth")


# ─── Global error handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "aura.main:app",
        host=HOST,
        port=PORT,
        log_level="info",
        access_log=False,
    )
