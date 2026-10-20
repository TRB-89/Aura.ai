"""
AURA Task and Scheduler API Router
Provides endpoints to manage tasks, reminders, and daily routines.
"""
import logging
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from aura.storage.database import get_connection

logger = logging.getLogger("aura.tasks")

task_router = APIRouter()


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_at: Optional[str] = None
    project_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_at: Optional[str] = None
    status: Optional[str] = None


@task_router.get("/")
async def list_tasks(status: Optional[str] = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if status:
            cursor.execute("SELECT * FROM tasks WHERE status = ? ORDER BY id DESC", (status,))
        else:
            cursor.execute("SELECT * FROM tasks ORDER BY id DESC")
        rows = cursor.fetchall()
        return {"tasks": [dict(r) for r in rows]}
    finally:
        conn.close()


@task_router.post("/")
async def create_task(task: TaskCreate):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO tasks (title, description, priority, due_at, project_id, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
            """,
            (task.title, task.description, task.priority, task.due_at, task.project_id)
        )
        conn.commit()
        return {"success": True, "id": cursor.lastrowid, "message": "Task created"}
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@task_router.put("/{task_id}")
async def update_task(task_id: int, task: TaskUpdate):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        fields = []
        values = []
        if task.title is not None:
            fields.append("title = ?")
            values.append(task.title)
        if task.description is not None:
            fields.append("description = ?")
            values.append(task.description)
        if task.priority is not None:
            fields.append("priority = ?")
            values.append(task.priority)
        if task.due_at is not None:
            fields.append("due_at = ?")
            values.append(task.due_at)
        if task.status is not None:
            fields.append("status = ?")
            values.append(task.status)

        if not fields:
            return {"success": True, "message": "No changes requested"}

        fields.append("updated_at = datetime('now')")
        values.append(task_id)

        query = f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        return {"success": True, "message": f"Task #{task_id} updated"}
    finally:
        conn.close()


@task_router.delete("/{task_id}")
async def delete_task(task_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        return {"success": True, "message": f"Task #{task_id} deleted"}
    finally:
        conn.close()
