"""
AURA Agent Router — Phase 2+3
Handles all /agent/* endpoints:
  POST /agent/command     — process a user command
  POST /agent/cancel/{id} — cancel a specific task
  POST /agent/cancel-all  — emergency stop
  GET  /agent/status/{id} — get task status
"""
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from aura.agent.intent_router import route_command, CommandResult

logger = logging.getLogger("aura.agent")
agent_router = APIRouter()

# In-memory task registry (Phase 6 will persist to SQLite)
_active_tasks: dict[str, dict] = {}


class CommandRequest(BaseModel):
    text: str
    conversation_id: str
    stream: bool = False


class CancelRequest(BaseModel):
    reason: Optional[str] = None


@agent_router.post("/command")
async def handle_command(req: CommandRequest):
    """Process a user command through the intent router → tools → response."""
    task_id = str(uuid.uuid4())
    logger.info(f"[{task_id}] Command: {req.text!r}")

    _active_tasks[task_id] = {
        "id": task_id,
        "request": req.text,
        "status": "running",
        "conversation_id": req.conversation_id,
    }

    try:
        result: CommandResult = await route_command(
            text=req.text,
            conversation_id=req.conversation_id,
            task_id=task_id,
        )
        _active_tasks[task_id]["status"] = "completed"
        return {
            "message_id": task_id,
            "response": result.response,
            "actions_taken": [a.model_dump() for a in result.actions_taken],
            "task_id": task_id,
        }
    except Exception as e:
        logger.error(f"[{task_id}] Unhandled error: {e}", exc_info=True)
        _active_tasks[task_id]["status"] = "failed"
        return {
            "message_id": task_id,
            "response": "I couldn't process that request right now, but I can still open applications and automate tasks locally.",
            "actions_taken": [],
            "task_id": task_id,
            "error": "Request processed with local fallback",
        }
    finally:
        # Clean up old tasks (keep last 50)
        if len(_active_tasks) > 50:
            oldest = list(_active_tasks.keys())[:-50]
            for k in oldest:
                del _active_tasks[k]


@agent_router.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    """Cancel a specific in-flight task."""
    if task_id in _active_tasks:
        _active_tasks[task_id]["status"] = "canceled"
        logger.info(f"Task {task_id} canceled")
    return {"canceled": task_id}


@agent_router.post("/cancel-all")
async def cancel_all():
    """Emergency stop — cancel all running tasks."""
    canceled = []
    for tid, task in _active_tasks.items():
        if task["status"] == "running":
            task["status"] = "canceled"
            canceled.append(tid)
    logger.warning(f"Emergency stop: {len(canceled)} tasks canceled")
    return {"canceled": canceled}


@agent_router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    task = _active_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
