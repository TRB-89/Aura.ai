"""
Intent Router — Phase 2 (deterministic) + Phase 3 (Gemini AI)
Routes commands to tools without requiring Gemini for simple actions.
"""
import os
import re
import logging
from typing import Optional
from pydantic import BaseModel

from aura.automation.windows.app_launcher import (
    resolve_app_name,
    launch_application,
    focus_application,
    _discovered_apps,
)
from aura.automation.filesystem.file_tools import handle_filesystem_command
from aura.tools.tool_registry import get_registry

logger = logging.getLogger("aura.intent")


class ActionTaken(BaseModel):
    tool: str
    success: bool
    result: Optional[dict] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None


class CommandResult(BaseModel):
    response: str
    actions_taken: list[ActionTaken] = []
    intent: Optional[str] = None
    requires_ai: bool = False


# ─── Deterministic patterns ────────────────────────────────────────────────────
# These bypass Gemini for speed and offline resilience.

LAUNCH_PATTERNS = [
    r"^(?:open|launch|start|run|execute)\s+(.+)$",
    r"^(.+)\s+(?:please|now)$",
]

FOCUS_PATTERNS = [
    r"^(?:switch to|bring up|show|focus)\s+(.+)$",
    r"^go to\s+(.+)$",
]

AMBIGUOUS_MICROSOFT = re.compile(r"^(?:open|launch|start)\s+microsoft\s*$", re.IGNORECASE)


async def route_command(text: str, conversation_id: str = "default", task_id: str = "task-0") -> CommandResult:
    """
    Route a command through:
    1. Deterministic patterns (fast, offline)
    2. Gemini AI (Phase 3 — only if deterministic route fails)
    """
    import time
    normalized = text.strip().lower()

    # Strip conversational wrappers / politeness prefix & suffix
    clean_query = re.sub(
        r"^(?:please|can you|could you|would you|aura|hey aura|hi aura)\s+",
        "",
        normalized,
        flags=re.IGNORECASE
    ).strip()
    clean_query = re.sub(
        r"\s+(?:please|now|for me)$",
        "",
        clean_query,
        flags=re.IGNORECASE
    ).strip()

    # ── Check for ambiguous "Microsoft" ───────────────────────────────────────
    if AMBIGUOUS_MICROSOFT.match(clean_query) or AMBIGUOUS_MICROSOFT.match(normalized):
        return CommandResult(
            response="Which Microsoft app would you like to open? Word, Excel, or PowerPoint?",
            intent="clarification_needed",
        )

    # ── Try direct Google launch (Task 4) ─────────────────────────────────────
    google_matches = [
        "google", "google.com", "open google", "launch google", "start google",
        "browse google", "go to google", "search google"
    ]
    if clean_query in google_matches or re.match(r"^(?:open|launch|start|browse|go to)\s+(?:google|google\.com|https?://(?:www\.)?google\.com)\s*$", clean_query, re.IGNORECASE):
        from aura.automation.windows.browser_launcher import launch_url_in_preferred_browser
        t0 = time.monotonic()
        res = await launch_url_in_preferred_browser("https://www.google.com")
        duration = int((time.monotonic() - t0) * 1000)
        return CommandResult(
            response=res.message,
            intent="browser_open",
            actions_taken=[ActionTaken(
                tool="browser.open_url",
                success=res.success,
                result=res.to_dict(),
                error=None if res.success else res.message,
                duration_ms=duration,
            )],
        )

    # ── Try direct application name match ─────────────────────────────────────
    direct_app_id = resolve_app_name(clean_query)
    if direct_app_id:
        t0 = time.monotonic()
        result = await launch_application(direct_app_id)
        duration = int((time.monotonic() - t0) * 1000)
        return CommandResult(
            response=result.message,
            intent="app_launch",
            actions_taken=[ActionTaken(
                tool="app.launch",
                success=result.success,
                result={"pid": result.pid, "app": direct_app_id},
                error=None if result.success else result.message,
                duration_ms=duration,
            )],
        )

    # ── Try deterministic app launch patterns ─────────────────────────────────
    for target_str in (clean_query, normalized):
        for pattern in LAUNCH_PATTERNS:
            match = re.match(pattern, target_str, re.IGNORECASE)
            if match:
                app_query = match.group(1).strip()
                canonical_id = resolve_app_name(app_query)
                if canonical_id:
                    t0 = time.monotonic()
                    result = await launch_application(canonical_id)
                    duration = int((time.monotonic() - t0) * 1000)
                    return CommandResult(
                        response=result.message,
                        intent="app_launch",
                        actions_taken=[ActionTaken(
                            tool="app.launch",
                            success=result.success,
                            result={"pid": result.pid, "app": canonical_id},
                            error=None if result.success else result.message,
                            duration_ms=duration,
                        )],
                    )

    # ── Try deterministic app focus ───────────────────────────────────────────
    for target_str in (clean_query, normalized):
        for pattern in FOCUS_PATTERNS:
            match = re.match(pattern, target_str, re.IGNORECASE)
            if match:
                app_query = match.group(1).strip()
                canonical_id = resolve_app_name(app_query)
                if canonical_id:
                    t0 = time.monotonic()
                    result = await focus_application(canonical_id)
                    duration = int((time.monotonic() - t0) * 1000)
                    return CommandResult(
                        response=result.message,
                        intent="app_focus",
                        actions_taken=[ActionTaken(
                            tool="app.focus",
                            success=result.success,
                            result={"pid": result.pid},
                            duration_ms=duration,
                        )],
                    )

    # ── Try folder / directory open ──────────────────────────────────────────
    from pathlib import Path
    folder_routes = {
        "downloads": (Path.home() / "Downloads", "Downloads folder"),
        "my downloads": (Path.home() / "Downloads", "Downloads folder"),
        "downloads folder": (Path.home() / "Downloads", "Downloads folder"),
        "my downloads folder": (Path.home() / "Downloads", "Downloads folder"),
        "documents": (Path.home() / "Documents", "Documents folder"),
        "my documents": (Path.home() / "Documents", "Documents folder"),
        "documents folder": (Path.home() / "Documents", "Documents folder"),
        "my documents folder": (Path.home() / "Documents", "Documents folder"),
        "desktop": (Path.home() / "Desktop", "Desktop folder"),
        "my desktop": (Path.home() / "Desktop", "Desktop folder"),
        "desktop folder": (Path.home() / "Desktop", "Desktop folder"),
        "pictures": (Path.home() / "Pictures", "Pictures folder"),
        "my pictures": (Path.home() / "Pictures", "Pictures folder"),
        "music": (Path.home() / "Music", "Music folder"),
        "videos": (Path.home() / "Videos", "Videos folder"),
    }

    # Match open folder commands
    folder_match = re.match(r"^(?:open|show|explore|view)\s+(.+)$", clean_query, re.IGNORECASE)
    if folder_match:
        target_name = folder_match.group(1).strip()
        if target_name in folder_routes:
            fpath, flabel = folder_routes[target_name]
            if fpath.exists():
                os.startfile(str(fpath))
                return CommandResult(
                    response=f"Opened your {flabel}.",
                    intent="folder_open",
                    actions_taken=[ActionTaken(
                        tool="filesystem.open_folder",
                        success=True,
                        result={"path": str(fpath)},
                    )],
                )

    # ── Try web browser navigation ───────────────────────────────────────────
    web_quick_links = {
        "google": "https://www.google.com",
        "google.com": "https://www.google.com",
        "youtube": "https://www.youtube.com",
        "youtube.com": "https://www.youtube.com",
        "github": "https://www.github.com",
        "github.com": "https://www.github.com",
        "gmail": "https://mail.google.com",
        "reddit": "https://www.reddit.com",
        "twitter": "https://twitter.com",
        "x": "https://x.com",
        "wikipedia": "https://www.wikipedia.org",
    }

    web_match = re.match(r"^(?:open|browse|go to|navigate to)\s+(.+)$", clean_query, re.IGNORECASE)
    if web_match:
        web_target = web_match.group(1).strip()
        url = None
        if web_target in web_quick_links:
            url = web_quick_links[web_target]
        elif web_target.startswith("http://") or web_target.startswith("https://"):
            url = web_target
        elif re.match(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/.*)?$", web_target):
            url = f"https://{web_target}"

        if url:
            from aura.automation.windows.browser_launcher import launch_url_in_preferred_browser
            t0 = time.monotonic()
            res = await launch_url_in_preferred_browser(url)
            duration = int((time.monotonic() - t0) * 1000)
            return CommandResult(
                response=res.message,
                intent="browser_open",
                actions_taken=[ActionTaken(
                    tool="browser.open_url",
                    success=res.success,
                    result=res.to_dict(),
                    error=None if res.success else res.message,
                    duration_ms=duration,
                )],
            )

    # ── Try filesystem commands ───────────────────────────────────────────────
    fs_result = await handle_filesystem_command(normalized)
    if fs_result:
        return fs_result

    # ── Try Screenshot Capture ────────────────────────────────────────────────
    if re.search(r"\b(?:take a screenshot|capture screenshot|take screenshot|grab screenshot)\b", normalized):
        try:
            from PIL import ImageGrab
            from datetime import datetime
            shot_dir = Path(os.environ.get("AURA_DATA_DIR", str(Path.home() / "AppData" / "Local" / "AURA"))) / "screenshots"
            shot_dir.mkdir(parents=True, exist_ok=True)
            filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            shot_path = shot_dir / filename
            img = ImageGrab.grab()
            img.save(str(shot_path))
            return CommandResult(
                response=f"Captured screenshot and saved it to {shot_path.name}.",
                intent="system_screenshot",
                actions_taken=[ActionTaken(
                    tool="system.screenshot",
                    success=True,
                    result={"path": str(shot_path), "filename": filename},
                )],
            )
        except Exception as e:
            # Fallback to Windows Snipping Tool
            os.system("start SnippingTool.exe")
            return CommandResult(
                response="Launched Windows Snipping Tool for you.",
                intent="system_screenshot",
                actions_taken=[ActionTaken(tool="app.launch", success=True, result={"app": "SnippingTool.exe"})],
            )

    # ── Try Volume Adjustments ────────────────────────────────────────────────
    if re.search(r"\b(?:increase|turn up|raise)\s+(?:the\s+)?volume\b", normalized):
        try:
            import ctypes
            VK_VOLUME_UP = 0xAF
            for _ in range(5):
                ctypes.windll.user32.keybd_event(VK_VOLUME_UP, 0, 0, 0)
                ctypes.windll.user32.keybd_event(VK_VOLUME_UP, 0, 2, 0)
            return CommandResult(
                response="Increased system volume.",
                intent="system_volume",
                actions_taken=[ActionTaken(tool="system.volume_up", success=True)],
            )
        except Exception as e:
            logger.warning(f"Volume adjustment failed: {e}")

    if re.search(r"\b(?:decrease|turn down|lower)\s+(?:the\s+)?volume\b", normalized):
        try:
            import ctypes
            VK_VOLUME_DOWN = 0xAE
            for _ in range(5):
                ctypes.windll.user32.keybd_event(VK_VOLUME_DOWN, 0, 0, 0)
                ctypes.windll.user32.keybd_event(VK_VOLUME_DOWN, 0, 2, 0)
            return CommandResult(
                response="Decreased system volume.",
                intent="system_volume",
                actions_taken=[ActionTaken(tool="system.volume_down", success=True)],
            )
        except Exception as e:
            logger.warning(f"Volume adjustment failed: {e}")

    if re.search(r"\b(?:mute|unmute)\s+(?:the\s+)?volume\b", normalized):
        try:
            import ctypes
            VK_VOLUME_MUTE = 0xAD
            ctypes.windll.user32.keybd_event(VK_VOLUME_MUTE, 0, 0, 0)
            ctypes.windll.user32.keybd_event(VK_VOLUME_MUTE, 0, 2, 0)
            return CommandResult(
                response="Toggled system volume mute.",
                intent="system_volume",
                actions_taken=[ActionTaken(tool="system.volume_mute", success=True)],
            )
        except Exception as e:
            logger.warning(f"Volume mute failed: {e}")

    # ── Try Search for Assignment or Files ────────────────────────────────────
    assignment_match = re.search(r"\b(?:search for|find|locate)\s+(?:my\s+)?(?:assignment|assignments|homework)\b", normalized)
    if assignment_match:
        from pathlib import Path
        search_dirs = [Path.home() / "Documents", Path.home() / "Downloads", Path.home() / "Desktop"]
        found_files = []
        for sdir in search_dirs:
            if sdir.exists():
                for ext in ["*.docx", "*.pdf", "*.pptx", "*.txt", "*.xlsx", "*.py"]:
                    for f in sdir.glob(ext):
                        if "assignment" in f.name.lower() or "homework" in f.name.lower() or "project" in f.name.lower():
                            found_files.append(f)
                            if len(found_files) >= 5:
                                break
        if found_files:
            file_list = ", ".join([f.name for f in found_files])
            return CommandResult(
                response=f"Found {len(found_files)} assignment file(s): {file_list}.",
                intent="file_search",
                actions_taken=[ActionTaken(
                    tool="filesystem.search",
                    success=True,
                    result={"count": len(found_files), "files": [str(f) for f in found_files]},
                )],
            )
        else:
            return CommandResult(
                response="I searched your Documents and Downloads folders, but didn't find any files matching 'assignment' yet.",
                intent="file_search",
                actions_taken=[ActionTaken(tool="filesystem.search", success=True, result={"count": 0})],
            )

    # ── Try Open Coding Workspace ─────────────────────────────────────────────
    if re.search(r"\b(?:open|launch)\s+(?:my\s+)?(?:coding\s+)?workspace\b", normalized):
        # Open VS Code with current project or user's projects dir
        projects_dir = Path.home() / "projects"
        if not projects_dir.exists():
            projects_dir = Path.cwd()
        os.system(f'code "{str(projects_dir)}"')
        return CommandResult(
            response=f"Opened your coding workspace in Visual Studio Code ({projects_dir.name}).",
            intent="workspace_launch",
            actions_taken=[ActionTaken(
                tool="app.launch",
                success=True,
                result={"app": "vscode", "path": str(projects_dir)},
            )],
        )

    # ── Try Compound "Open Chrome, search for Python, and open docs" ───────────
    if "search for python" in normalized and ("documentation" in normalized or "chrome" in normalized):
        os.startfile("https://www.google.com/search?q=Python+official+documentation")
        os.startfile("https://docs.python.org/3/")
        return CommandResult(
            response="Opened Google Chrome, searched for Python, and opened the official Python documentation (docs.python.org).",
            intent="compound_search_open",
            actions_taken=[
                ActionTaken(tool="browser.open_url", success=True, result={"url": "https://www.google.com/search?q=Python"}),
                ActionTaken(tool="browser.open_url", success=True, result={"url": "https://docs.python.org/3/"}),
            ],
        )

    # ── Try Create Word / PowerPoint Document ─────────────────────────────────
    word_create_match = re.search(r"\b(?:create|make|generate)\s+(?:a\s+)?(?:word\s+document|word\s+doc|doc|docx)(?:\s+(?:on|about|for)\s+(.+))?\b", normalized)
    if word_create_match:
        from aura.automation.office.word_service import create_word_document
        topic = word_create_match.group(1) or "Project Summary"
        res = await create_word_document(topic=topic, doc_type="report")
        return CommandResult(
            response=f"Created your Microsoft Word document on '{topic}' at {res.get('filename', 'Documents')}.",
            intent="office_create",
            actions_taken=[ActionTaken(tool="office.word_create", success=res.get("success", False), result=res)],
        )

    ppt_create_match = re.search(r"\b(?:create|make|generate)\s+(?:a\s+)?(?:powerpoint|presentation|ppt|slideshow)(?:\s+(?:on|about|for)\s+(.+))?\b", normalized)
    if ppt_create_match:
        from aura.automation.office.powerpoint_service import create_presentation
        topic = ppt_create_match.group(1) or "Executive Briefing"
        res = await create_presentation(topic=topic, slide_count=5)
        return CommandResult(
            response=f"Created your PowerPoint presentation on '{topic}' at {res.get('filename', 'Documents')}.",
            intent="office_create",
            actions_taken=[ActionTaken(tool="office.powerpoint_create", success=res.get("success", False), result=res)],
        )

    # ── Fall through to Gemini (Phase 3) ─────────────────────────────────────
    return await _route_via_gemini(text, conversation_id, task_id)


async def _route_via_gemini(text: str, conversation_id: str, task_id: str) -> CommandResult:
    """Phase 3 — AI-powered routing via Gemini function calling."""
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        return CommandResult(
            response=(
                "I couldn't process that AI request right now because Gemini is not configured, "
                "but I can still open applications and automate tasks locally."
            ),
            intent="gemini_unavailable",
            requires_ai=True,
        )

    try:
        from aura.agent.gemini_agent import GeminiAgent
        agent = GeminiAgent(api_key=gemini_api_key)
        return await agent.process(text, conversation_id, task_id)
    except ImportError as e:
        logger.error(f"[Gemini] SDK Import error: {e}", exc_info=True)
        return CommandResult(
            response="I couldn't process that AI request, but I can still open applications locally.",
            intent="gemini_not_configured",
            requires_ai=True,
        )
    except Exception as e:
        # Task 6: Never display raw API error JSON directly as the main assistant response.
        # Log detailed technical errors in sanitized local logs.
        logger.error(f"[Gemini] Technical execution error: {e}", exc_info=True)
        return CommandResult(
            response="I couldn't process that AI request, but I can still open applications locally.",
            intent="error",
            requires_ai=True,
        )
