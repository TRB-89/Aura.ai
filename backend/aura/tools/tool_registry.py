"""
AURA Tool Registry
Registers and documents available system tools and metadata.
"""
from typing import Dict, Any, List

TOOL_DEFINITIONS = [
    {
        "name": "app_launch",
        "description": "Launch a Windows desktop application by name (e.g. 'notepad', 'calculator', 'chrome')",
        "parameters": {
            "type": "object",
            "properties": {
                "application": {"type": "string", "description": "The name or alias of the application to launch"}
            },
            "required": ["application"]
        }
    },
    {
        "name": "app_focus",
        "description": "Bring an already-running application window to the foreground",
        "parameters": {
            "type": "object",
            "properties": {
                "application": {"type": "string", "description": "Application name or process name"}
            },
            "required": ["application"]
        }
    },
    {
        "name": "browser_open_url",
        "description": "Open a specified URL in the user's default web browser",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The HTTP or HTTPS URL to open"}
            },
            "required": ["url"]
        }
    },
    {
        "name": "filesystem_create_directory",
        "description": "Create a directory on the local file system",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Name of the directory"},
                "parent": {"type": "string", "description": "Optional parent directory path"}
            },
            "required": ["name"]
        }
    },
    {
        "name": "office_word_create",
        "description": "Create a styled Microsoft Word document (.docx) on a given topic",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Subject or title of the document"},
                "doc_type": {"type": "string", "description": "assignment | report | notes"},
                "filename": {"type": "string", "description": "Optional custom filename"}
            },
            "required": ["topic"]
        }
    },
    {
        "name": "office_powerpoint_create",
        "description": "Create a styled PowerPoint presentation (.pptx) with slides",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Subject or presentation title"},
                "slide_count": {"type": "integer", "description": "Number of slides (2-20)"},
                "filename": {"type": "string", "description": "Optional custom filename"}
            },
            "required": ["topic"]
        }
    },
    {
        "name": "office_excel_create",
        "description": "Create a formatted Excel spreadsheet (.xlsx)",
        "parameters": {
            "type": "object",
            "properties": {
                "purpose": {"type": "string", "description": "Purpose or theme of the spreadsheet"},
                "filename": {"type": "string", "description": "Optional custom filename"}
            },
            "required": ["purpose"]
        }
    },
    {
        "name": "memory_search",
        "description": "Search personal memory for stored facts, preferences, and notes",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword or question"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "memory_save",
        "description": "Save an important personal fact, preference, or context note into memory",
        "parameters": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "The fact or preference to remember"},
                "category": {"type": "string", "description": "Category: user_preference | fact | workflow | project"}
            },
            "required": ["content"]
        }
    }
]


def get_registry() -> List[Dict[str, Any]]:
    """Return list of available registered tool definitions."""
    return TOOL_DEFINITIONS
