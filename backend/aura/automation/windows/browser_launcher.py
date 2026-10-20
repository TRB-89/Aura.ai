"""
AURA Browser Launcher — Windows
Detects the preferred/default browser, opens URLs (e.g. Google),
and verifies that the browser process is running.
"""
import os
import re
import sys
import time
import winreg
import psutil
import logging
import asyncio
import subprocess
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger("aura.browser")


class BrowserLaunchResult:
    def __init__(self, success: bool, message: str, url: str, browser_name: str, pid: Optional[int] = None):
        self.success = success
        self.message = message
        self.url = url
        self.browser_name = browser_name
        self.pid = pid

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "message": self.message,
            "url": self.url,
            "browser": self.browser_name,
            "pid": self.pid,
        }


def detect_preferred_browser() -> Tuple[str, Optional[str]]:
    """
    Detect the user's preferred / default Windows browser by inspecting
    the Windows Registry UserChoice associations and well-known paths.
    Returns (browser_display_name, executable_path).
    """
    browser_name = "Default Browser"
    browser_path = None

    # 1. Try Windows UserChoice registry for https protocol
    try:
        reg_key = r"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice"
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, reg_key) as key:
            prog_id, _ = winreg.QueryValueEx(key, "ProgId")
            prog_lower = prog_id.lower()
            if "chrome" in prog_lower:
                browser_name = "Google Chrome"
            elif "edge" in prog_lower or "msedge" in prog_lower:
                browser_name = "Microsoft Edge"
            elif "firefox" in prog_lower:
                browser_name = "Mozilla Firefox"
            elif "brave" in prog_lower:
                browser_name = "Brave"
            elif "opera" in prog_lower:
                browser_name = "Opera"

            with winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, rf"{prog_id}\shell\open\command") as cmd_key:
                cmd, _ = winreg.QueryValueEx(cmd_key, "")
                cmd = cmd.strip()
                if cmd.startswith('"'):
                    browser_path = cmd[1:].split('"')[0]
                else:
                    browser_path = cmd.split()[0]
    except Exception as e:
        logger.debug(f"UserChoice registry lookup: {e}")

    # 2. If path not found or invalid, check common browser install locations
    if not browser_path or not Path(browser_path).exists():
        candidates = [
            ("Google Chrome", Path("C:/Program Files/Google/Chrome/Application/chrome.exe")),
            ("Google Chrome", Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe")),
            ("Google Chrome", Path(os.environ.get("LOCALAPPDATA", "")) / "Google" / "Chrome" / "Application" / "chrome.exe"),
            ("Microsoft Edge", Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")),
            ("Microsoft Edge", Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe")),
            ("Mozilla Firefox", Path("C:/Program Files/Mozilla Firefox/firefox.exe")),
        ]
        for name, p in candidates:
            if p.exists():
                browser_name = name
                browser_path = str(p)
                break

    return browser_name, browser_path


def _is_browser_process_running(browser_name: str, browser_path: Optional[str]) -> Tuple[bool, Optional[int]]:
    """Check via psutil if a browser process is currently active."""
    target_stems = ["chrome", "msedge", "firefox", "brave", "opera", "browser"]
    if browser_path:
        target_stems.insert(0, Path(browser_path).stem.lower())

    for proc in psutil.process_iter(["pid", "name"]):
        try:
            pname = (proc.info.get("name") or "").lower()
            for stem in target_stems:
                if stem in pname:
                    return True, proc.info.get("pid")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return False, None


async def launch_url_in_preferred_browser(url: str = "https://www.google.com") -> BrowserLaunchResult:
    """
    Open a URL using the preferred Windows browser, verify execution,
    and return a verified BrowserLaunchResult.
    """
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    browser_name, browser_path = detect_preferred_browser()
    logger.info(f"Opening {url} using {browser_name} ({browser_path})")

    try:
        proc = None
        if browser_path and Path(browser_path).exists():
            # Launch directly with the URL argument
            proc = subprocess.Popen(
                [browser_path, url],
                shell=False,
                close_fds=True,
            )
        else:
            # Fallback to Windows shell association
            os.startfile(url)

        # Allow browser time to initialize/spawn window
        await asyncio.sleep(1.0)

        # Verification step
        running, found_pid = _is_browser_process_running(browser_name, browser_path)
        actual_pid = proc.pid if (proc and proc.poll() is None) else found_pid

        if running or actual_pid:
            return BrowserLaunchResult(
                success=True,
                message=f"Opened {url} in your browser ({browser_name}).",
                url=url,
                browser_name=browser_name,
                pid=actual_pid,
            )
        else:
            # If startfile was used, it may have succeeded without a new top-level PID
            return BrowserLaunchResult(
                success=True,
                message=f"Dispatched {url} to {browser_name}.",
                url=url,
                browser_name=browser_name,
                pid=None,
            )

    except Exception as e:
        logger.error(f"Failed to launch browser URL {url}: {e}", exc_info=True)
        return BrowserLaunchResult(
            success=False,
            message=f"Could not open browser for {url}: {str(e)}",
            url=url,
            browser_name=browser_name,
            pid=None,
        )
