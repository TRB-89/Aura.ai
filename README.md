# PROJECT AURA — Advanced Personal AI Desktop Companion

> **Adaptive Universal Responsive Assistant (AURA)**  
> A desktop AI companion combining Windows desktop automation, conversational intelligence, local memory, and Microsoft Office document generation.

---

## 1. System Architecture

```
AURA Architecture
┌────────────────────────────────────────────────────────┐
│  Electron Desktop Window (Frameless, Glassmorphism)   │
│  ├── React 18 + TypeScript + Vite + Tailwind CSS      │
│  ├── Dynamic Central AI Orb (Framer Motion reactive)   │
│  ├── Secure Preload Bridge (window.auraAPI)           │
│  └── Zustand Stores (chatStore, backendStore)          │
└───────────────────────────┬────────────────────────────┘
                            │ IPC / Local HTTP + Bearer Token
┌───────────────────────────▼────────────────────────────┐
│  FastAPI Python Backend (http://127.0.0.1:49200)       │
│  ├── Intent Router (Deterministic app launch & focus) │
│  ├── Gemini Agent (Structured tool calling)            │
│  ├── Windows Automation (psutil, winreg, pywinauto)    │
│  ├── Microsoft Office (Word, PowerPoint, Excel)        │
│  ├── SQLite Database (WAL mode, 12 tables)             │
│  └── Speech Service (pyttsx3 TTS / Whisper STT)        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Implemented Capabilities

- **Desktop Shell (`apps/desktop`)**:
  - Frameless modern window with custom title bar, window controls, and system tray integration.
  - Interactive central AI Orb with breathing, listening, thinking, executing, and speaking states.
  - Multi-tab navigation (Home, Assistant, Workspaces, Projects, Tasks, Memory, Health, Connectors, Settings).
  - Typed IPC bridge exposing strict APIs without direct Node.js exposure in the renderer.

- **Backend Automation Engine (`backend/aura`)**:
  - Deterministic Windows app launch and window focus (Notepad, Calculator, Word, Excel, PowerPoint, browsers, etc.) without requiring AI roundtrips.
  - Disambiguation handling (e.g. asking which Microsoft application when ambiguous).
  - Tool execution engine supporting app launching, URL opening, filesystem management, Word/PowerPoint/Excel document creation, and personal memory search/save.
  - Async SQLite database (`aura.db`) stored in `%LOCALAPPDATA%\AURA` with WAL mode and foreign key constraints.
  - Speech synthesis and transcription services.

---

## 3. Quick Start & Development

### Prerequisites
- Windows 10/11
- Python 3.11+ (Python 3.13 verified)
- Node.js 18+ (Node 24 verified)

### Running the Backend
```powershell
python scripts/run_backend.py
```
Backend will start on `http://127.0.0.1:49200`.

### Running the Desktop App
```powershell
npm --prefix apps/desktop run dev
```

### Running Full System Tests
```powershell
python scripts/test_all.py
```
This executes:
1. Backend unit and integration tests (SQLite database, tool registry, memory search/save, intent routing)
2. Frontend TypeScript type checking (`tsc --noEmit`)
3. Frontend production build (`vite build` & `vite-plugin-electron`)
