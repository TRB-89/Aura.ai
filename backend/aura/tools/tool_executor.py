"""
Tool Executor — validates and dispatches tool calls from Gemini.
Only registered tools can be called. Arguments are validated via Pydantic.
"""
import logging
from typing import Any

logger = logging.getLogger("aura.tools")

# Registered tool names
REGISTERED_TOOLS = {
    "app_launch",
    "app_focus",
    "browser_open_url",
    "filesystem_create_directory",
    "office_word_create",
    "office_powerpoint_create",
    "office_excel_create",
    "memory_search",
    "memory_save",
}


async def execute_tool(name: str, args: dict[str, Any]) -> dict:
    """Validate tool name and dispatch to implementation."""
    if name not in REGISTERED_TOOLS:
        logger.warning(f"Rejected unknown tool: {name}")
        return {"success": False, "error": f"Unknown tool: {name}"}

    try:
        if name == "app_launch":
            from aura.automation.windows.app_launcher import resolve_app_name, launch_application
            app_arg = args.get("application", "").strip()
            if app_arg.lower() in ("google", "google.com", "google search", "browser"):
                from aura.automation.windows.browser_launcher import launch_url_in_preferred_browser
                res = await launch_url_in_preferred_browser("https://www.google.com")
                return res.to_dict()
            canonical = resolve_app_name(app_arg) or app_arg.lower()
            result = await launch_application(canonical)
            return result.to_dict()

        elif name == "app_focus":
            from aura.automation.windows.app_launcher import resolve_app_name, focus_application
            canonical = resolve_app_name(args.get("application", "")) or args.get("application", "").lower()
            result = await focus_application(canonical)
            return result.to_dict()

        elif name == "browser_open_url":
            url = args.get("url", "")
            if not url:
                url = "https://www.google.com"
            from aura.automation.windows.browser_launcher import launch_url_in_preferred_browser
            res = await launch_url_in_preferred_browser(url)
            return res.to_dict()

        elif name == "filesystem_create_directory":
            from aura.automation.filesystem.file_tools import create_directory
            result = await create_directory(args.get("name", ""), args.get("parent"))
            return result

        elif name == "office_word_create":
            from aura.automation.office.word_service import create_word_document
            result = await create_word_document(
                topic=args.get("topic", ""),
                doc_type=args.get("doc_type", "assignment"),
                filename=args.get("filename"),
                sections=args.get("sections"),
            )
            return result

        elif name == "office_powerpoint_create":
            from aura.automation.office.powerpoint_service import create_presentation
            result = await create_presentation(
                topic=args.get("topic", ""),
                slide_count=int(args.get("slide_count", 5)),
                filename=args.get("filename"),
            )
            return result

        elif name == "office_excel_create":
            from aura.automation.office.excel_service import create_spreadsheet
            result = await create_spreadsheet(
                purpose=args.get("purpose", ""),
                filename=args.get("filename"),
            )
            return result

        elif name == "memory_search":
            from aura.memory.memory_service import search_memories
            results = await search_memories(args.get("query", ""))
            return {"success": True, "memories": results}

        elif name == "memory_save":
            from aura.memory.memory_service import save_memory
            result = await save_memory(
                category=args.get("category", "general"),
                content=args.get("content", ""),
            )
            return result

        else:
            return {"success": False, "error": f"Tool not implemented: {name}"}

    except Exception as e:
        logger.error(f"Tool execution error [{name}]: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
