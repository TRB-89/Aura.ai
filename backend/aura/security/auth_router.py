"""
AURA Authentication API Router
Exposes local password management and unlock endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from aura.security.auth_service import auth_service

auth_router = APIRouter(tags=["auth"])


class SetupPasswordRequest(BaseModel):
    password: str = Field(..., min_length=4)
    confirm_password: str = Field(..., min_length=4)


class UnlockRequest(BaseModel):
    password: str = Field(..., min_length=1)


@auth_router.get("/status")
async def get_auth_status():
    return auth_service.get_status()


@auth_router.post("/setup")
async def setup_password(payload: SetupPasswordRequest):
    result = auth_service.setup_password(payload.password, payload.confirm_password)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@auth_router.post("/unlock")
async def unlock_app(payload: UnlockRequest):
    result = auth_service.unlock(payload.password)
    if not result.get("success"):
        raise HTTPException(status_code=401, detail=result.get("error"))
    return result


@auth_router.post("/lock")
async def lock_app():
    return auth_service.lock()


@auth_router.post("/heartbeat")
async def auth_heartbeat():
    auth_service.record_activity()
    return {"status": "ok"}
