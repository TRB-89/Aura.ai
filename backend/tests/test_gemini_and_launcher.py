"""
Integration & Unit Test Suite for:
1. Native Gemini Function Calling (role='user', structured functionResponse)
2. Role='tool' rejection & history normalization
3. Deterministic "Open Google" via preferred browser
4. Deterministic app launching (Chrome, Calculator, Notepad, Word, PowerPoint, VS Code)
5. Offline resilience
6. Friendly error shielding
"""
import os
import sys
import pytest
import sqlite3
import asyncio
from pathlib import Path
from unittest.mock import patch, MagicMock

# Ensure backend root is on sys.path
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from aura.storage.database import (
    init_db,
    get_connection,
    save_message,
    get_conversation_history,
    normalize_stored_messages,
)
from aura.automation.windows.browser_launcher import (
    detect_preferred_browser,
    launch_url_in_preferred_browser,
)
from aura.automation.windows.app_launcher import (
    refresh_app_registry,
    resolve_app_name,
    launch_application,
)
from aura.agent.intent_router import route_command


@pytest.mark.asyncio
async def test_detect_preferred_browser():
    """Verify preferred browser detection identifies a valid browser and path."""
    browser_name, browser_path = detect_preferred_browser()
    assert browser_name in ["Microsoft Edge", "Google Chrome", "Mozilla Firefox", "Brave", "Default Browser"]
    assert browser_path is not None
    assert Path(browser_path).exists()


@pytest.mark.asyncio
async def test_deterministic_open_google():
    """Verify 'Open Google' routes deterministically to the browser launcher without Gemini."""
    commands = [
        "Open Google",
        "open google",
        "launch google",
        "browse google",
        "google",
        "can you open google please",
    ]
    for cmd in commands:
        result = await route_command(cmd)
        assert result.intent == "browser_open", f"Failed on command: {cmd}"
        assert not result.requires_ai
        assert "google.com" in result.response.lower()
        assert len(result.actions_taken) > 0
        assert result.actions_taken[0].tool == "browser.open_url"
        assert result.actions_taken[0].success is True


@pytest.mark.asyncio
async def test_deterministic_desktop_app_launches():
    """Verify Chrome, Calculator, Notepad, Word, PowerPoint, VS Code resolve locally."""
    await refresh_app_registry()

    test_cases = [
        ("open chrome", "google_chrome"),
        ("launch calculator", "calculator"),
        ("open notepad", "notepad"),
        ("please open word", "ms_word"),
        ("open powerpoint", "ms_powerpoint"),
        ("open vs code", "vscode"),
    ]

    for cmd, expected_id in test_cases:
        res = await route_command(cmd)
        assert res.intent == "app_launch", f"Failed for {cmd}"
        assert not res.requires_ai
        action = res.actions_taken[0]
        assert action.tool == "app.launch"
        assert action.result.get("app") == expected_id


@pytest.mark.asyncio
async def test_offline_app_launch_without_gemini():
    """Verify local commands function when GEMINI_API_KEY is not set (offline)."""
    with patch.dict(os.environ, {"GEMINI_API_KEY": ""}, clear=False):
        res = await route_command("open calculator")
        assert res.intent == "app_launch"
        assert res.actions_taken[0].success is True


@pytest.mark.asyncio
async def test_conversation_history_normalization():
    """Verify legacy messages with role='tool' are safely normalized to role='user' without deletion."""
    await init_db()
    conn = get_connection()
    try:
        # Insert a simulated legacy conversation containing role='tool'
        test_conv = "test-legacy-conv-123"
        conn.execute("INSERT OR IGNORE INTO conversations (id) VALUES (?)", (test_conv,))
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', 'What is the weather?')",
            (test_conv,)
        )
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'tool', '{\"temperature\": 72}')",
            (test_conv,)
        )
        conn.commit()

        # Run normalization
        normalize_stored_messages(conn)

        # Verify no role='tool' remains in database
        cur = conn.cursor()
        cur.execute("SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC", (test_conv,))
        rows = cur.fetchall()
        roles = [r["role"] for r in rows]
        assert "tool" not in roles, f"Found unsupported role in {roles}"
        assert roles == ["user", "user"]

        # Verify get_conversation_history also guarantees strict normalization
        hist = get_conversation_history(test_conv)
        for h in hist:
            assert h["role"] in ("user", "model")
    finally:
        conn.close()


@pytest.mark.asyncio
async def test_friendly_error_shielding_on_gemini_failure():
    """Verify raw API error JSON is never returned to the user when Gemini fails."""
    with patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_key_for_test"}):
        with patch("aura.agent.gemini_agent.GeminiAgent.process", side_effect=Exception("400 INVALID_ARGUMENT: Role 'tool' is not supported")):
            res = await route_command("generate an ultra complex simulation of Mars")
            assert "400 INVALID_ARGUMENT" not in res.response
            assert "Role 'tool'" not in res.response
            assert "I couldn't process that AI request" in res.response


@pytest.mark.asyncio
async def test_live_gemini_native_function_calling():
    """Perform real integration test with Gemini API using native function calling format."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        env_file = Path(__file__).resolve().parent.parent.parent / ".env"
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                if line.startswith("GEMINI_API_KEY="):
                    gemini_key = line.split("=", 1)[1].strip()
                    break

    if not gemini_key:
        pytest.skip("No GEMINI_API_KEY configured for live test")

    import google.genai as genai
    import google.genai.types as types

    client = genai.Client(api_key=gemini_key)
    model = os.environ.get("AURA_GEMINI_MODEL", "gemini-3.5-flash-lite")

    tools = [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="browser_open_url",
                    description="Open a URL in the browser",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "url": types.Schema(type=types.Type.STRING, description="The URL to open"),
                        },
                        required=["url"]
                    )
                )
            ]
        )
    ]

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text="Please open https://www.google.com in my browser")]
        )
    ]

    # First turn
    resp1 = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            tools=tools,
            temperature=0.2,
        )
    )

    cand = resp1.candidates[0]
    assert cand.content.role == "model"
    fc_part = [p for p in cand.content.parts if p.function_call]
    assert len(fc_part) > 0, "Gemini did not return expected function call"
    fc = fc_part[0].function_call

    # Second turn with function result: MUST BE role='user'
    contents.append(cand.content)
    contents.append(types.Content(
        role="user",
        parts=[types.Part.from_function_response(
            name=fc.name,
            response={"success": True, "message": "Browser opened https://www.google.com"},
        )]
    ))

    resp2 = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            tools=tools,
            temperature=0.2,
        )
    )

    assert resp2.text is not None
    assert len(resp2.text.strip()) > 0
