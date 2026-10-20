"""
Gemini Agent — Phase 3
Uses google-genai SDK with structured function calling.
"""
import os
import logging
from typing import Any
from pydantic import BaseModel

logger = logging.getLogger("aura.gemini")

# Tool definitions for Gemini function calling
TOOL_DEFINITIONS = [
    {
        "name": "app_launch",
        "description": "Launch a desktop application by name",
        "parameters": {
            "type": "object",
            "properties": {
                "application": {
                    "type": "string",
                    "description": "The application to launch (e.g. 'calculator', 'notepad', 'vscode', 'chrome')"
                }
            },
            "required": ["application"]
        }
    },
    {
        "name": "app_focus",
        "description": "Bring a running application to the foreground",
        "parameters": {
            "type": "object",
            "properties": {
                "application": {
                    "type": "string",
                    "description": "The application to focus"
                }
            },
            "required": ["application"]
        }
    },
    {
        "name": "browser_open_url",
        "description": "Open a URL in the default browser",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to open (must be http or https)"
                }
            },
            "required": ["url"]
        }
    },
    {
        "name": "filesystem_create_directory",
        "description": "Create a new folder in an approved location",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Directory name"
                },
                "parent": {
                    "type": "string",
                    "description": "Parent directory path (optional, defaults to Documents)"
                }
            },
            "required": ["name"]
        }
    },
    {
        "name": "office_word_create",
        "description": "Create a Microsoft Word document with AI-generated content",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Document topic"},
                "doc_type": {"type": "string", "description": "Type: assignment, report, letter, essay"},
                "filename": {"type": "string", "description": "Filename (without extension)"},
                "sections": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Section headings to include"
                }
            },
            "required": ["topic"]
        }
    },
    {
        "name": "office_powerpoint_create",
        "description": "Create a PowerPoint presentation",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Presentation topic"},
                "slide_count": {"type": "integer", "description": "Number of slides"},
                "filename": {"type": "string", "description": "Filename without extension"}
            },
            "required": ["topic"]
        }
    },
    {
        "name": "office_excel_create",
        "description": "Create an Excel spreadsheet",
        "parameters": {
            "type": "object",
            "properties": {
                "purpose": {"type": "string", "description": "Spreadsheet purpose"},
                "filename": {"type": "string", "description": "Filename without extension"}
            },
            "required": ["purpose"]
        }
    },
    {
        "name": "memory_search",
        "description": "Search AURA's memory for stored preferences and facts",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "memory_save",
        "description": "Save a user preference or fact to memory",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Memory category"},
                "content": {"type": "string", "description": "What to remember"}
            },
            "required": ["category", "content"]
        }
    },
]

SYSTEM_PROMPT = """You are AURA — Adaptive Universal Responsive Assistant.
You are a personal AI companion running on the user's Windows computer.
You help users by:
- Launching applications
- Creating documents, presentations, and spreadsheets
- Managing files and folders
- Searching the web
- Remembering preferences

Rules:
- Always use the provided tools to take real actions
- Never claim to have done something without using a tool
- Be concise and natural in responses
- Ask for clarification only when genuinely ambiguous
- For "Open Microsoft" without a specific app, ask which one
- Report failures honestly
"""


class GeminiAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            import google.genai as genai
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def process(self, text: str, conversation_id: str, task_id: str):
        """Process a command via Gemini with native function calling and conversation history."""
        from aura.agent.intent_router import CommandResult, ActionTaken
        from aura.tools.tool_executor import execute_tool
        from aura.storage.database import get_conversation_history, save_message

        client = self._get_client()
        model = os.environ.get("AURA_GEMINI_MODEL", "gemini-3.5-flash-lite")

        import google.genai.types as types

        def _build_prop_schema(v: dict) -> types.Schema:
            t = v.get("type", "string")
            if t == "array":
                return types.Schema(
                    type=types.Type.ARRAY,
                    items=types.Schema(type=types.Type.STRING),
                    description=v.get("description", "")
                )
            elif t == "integer":
                return types.Schema(type=types.Type.INTEGER, description=v.get("description", ""))
            else:
                return types.Schema(type=types.Type.STRING, description=v.get("description", ""))

        # Build tool declarations
        tools = [
            types.Tool(
                function_declarations=[
                    types.FunctionDeclaration(
                        name=td["name"],
                        description=td["description"],
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                k: _build_prop_schema(v)
                                for k, v in td["parameters"].get("properties", {}).items()
                            },
                            required=td["parameters"].get("required", []),
                        )
                    )
                    for td in TOOL_DEFINITIONS
                ]
            )
        ]

        # ─── Build contents with sanitized conversation history ────────────────
        contents: list[types.Content] = []
        try:
            raw_history = get_conversation_history(conversation_id, limit=12)
            last_role = None
            for item in raw_history:
                # Ensure roles are strictly 'user' or 'model'
                role = "user" if item.get("role") in ("user", "tool") else "model"
                c_text = item.get("content", "")
                if not c_text:
                    continue
                # Avoid consecutive identical roles for Gemini API stability
                if role == last_role and contents:
                    contents[-1].parts.append(types.Part.from_text(text=f"\n{c_text}"))
                else:
                    contents.append(types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=c_text)]
                    ))
                    last_role = role
        except Exception as hist_err:
            logger.warning(f"Failed to load conversation history: {hist_err}")
            contents = []

        # Ensure the current request is appended as a user turn
        if contents and contents[-1].role == "user":
            contents[-1].parts.append(types.Part.from_text(text=f"\n{text}"))
        else:
            contents.append(types.Content(
                role="user",
                parts=[types.Part.from_text(text=text)]
            ))

        actions: list[ActionTaken] = []
        final_response = ""
        max_iterations = 8

        for iteration in range(max_iterations):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        tools=tools,
                        temperature=0.3,
                        max_output_tokens=2048,
                    )
                )
            except Exception as gen_err:
                # Handle model name migration fallback if model is deprecated
                err_str = str(gen_err)
                if "404" in err_str and model != "gemini-3.5-flash-lite":
                    logger.warning(f"Model {model} returned 404, falling back to gemini-3.5-flash-lite")
                    model = "gemini-3.5-flash-lite"
                    response = client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            tools=tools,
                            temperature=0.3,
                            max_output_tokens=2048,
                        )
                    )
                else:
                    raise gen_err

            candidate = response.candidates[0] if response.candidates else None
            if not candidate:
                break

            # Check for function calls
            has_function_call = False
            tool_results = []

            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.function_call:
                        has_function_call = True
                        fn_name = part.function_call.name
                        fn_args = dict(part.function_call.args) if part.function_call.args else {}
                        call_id = getattr(part.function_call, "id", None)

                        logger.info(f"[Gemini] Tool call: {fn_name}({fn_args}) [id={call_id}]")

                        # Execute the tool
                        tool_result = await execute_tool(fn_name, fn_args)
                        actions.append(ActionTaken(
                            tool=fn_name,
                            success=tool_result.get("success", True),
                            result=tool_result,
                            error=tool_result.get("error"),
                        ))

                        # Build structured function response part
                        resp_data = tool_result if isinstance(tool_result, dict) else {"result": tool_result}
                        if call_id:
                            fn_resp = types.FunctionResponse(name=fn_name, response=resp_data, id=call_id)
                        else:
                            fn_resp = types.FunctionResponse(name=fn_name, response=resp_data)

                        tool_results.append(types.Part(function_response=fn_resp))

            if has_function_call:
                # Gemini native function calling specification:
                # 1. Model turn with function_call parts (role="model")
                # 2. User turn with function_response parts (role="user" - NEVER role="tool"!)
                contents.append(candidate.content)
                contents.append(types.Content(
                    role="user",  # CRITICAL: Native Gemini uses role="user" for function results
                    parts=tool_results,
                ))
                continue

            # Text response — done
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.text:
                        final_response += part.text
            break

        if not final_response:
            final_response = "I've completed your request." if actions else "I'm not sure how to help with that."

        # Persist conversation turn into SQLite safely
        try:
            save_message(conversation_id, "user", text)
            save_message(conversation_id, "assistant", final_response)
        except Exception as save_err:
            logger.warning(f"Failed to persist message turn: {save_err}")

        return CommandResult(
            response=final_response,
            actions_taken=actions,
            intent="gemini_routed",
            requires_ai=True,
        )
