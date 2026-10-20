"""
Windows Application Discovery and Launcher
Phase 2 — deterministic app launching without requiring Gemini
"""
import os
import json
import logging
import subprocess
import winreg
import asyncio
from pathlib import Path
from typing import Optional

import psutil
from fastapi import APIRouter

logger = logging.getLogger("aura.launcher")
app_discovery_router = APIRouter()

# ─── Alias map ────────────────────────────────────────────────────────────────
# Maps user-facing names / synonyms → canonical identifiers
BUILTIN_ALIASES: dict[str, str] = {
    # Google & Browser
    "google": "google_search",
    "google.com": "google_search",
    "google search": "google_search",
    # Calculator
    "calculator": "calculator",
    "calc": "calculator",
    # Notepad
    "notepad": "notepad",
    "text editor": "notepad",
    # Paint
    "paint": "paint",
    "mspaint": "paint",
    # File Explorer
    "explorer": "file_explorer",
    "file explorer": "file_explorer",
    "my files": "file_explorer",
    "files": "file_explorer",
    # Task Manager
    "task manager": "task_manager",
    "taskmgr": "task_manager",
    # VS Code
    "vscode": "vscode",
    "vs code": "vscode",
    "visual studio code": "vscode",
    "code": "vscode",
    # Word
    "word": "ms_word",
    "microsoft word": "ms_word",
    "ms word": "ms_word",
    # Excel
    "excel": "ms_excel",
    "microsoft excel": "ms_excel",
    "ms excel": "ms_excel",
    "spreadsheet": "ms_excel",
    # PowerPoint
    "powerpoint": "ms_powerpoint",
    "ppt": "ms_powerpoint",
    "microsoft powerpoint": "ms_powerpoint",
    "ms powerpoint": "ms_powerpoint",
    "presentation": "ms_powerpoint",
    # Chrome
    "chrome": "google_chrome",
    "google chrome": "google_chrome",
    # Edge
    "edge": "ms_edge",
    "microsoft edge": "ms_edge",
    # Firefox
    "firefox": "firefox",
    "mozilla firefox": "firefox",
    # Spotify
    "spotify": "spotify",
    "music": "spotify",
    # Slack
    "slack": "slack",
    # Discord
    "discord": "discord",
    # Outlook
    "outlook": "ms_outlook",
    "microsoft outlook": "ms_outlook",
    "email": "ms_outlook",
    # Teams
    "teams": "ms_teams",
    "microsoft teams": "ms_teams",
    # Snipping Tool
    "snipping tool": "snipping_tool",
    "screenshot": "snipping_tool",
    # Settings
    "settings": "windows_settings",
    "windows settings": "windows_settings",
    # CMD / Terminal
    "cmd": "cmd",
    "command prompt": "cmd",
    "terminal": "cmd",
    "powershell": "powershell",
}

# ─── Well-known app executable paths ─────────────────────────────────────────
WELL_KNOWN_APPS: dict[str, dict] = {
    "calculator": {
        "name": "Calculator",
        "launch_target": "calculator:",
        "method": "shell_open",
    },
    "notepad": {
        "name": "Notepad",
        "launch_target": "notepad.exe",
        "method": "shell",
    },
    "paint": {
        "name": "Paint",
        "launch_target": "mspaint.exe",
        "method": "shell",
    },
    "file_explorer": {
        "name": "File Explorer",
        "launch_target": "explorer.exe",
        "method": "shell",
    },
    "task_manager": {
        "name": "Task Manager",
        "launch_target": "taskmgr.exe",
        "method": "shell",
    },
    "cmd": {
        "name": "Command Prompt",
        "launch_target": "cmd.exe",
        "method": "shell",
    },
    "powershell": {
        "name": "PowerShell",
        "launch_target": "powershell.exe",
        "method": "shell",
    },
    "windows_settings": {
        "name": "Settings",
        "launch_target": "ms-settings:",
        "method": "shell_open",
    },
    "snipping_tool": {
        "name": "Snipping Tool",
        "launch_target": "SnippingTool.exe",
        "method": "shell",
    },
    "spotify": {
        "name": "Spotify",
        "launch_target": "spotify:",
        "method": "shell_open",
    },
}

# ─── Registry-discovered apps cache ──────────────────────────────────────────
_discovered_apps: dict[str, dict] = {}


def _search_registry_for_app(canonical_id: str) -> Optional[str]:
    """Search Windows registry for application executable paths."""
    app_paths_key = r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"
    
    # Map canonical IDs to possible exe names
    exe_names = {
        "vscode": ["Code.exe"],
        "ms_word": ["WINWORD.EXE"],
        "ms_excel": ["EXCEL.EXE"],
        "ms_powerpoint": ["POWERPNT.EXE"],
        "ms_outlook": ["OUTLOOK.EXE"],
        "ms_teams": ["Teams.exe"],
        "google_chrome": ["chrome.exe"],
        "ms_edge": ["msedge.exe"],
        "firefox": ["firefox.exe"],
        "spotify": ["Spotify.exe"],
        "slack": ["slack.exe"],
        "discord": ["Discord.exe"],
    }
    
    exe_list = exe_names.get(canonical_id, [])
    
    for hive in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
        for exe_name in exe_list:
            try:
                key_path = f"{app_paths_key}\\{exe_name}"
                with winreg.OpenKey(hive, key_path) as key:
                    path, _ = winreg.QueryValueEx(key, "")
                    if path and Path(path).exists():
                        return path
            except (FileNotFoundError, OSError):
                continue
    return None


def _search_common_paths(canonical_id: str) -> Optional[str]:
    """Search common installation directories."""
    common_paths = {
        "vscode": [
            Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Microsoft VS Code" / "Code.exe",
            Path("C:/Program Files/Microsoft VS Code/Code.exe"),
        ],
        "ms_word": [
            Path("C:/Program Files/Microsoft Office/root/Office16/WINWORD.EXE"),
            Path("C:/Program Files (x86)/Microsoft Office/root/Office16/WINWORD.EXE"),
            Path("C:/Program Files/Microsoft Office/Office16/WINWORD.EXE"),
        ],
        "ms_excel": [
            Path("C:/Program Files/Microsoft Office/root/Office16/EXCEL.EXE"),
            Path("C:/Program Files (x86)/Microsoft Office/root/Office16/EXCEL.EXE"),
        ],
        "ms_powerpoint": [
            Path("C:/Program Files/Microsoft Office/root/Office16/POWERPNT.EXE"),
            Path("C:/Program Files (x86)/Microsoft Office/root/Office16/POWERPNT.EXE"),
        ],
        "ms_outlook": [
            Path("C:/Program Files/Microsoft Office/root/Office16/OUTLOOK.EXE"),
        ],
        "google_chrome": [
            Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
            Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"),
            Path(os.environ.get("LOCALAPPDATA", "")) / "Google" / "Chrome" / "Application" / "chrome.exe",
        ],
        "ms_edge": [
            Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
            Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
        ],
        "firefox": [
            Path("C:/Program Files/Mozilla Firefox/firefox.exe"),
            Path("C:/Program Files (x86)/Mozilla Firefox/firefox.exe"),
        ],
        "spotify": [
            Path(os.environ.get("APPDATA", "")) / "Spotify" / "Spotify.exe",
            Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WindowsApps" / "Spotify.exe",
        ],
        "ms_teams": [
            Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "Teams" / "current" / "Teams.exe",
            Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "Teams" / "Teams.exe",
        ],
        "slack": [
            Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Slack.lnk",
        ],
        "discord": [
            Path(os.environ.get("LOCALAPPDATA", "")) / "Discord" / "Update.exe",
        ],
    }
    
    for path in common_paths.get(canonical_id, []):
        if path.exists():
            return str(path)
    return None


async def refresh_app_registry():
    """Discover installed applications and cache results."""
    global _discovered_apps
    
    for canonical_id, info in WELL_KNOWN_APPS.items():
        _discovered_apps[canonical_id] = {**info, "available": True}
    
    # Check registry + common paths for non-builtin apps
    registry_apps = [
        "vscode", "ms_word", "ms_excel", "ms_powerpoint",
        "ms_outlook", "ms_teams", "google_chrome", "ms_edge",
        "firefox", "spotify", "slack", "discord"
    ]
    
    for canonical_id in registry_apps:
        path = _search_registry_for_app(canonical_id) or _search_common_paths(canonical_id)
        if path:
            name_map = {
                "vscode": "Visual Studio Code",
                "ms_word": "Microsoft Word",
                "ms_excel": "Microsoft Excel",
                "ms_powerpoint": "Microsoft PowerPoint",
                "ms_outlook": "Microsoft Outlook",
                "ms_teams": "Microsoft Teams",
                "google_chrome": "Google Chrome",
                "ms_edge": "Microsoft Edge",
                "firefox": "Mozilla Firefox",
                "spotify": "Spotify",
                "slack": "Slack",
                "discord": "Discord",
            }
            _discovered_apps[canonical_id] = {
                "name": name_map.get(canonical_id, canonical_id),
                "launch_target": path,
                "method": "subprocess",
                "available": True,
            }
    
    logger.info(f"App registry: {len(_discovered_apps)} apps discovered")


def resolve_app_name(user_input: str) -> Optional[str]:
    """Resolve user input to a canonical app ID."""
    normalized = user_input.lower().strip()
    return BUILTIN_ALIASES.get(normalized)


# ─── Launch Logic ─────────────────────────────────────────────────────────────

class LaunchResult:
    def __init__(self, success: bool, message: str, pid: Optional[int] = None):
        self.success = success
        self.message = message
        self.pid = pid

    def to_dict(self):
        return {"success": self.success, "message": self.message, "pid": self.pid}


async def launch_application(canonical_id: str) -> LaunchResult:
    """Launch an application by canonical ID. Verify it actually started."""
    if canonical_id in ("google_search", "google"):
        from aura.automation.windows.browser_launcher import launch_url_in_preferred_browser
        res = await launch_url_in_preferred_browser("https://www.google.com")
        return LaunchResult(
            success=res.success,
            message=res.message,
            pid=res.pid,
        )

    app_info = _discovered_apps.get(canonical_id)
    if not app_info:
        return LaunchResult(
            success=False,
            message=f"Application '{canonical_id}' not found on this computer."
        )
    
    if not app_info.get("available", False):
        return LaunchResult(
            success=False,
            message=f"{app_info['name']} is not installed or not available."
        )
    
    launch_target = app_info["launch_target"]
    method = app_info.get("method", "shell")
    app_name = app_info["name"]
    
    logger.info(f"Launching {app_name} via {method}: {launch_target}")
    
    try:
        if method == "shell_open":
            # For UWP URIs like ms-settings:
            os.startfile(launch_target)
            await asyncio.sleep(1.5)
            return LaunchResult(success=True, message=f"{app_name} is open.", pid=None)
        
        elif method == "shell":
            # System executables — safe to use shell=False with absolute path resolution
            proc = subprocess.Popen(
                [launch_target],
                shell=False,
                close_fds=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE if launch_target.endswith("cmd.exe") else 0,
            )
            # Wait briefly and check it's still alive
            await asyncio.sleep(1.5)
            if proc.poll() is None:
                return LaunchResult(success=True, message=f"{app_name} is open.", pid=proc.pid)
            elif proc.returncode == 0:
                # Windows AppExecutionAlias stubs (like notepad.exe) delegate and exit with 0
                exe_stem = Path(launch_target).stem.lower()
                matched_pids = [
                    p.info["pid"] for p in psutil.process_iter(["name", "pid"])
                    if p.info.get("name") and exe_stem in p.info["name"].lower()
                ]
                actual_pid = matched_pids[0] if matched_pids else proc.pid
                return LaunchResult(success=True, message=f"{app_name} is open.", pid=actual_pid)
            else:
                return LaunchResult(
                    success=False,
                    message=f"{app_name} launched but exited with code {proc.returncode}."
                )
        
        elif method == "subprocess":
            # Full path executables from registry
            target_path = Path(launch_target)
            if not target_path.exists():
                return LaunchResult(success=False, message=f"{app_name} executable not found: {launch_target}")
            
            proc = subprocess.Popen(
                [str(target_path)],
                shell=False,
                close_fds=True,
            )
            await asyncio.sleep(2.0)
            if proc.poll() is None:
                return LaunchResult(success=True, message=f"{app_name} is open.", pid=proc.pid)
            else:
                return LaunchResult(
                    success=False,
                    message=f"{app_name} started but immediately exited (code {proc.returncode})."
                )
    
    except FileNotFoundError:
        return LaunchResult(
            success=False,
            message=f"{app_name} could not be launched. The executable was not found."
        )
    except PermissionError:
        return LaunchResult(
            success=False,
            message=f"{app_name} could not be launched. Access was denied."
        )
    except Exception as e:
        logger.error(f"Launch error for {canonical_id}: {e}", exc_info=True)
        return LaunchResult(
            success=False,
            message=f"Failed to launch {app_name}: {str(e)}"
        )


async def focus_application(canonical_id: str) -> LaunchResult:
    """Bring an already-running application to the foreground."""
    app_info = _discovered_apps.get(canonical_id)
    if not app_info:
        return LaunchResult(success=False, message=f"Unknown application: {canonical_id}")
    
    app_name = app_info["name"]
    launch_target = app_info["launch_target"]
    exe_name = Path(launch_target).name.lower() if launch_target else ""
    
    # Find running process
    for proc in psutil.process_iter(["pid", "name"]):
        try:
            if proc.info["name"] and proc.info["name"].lower() == exe_name:
                # Use pywinauto to bring to foreground
                try:
                    import pywinauto
                    app = pywinauto.Application().connect(process=proc.info["pid"])
                    window = app.top_window()
                    window.set_focus()
                    return LaunchResult(success=True, message=f"Switched to {app_name}.", pid=proc.info["pid"])
                except Exception:
                    # Fallback: send Alt+Tab style activation
                    return LaunchResult(success=True, message=f"{app_name} is already running.", pid=proc.info["pid"])
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    # Not running — launch it
    return await launch_application(canonical_id)


# ─── API Endpoints ────────────────────────────────────────────────────────────

from fastapi import APIRouter
from pydantic import BaseModel

app_discovery_router = APIRouter()


class LaunchRequest(BaseModel):
    application: str


@app_discovery_router.get("")
async def list_apps():
    """List all discovered applications."""
    apps = []
    for cid, info in _discovered_apps.items():
        apps.append({
            "canonical_id": cid,
            "name": info.get("name", cid),
            "available": info.get("available", False),
            "launch_target": info.get("launch_target", ""),
        })
    return {"apps": apps, "count": len(apps)}


@app_discovery_router.post("/launch")
async def launch_app(req: LaunchRequest):
    """Launch an application by canonical ID or user-facing name."""
    canonical_id = resolve_app_name(req.application) or req.application.lower().replace(" ", "_")
    result = await launch_application(canonical_id)
    if not result.success:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=result.message)
    return result.to_dict()


@app_discovery_router.post("/focus")
async def focus_app(req: LaunchRequest):
    """Focus or launch an application."""
    canonical_id = resolve_app_name(req.application) or req.application.lower().replace(" ", "_")
    result = await focus_application(canonical_id)
    return result.to_dict()


@app_discovery_router.post("/refresh")
async def refresh_apps():
    """Force a refresh of the application registry."""
    await refresh_app_registry()
    return {"refreshed": True, "count": len(_discovered_apps)}
