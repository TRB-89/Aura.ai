"""
AURA Memory Service
Handles persistent personal memory, context search, and preference retrieval.
"""
import logging
from typing import List, Dict, Any, Optional
from aura.storage.database import get_connection

logger = logging.getLogger("aura.memory")


async def search_memories(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search stored memories using full text / keyword matching."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        search_term = f"%{query}%"
        cursor.execute(
            """
            SELECT id, category, content, source, approval_status, created_at, updated_at
            FROM memories
            WHERE content LIKE ? OR category LIKE ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (search_term, search_term, limit)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Error searching memories: {e}")
        return []
    finally:
        conn.close()


async def get_all_memories(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve recent memories."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, category, content, source, approval_status, created_at, updated_at
            FROM memories
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Error fetching memories: {e}")
        return []
    finally:
        conn.close()


async def save_memory(category: str, content: str, source: str = "user") -> Dict[str, Any]:
    """Store a new fact or user preference."""
    if not content or not content.strip():
        return {"success": False, "error": "Content cannot be empty"}

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO memories (category, content, source, approval_status)
            VALUES (?, ?, ?, 'approved')
            """,
            (category.strip() or "general", content.strip(), source)
        )
        conn.commit()
        mem_id = cursor.lastrowid
        logger.info(f"Saved memory #{mem_id} [{category}]: {content[:40]}...")
        return {"success": True, "id": mem_id, "message": "Memory saved successfully"}
    except Exception as e:
        logger.error(f"Error saving memory: {e}")
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


async def delete_memory(memory_id: int) -> Dict[str, Any]:
    """Remove a specific memory."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        conn.commit()
        return {"success": True, "message": f"Memory #{memory_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting memory: {e}")
        return {"success": False, "error": str(e)}
    finally:
        conn.close()
