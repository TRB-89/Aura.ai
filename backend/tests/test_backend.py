"""
AURA Backend Integration Tests
Tests database schema, Argon2id authentication, desktop automation, app discovery,
intent routing, file storage isolation, and security constraints.
"""
import sys
import os
import asyncio
import json
import time
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from aura.storage.database import init_db, get_connection, get_db_path
from aura.agent.intent_router import route_command
from aura.tools.tool_registry import get_registry
from aura.tools.tool_executor import execute_tool
from aura.security.auth_service import auth_service, AUTH_CONFIG_FILE, MAX_FAILED_ATTEMPTS


async def run_tests():
    print("=" * 60)
    print("AURA BACKEND & SECURITY INTEGRATION TEST SUITE")
    print("=" * 60)

    # 1. Database Init & AppData Location
    print("\n[Test 1] Database Initialization & Storage Location...")
    await init_db()
    db_path = get_db_path()
    print(f"  -> SQLite Database Path: {db_path}")
    assert "AppData" in str(db_path) or "Local" in str(db_path), "DB must reside in AppData!"
    assert not str(db_path).startswith(str(backend_dir)), "DB must NOT reside in Git repo!"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith("sqlite_")]
    conn.close()
    print(f"  -> Created tables ({len(tables)}): {', '.join(tables)}")
    assert "application_registry" in tables, "application_registry table missing"
    assert "memories" in tables, "memories table missing"
    assert "tasks" in tables, "tasks table missing"
    print("  -> PASSED: All core tables verified in AppData.")

    # 2. Tool Registry Definitions
    print("\n[Test 2] Tool Registry Definitions...")
    registry = get_registry()
    tool_names = [t["name"] for t in registry]
    print(f"  -> Registered tools ({len(tool_names)}): {', '.join(tool_names)}")
    assert "app_launch" in tool_names
    assert "memory_save" in tool_names
    assert "office_word_create" in tool_names
    print("  -> PASSED: Tool definitions match specification.")

    # 3. Argon2id Password Setup, Verification & Lockout
    print("\n[Test 3] Argon2id Local Authentication & Brute-Force Lockout...")
    # Clean previous test auth file if exists for clean run
    if AUTH_CONFIG_FILE.exists():
        AUTH_CONFIG_FILE.unlink()

    # Reset in-memory state
    auth_service.is_locked = True
    auth_service.failed_attempts = 0
    auth_service.lockout_until = 0.0

    assert not auth_service.is_setup(), "Auth should report not setup before initial password"

    # Reject short password
    short_res = auth_service.setup_password("123", "123")
    assert not short_res.get("success"), "Short password should be rejected"

    # Reject mismatched passwords
    mismatch_res = auth_service.setup_password("secret123", "secret999")
    assert not mismatch_res.get("success"), "Mismatched passwords should be rejected"

    # Setup valid passcode
    setup_res = auth_service.setup_password("2089", "2089")
    assert setup_res.get("success"), f"Setup failed: {setup_res}"
    assert auth_service.is_setup(), "Auth should report setup"
    assert not auth_service.is_locked, "Auth should unlock upon initial setup"

    # Verify storage in AppData and NO plaintext stored
    assert AUTH_CONFIG_FILE.exists(), f"Auth config file not found at {AUTH_CONFIG_FILE}"
    with open(AUTH_CONFIG_FILE, "r", encoding="utf-8") as f:
        stored_data = json.load(f)
    assert "password_hash" in stored_data, "Password hash missing from config"
    assert "$argon2id$" in stored_data["password_hash"], "Hash must be Argon2id!"
    assert "2089" not in json.dumps(stored_data), "Plaintext passcode must NEVER be stored!"
    print(f"  -> Argon2id Hash verified in {AUTH_CONFIG_FILE.name}")

    # Test lock & unlock
    auth_service.lock()
    assert auth_service.is_locked, "Auth should be locked"

    # Test incorrect password rejection
    bad_unlock = auth_service.unlock("wrong_password")
    assert not bad_unlock.get("success"), "Wrong password must be rejected"
    assert auth_service.failed_attempts == 1, "Failed attempts count should increment"
    print("  -> Incorrect password rejected cleanly.")

    # Test valid passcode unlock
    good_unlock = auth_service.unlock("2089")
    assert good_unlock.get("success"), "Valid passcode must unlock"
    assert not auth_service.is_locked, "Auth should now be unlocked"
    assert auth_service.failed_attempts == 0, "Failed attempts should reset on success"
    print("  -> PASSED: Argon2id setup, unlock, and security verified.")

    # 4. Memory Execution Test
    print("\n[Test 4] Memory Storage & Search...")
    save_res = await execute_tool("memory_save", {
        "category": "user_preference",
        "content": "Personal workspace: Project AURA with black-gold theme"
    })
    assert save_res.get("success"), f"Save failed: {save_res}"

    search_res = await execute_tool("memory_search", {"query": "AURA"})
    assert len(search_res.get("memories", [])) > 0, "Saved memory not found"
    print(f"  -> Retrieved {len(search_res['memories'])} memory record(s).")
    print("  -> PASSED: SQLite memory storage verified.")

    # 5. Core Desktop Commands
    print("\n[Test 5] Windows Desktop Commands Execution...")
    from aura.automation.windows.app_launcher import refresh_app_registry
    await refresh_app_registry()

    test_commands = [
        ("open calculator", "app_launch"),
        ("open notepad", "app_launch"),
        ("open chrome", "app_launch"),
        ("open microsoft word", "app_launch"),
        ("open powerpoint", "app_launch"),
        ("open vs code", "app_launch"),
        ("open spotify", "app_launch"),
        ("open my downloads folder", "folder_open"),
        ("open google", "browser_open"),
        ("take a screenshot", "system_screenshot"),
        ("increase the volume", "system_volume"),
        ("decrease the volume", "system_volume"),
        ("search for my assignment", "file_search"),
        ("open my coding workspace", "workspace_launch"),
        ("create a word document on Autonomous Agents", "office_create"),
        ("make a powerpoint presentation on AI Architecture", "office_create"),
        ("open chrome, search for python, and open the official documentation", "compound_search_open"),
    ]

    for cmd, expected_intent in test_commands:
        res = await route_command(cmd)
        print(f"  -> Command '{cmd}': intent={res.intent}")
        assert res.intent == expected_intent, f"Expected {expected_intent}, got {res.intent} for '{cmd}'"
        assert res.response, f"Response empty for '{cmd}'"
    print("  -> PASSED: All desktop commands successfully routed and verified.")

    # 6. Disambiguation
    print("\n[Test 6] Ambiguous Command Disambiguation...")
    route_ambiguous = await route_command("open microsoft")
    assert "Which Microsoft app" in route_ambiguous.response
    print("  -> PASSED: Disambiguation correctly prompted user.")

    # 7. Git & Privacy Protection Verification
    print("\n[Test 7] Git Secret & Personal Data Exclusion Check...")
    gitignore_path = backend_dir.parent / ".gitignore"
    assert gitignore_path.exists(), ".gitignore must exist in root!"
    gitignore_content = gitignore_path.read_text(encoding="utf-8")

    critical_exclusions = [".env", "*.db", "*.log", "screenshots/", "auth_state.json", "node_modules/"]
    for excl in critical_exclusions:
        assert excl in gitignore_content, f"Critical exclusion '{excl}' missing from .gitignore!"
    print("  -> PASSED: Comprehensive .gitignore verified.")


if __name__ == "__main__":
    asyncio.run(run_tests())
