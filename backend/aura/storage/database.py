"""
SQLite database initialization using aiosqlite for async access.
WAL mode enabled for concurrent readers.
"""
import sqlite3
import os
import logging
from pathlib import Path

logger = logging.getLogger("aura.storage")

# Database lives in user's app data
DB_PATH = Path(os.environ.get(
    "AURA_DB_PATH",
    str(Path.home() / "AppData" / "Local" / "AURA" / "aura.db")
))


def get_db_path() -> Path:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return DB_PATH


def get_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def normalize_stored_messages(conn: sqlite3.Connection):
    """
    Safely migrate and normalize any stored messages with unsupported roles (e.g. role='tool').
    Preserves all conversation history and function call/result context without deleting records.
    """
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM messages WHERE role = 'tool'")
        count = cur.fetchone()[0]
        if count > 0:
            logger.info(f"Normalizing {count} stored messages with role='tool' to role='user'")
            cur.execute("UPDATE messages SET role = 'user' WHERE role = 'tool'")
            conn.commit()
    except Exception as e:
        logger.warning(f"Error normalizing stored messages: {e}")


def save_message(conversation_id: str, role: str, content: str) -> int:
    """Save a message to the conversation history, ensuring a valid role."""
    safe_role = "user" if role in ("user", "tool") else "assistant"
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO conversations (id, started_at) VALUES (?, datetime('now'))",
            (conversation_id,)
        )
        cur = conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (conversation_id, safe_role, str(content))
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def get_conversation_history(conversation_id: str, limit: int = 20) -> list[dict]:
    """Retrieve recent messages for a conversation, safely normalized for Gemini."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT role, content FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            LIMIT ?
            """,
            (conversation_id, limit)
        )
        rows = cur.fetchall()
        messages = []
        for row in rows:
            r = row["role"]
            content = row["content"]
            # Normalize role: never output 'tool'
            if r == "tool":
                r = "user"
            elif r in ("assistant", "model"):
                r = "model"
            else:
                r = "user"
            messages.append({"role": r, "content": content})
        return messages
    finally:
        conn.close()


async def init_db():
    """Create all tables if they don't exist and run safe migrations."""
    logger.info(f"Initializing database at {get_db_path()}")
    conn = get_connection()
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
        normalize_stored_messages(conn)
        logger.info("Schema applied and messages normalized successfully")
    finally:
        conn.close()


SCHEMA_SQL = """
-- Application registry
CREATE TABLE IF NOT EXISTS application_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    canonical_identifier TEXT UNIQUE NOT NULL,
    launch_target TEXT NOT NULL,
    aliases TEXT DEFAULT '[]',
    available INTEGER DEFAULT 1,
    last_checked TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Users / preferences
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY DEFAULT 1,
    display_name TEXT DEFAULT 'User',
    preferences TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    directory_path TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    editor TEXT,
    browser TEXT,
    configured_resources TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    due_at TEXT,
    status TEXT DEFAULT 'pending',
    project_id INTEGER REFERENCES projects(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id),
    content TEXT NOT NULL,
    schedule_rule TEXT,
    timezone TEXT DEFAULT 'UTC',
    next_run TEXT,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Memory
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'user',
    approval_status TEXT DEFAULT 'approved',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    summary TEXT
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT REFERENCES conversations(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Agent executions
CREATE TABLE IF NOT EXISTS agent_executions (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    request TEXT NOT NULL,
    state TEXT DEFAULT 'planning',
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    result_summary TEXT
);

-- Action results
CREATE TABLE IF NOT EXISTS action_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id TEXT REFERENCES agent_executions(id),
    tool_name TEXT NOT NULL,
    sanitized_arguments TEXT,
    state TEXT DEFAULT 'running',
    verified_result TEXT,
    error_code TEXT,
    duration_ms INTEGER
);

-- User permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_type TEXT NOT NULL,
    scope TEXT,
    allowed INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_action_results_exec ON action_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_app_registry_canonical ON application_registry(canonical_identifier);
"""
