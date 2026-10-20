"""
AURA Memory API Router
Provides endpoints to store, search, list, and delete personal memories and preferences.
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from aura.memory.memory_service import search_memories, get_all_memories, save_memory, delete_memory

memory_router = APIRouter()


class MemoryCreateRequest(BaseModel):
    category: str = "general"
    content: str
    source: str = "user"


@memory_router.get("/")
async def list_memories(limit: int = Query(50, ge=1, le=200)):
    memories = await get_all_memories(limit=limit)
    return {"memories": memories}


@memory_router.get("/search")
async def search(q: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=50)):
    results = await search_memories(query=q, limit=limit)
    return {"query": q, "results": results}


@memory_router.post("/")
async def create_memory(body: MemoryCreateRequest):
    result = await save_memory(category=body.category, content=body.content, source=body.source)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@memory_router.delete("/{memory_id}")
async def remove_memory(memory_id: int):
    result = await delete_memory(memory_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result
