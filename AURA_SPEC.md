# PROJECT AURA — MASTER SPECIFICATION
## Adaptive Universal Responsive Assistant
### Authoritative Reference — 2026-10-20

This file is the canonical specification for PROJECT AURA.
The full 36-section specification was received and saved on 2026-10-20.
All implementation decisions must conform to this document.

## Quick Reference

### Design Colours
- Background: #080B13
- Primary surface: #121622
- Secondary surface: #191E2E
- Primary text: #F4F5FA
- Secondary text: #9BA3B7
- Violet accent: #9598FF
- Electric blue: #5D8BFF
- Success: #49C7A5
- Error: #F17A87

### Priority Order
1. Real Windows action execution
2. Reliable Gemini tool calling
3. Voice interaction
4. Office and browser automation
5. Multi-step task completion
6. Personal memory
7. Routine management
8. Beautiful UI
9. Optional external integrations

### Tech Stack
- Desktop: Electron + React + TypeScript + Vite + Tailwind CSS
- Backend: Python 3.13 + FastAPI + SQLite
- AI: google-genai 2.22.0 (Gemini)
- Windows: pywin32 + pywinauto + psutil
- Office: python-docx + python-pptx + openpyxl
- Voice: faster-whisper + PyAudio
- Browser: Playwright

### Implementation Phases
1. Repository + environment foundation
2. First real desktop commands (text -> launch app -> verify)
3. Gemini agent integration
4. Voice capabilities
5. File and Office automation
6. Advanced agent workflows
7. Personal productivity
8. Browser and optional integrations
9. Premium final UI
10. Packaging and release
