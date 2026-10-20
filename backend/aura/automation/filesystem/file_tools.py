"""
Filesystem tools — safe file/folder operations within approved directories.
"""
import os
import re
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("aura.filesystem")

# ─── Approved root directories ────────────────────────────────────────────────
def get_approved_roots() -> list[Path]:
    """Returns paths the user has approved for AURA to read/write."""
    roots = [
        Path.home() / "Documents",
        Path.home() / "Desktop",
        Path.home() / "Downloads",
        Path.home() / "AppData" / "Local" / "AURA" / "files",
    ]
    return [r for r in roots if r.exists() or r == Path.home() / "AppData" / "Local" / "AURA" / "files"]


def is_path_approved(target: Path) -> bool:
    """Check that target is within an approved root (prevents traversal)."""
    try:
        resolved = target.resolve()
        for root in get_approved_roots():
            try:
                resolved.relative_to(root.resolve())
                return True
            except ValueError:
                continue
    except Exception:
        pass
    return False


def sanitize_filename(name: str) -> str:
    """Remove characters that are invalid in Windows filenames."""
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    name = name.strip('. ')
    return name[:200] if name else "untitled"


async def create_directory(name: str, parent: Optional[str] = None) -> dict:
    """Create a directory in an approved location."""
    safe_name = sanitize_filename(name)
    
    if parent:
        parent_path = Path(parent)
        if not is_path_approved(parent_path):
            return {"success": False, "error": f"Parent directory is not in an approved location: {parent}"}
    else:
        parent_path = Path.home() / "Documents"
    
    target = parent_path / safe_name
    resolved = target.resolve()
    
    if not is_path_approved(resolved):
        return {"success": False, "error": "Target directory is outside approved locations"}
    
    if resolved.exists():
        return {"success": True, "message": f"Folder '{safe_name}' already exists at {resolved}", "path": str(resolved)}
    
    try:
        resolved.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created directory: {resolved}")
        return {"success": True, "message": f"Created folder '{safe_name}' at {resolved}", "path": str(resolved)}
    except Exception as e:
        logger.error(f"Failed to create directory {resolved}: {e}")
        return {"success": False, "error": str(e)}


async def handle_filesystem_command(normalized_text: str):
    """Attempt to parse basic filesystem commands deterministically."""
    import re
    from aura.agent.intent_router import CommandResult, ActionTaken

    # "create a folder named X" / "make a directory called X"
    match = re.match(
        r"(?:create|make)\s+(?:a\s+)?(?:folder|directory|dir)\s+(?:named?|called)\s+(.+)",
        normalized_text,
        re.IGNORECASE,
    )
    if match:
        folder_name = match.group(1).strip().strip('"\'')
        result = await create_directory(folder_name)
        return CommandResult(
            response=result.get("message", result.get("error", "Unknown result")),
            intent="filesystem_create_directory",
            actions_taken=[ActionTaken(
                tool="filesystem.create_directory",
                success=result["success"],
                result=result,
                error=None if result["success"] else result.get("error"),
            )],
        )
    return None


async def open_file(path: str) -> dict:
    """Open a file with its default application."""
    target = Path(path)
    if not target.exists():
        return {"success": False, "error": f"File not found: {path}"}
    if not is_path_approved(target):
        return {"success": False, "error": "File is outside approved locations"}
    try:
        os.startfile(str(target))
        return {"success": True, "message": f"Opened {target.name}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
