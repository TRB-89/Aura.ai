import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  shell,
  Notification,
} from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn, ChildProcess } from 'child_process'
import * as http from 'http'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendHealth {
  status: 'starting' | 'ready' | 'error' | 'stopped'
  port: number | null
  error?: string
}

// ─── State ─────────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let pythonProcess: ChildProcess | null = null
let backendPort: number | null = null
let backendToken: string | null = null
let backendHealth: BackendHealth = { status: 'starting', port: null }
let isQuitting = false

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRandomPort(min = 49200, max = 49900): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function getBackendPath(): string {
  const candidates = [
    join(__dirname, '..', '..', '..', '..', 'backend', 'aura', 'main.py'),
    join(process.cwd(), 'backend', 'aura', 'main.py'),
    join(process.cwd(), '..', 'backend', 'aura', 'main.py'),
    join(process.cwd(), '..', '..', 'backend', 'aura', 'main.py'),
    join(app.getAppPath(), '..', 'backend', 'aura', 'main.py'),
    join(process.resourcesPath, 'backend', 'aura', 'main.py'),
    join(process.resourcesPath, 'backend', 'main.py'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[0]
}

function getPythonExecutable(): string {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH
  }
  // Try verified Windows Python install paths first
  const specificPaths = [
    join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python313', 'python.exe'),
    join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe'),
    join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
    join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe'),
    'C:\\Program Files\\Python313\\python.exe',
    'C:\\Program Files\\Python312\\python.exe',
    'C:\\Program Files\\Python311\\python.exe',
  ]
  for (const p of specificPaths) {
    if (fs.existsSync(p)) return p
  }
  return 'python'
}

// ─── Python Backend Lifecycle ─────────────────────────────────────────────────

async function checkBackendHealth(port: number, token?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/health',
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 2000,
    }
    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
    req.end()
  })
}

async function waitForBackend(port: number, token: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    const healthy = await checkBackendHealth(port, token)
    if (healthy) return true
    console.log(`[Main] Backend health check ${i + 1}/${maxAttempts}...`)
  }
  return false
}

async function startPythonBackend(): Promise<void> {
  const preferredPort = process.env.AURA_PORT ? parseInt(process.env.AURA_PORT, 10) : 49200

  // Check if an existing AURA backend instance is already running
  const alreadyRunning = await checkBackendHealth(preferredPort)
  if (alreadyRunning) {
    console.log(`[Main] Connected to existing AURA backend on port ${preferredPort}`)
    backendPort = preferredPort
    backendToken = process.env.AURA_TOKEN || 'dev-insecure-token'
    backendHealth = { status: 'ready', port: preferredPort }
    mainWindow?.webContents.send('backend:status', backendHealth)
    return
  }

  const port = preferredPort
  const token = process.env.AURA_TOKEN || generateToken()
  backendPort = port
  backendToken = token
  backendHealth = { status: 'starting', port }

  const backendFile = getBackendPath()
  const python = getPythonExecutable()
  const backendDir = dirname(dirname(backendFile))

  console.log(`[Main] Starting Python backend: ${python} ${backendFile}`)
  console.log(`[Main] Backend port: ${port}`)

  const env = {
    ...process.env,
    AURA_PORT: String(port),
    AURA_TOKEN: token,
    AURA_HOST: '127.0.0.1',
    PYTHONUNBUFFERED: '1',
    PYTHONPATH: backendDir,
  }

  try {
    pythonProcess = spawn(python, [backendFile], {
      env,
      cwd: backendDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
  } catch (err: any) {
    console.error('[Main] Exception spawning Python backend:', err)
    backendHealth = { status: 'error', port: null, error: err.message }
    mainWindow?.webContents.send('backend:status', backendHealth)
    return
  }

  pythonProcess.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim()
    if (line) console.log(`[Backend] ${line}`)
  })

  pythonProcess.stderr?.on('data', (data: Buffer) => {
    const line = data.toString().trim()
    if (line) console.error(`[Backend:ERR] ${line}`)
  })

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[Main] Python backend exited: code=${code} signal=${signal}`)
    backendHealth = { status: 'stopped', port: null, error: `Process exited with code ${code}` }
    if (!isQuitting) {
      mainWindow?.webContents.send('backend:status', backendHealth)
      setTimeout(() => {
        if (!isQuitting) {
          console.log('[Main] Auto-restarting backend...')
          startPythonBackend()
        }
      }, 3000)
    }
  })

  pythonProcess.on('error', (err) => {
    console.error('[Main] Failed to start Python backend:', err)
    backendHealth = { status: 'error', port: null, error: err.message }
    mainWindow?.webContents.send('backend:status', backendHealth)
  })

  // Wait for health check in background
  waitForBackend(port, token).then((ok) => {
    if (ok) {
      backendHealth = { status: 'ready', port }
      console.log(`[Main] Backend ready on port ${port}`)
      mainWindow?.webContents.send('backend:status', backendHealth)
    } else {
      backendHealth = { status: 'error', port: null, error: 'Backend did not respond in time' }
      console.error('[Main] Backend failed health checks')
      mainWindow?.webContents.send('backend:status', backendHealth)
    }
  })
}

function stopPythonBackend(): void {
  if (pythonProcess) {
    console.log('[Main] Stopping Python backend...')
    pythonProcess.kill('SIGTERM')
    pythonProcess = null
  }
}

// ─── Window Management ────────────────────────────────────────────────────────

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#080B13',
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    show: false,
    webPreferences: {
      preload: join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  // Load renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '..', '..', 'dist', 'index.html'))
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  // Minimize to tray instead of close
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
      if (Notification.isSupported()) {
        new Notification({
          title: 'AURA',
          body: 'AURA is still running in the system tray.',
        }).show()
      }
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Restore position
  const savedBounds = getSavedWindowBounds()
  if (savedBounds) {
    mainWindow.setBounds(savedBounds)
  }

  // Save position on move/resize
  mainWindow.on('moved', saveWindowBounds)
  mainWindow.on('resized', saveWindowBounds)
}

function createTray(): void {
  // Minimal 16x16 tray icon (inline PNG as fallback)
  const iconPath = join(__dirname, '..', '..', 'assets', 'tray-icon.png')
  let trayIcon: Electron.NativeImage

  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath)
  } else {
    // Create a tiny placeholder icon
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('AURA — AI Assistant')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show AURA',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    {
      label: 'Voice Assistant',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('aura:activate-voice')
      },
    },
    { type: 'separator' },
    {
      label: `Backend: ${backendHealth.status}`,
      enabled: false,
    } as Electron.MenuItemConstructorOptions,
    { type: 'separator' },
    {
      label: 'Quit AURA',
      click: () => {
        isQuitting = true
        stopPythonBackend()
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// ─── Window Bounds Persistence ────────────────────────────────────────────────

const BOUNDS_FILE = join(app.getPath('userData'), 'window-bounds.json')

function getSavedWindowBounds(): Electron.Rectangle | null {
  try {
    if (fs.existsSync(BOUNDS_FILE)) {
      return JSON.parse(fs.readFileSync(BOUNDS_FILE, 'utf8'))
    }
  } catch {}
  return null
}

function saveWindowBounds(): void {
  try {
    if (mainWindow) {
      fs.writeFileSync(BOUNDS_FILE, JSON.stringify(mainWindow.getBounds()))
    }
  } catch {}
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

function setupIPC(): void {
  // Window controls (called from renderer via preload)
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.handle('window:hide', () => mainWindow?.hide())
  ipcMain.handle('window:quit', () => {
    isQuitting = true
    stopPythonBackend()
    app.quit()
  })

  // Backend info — renderer asks for port + token to make API calls
  ipcMain.handle('backend:info', () => ({
    port: backendPort,
    token: backendToken,
    status: backendHealth.status,
  }))

  // Backend status
  ipcMain.handle('backend:status', () => backendHealth)

  // Shell: open external links safely
  ipcMain.handle('shell:open-external', (_e, url: string) => {
    // Only allow http/https
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
  })

  // Emergency stop — broadcast cancel to all active tasks
  ipcMain.handle('aura:emergency-stop', () => {
    mainWindow?.webContents.send('aura:emergency-stop')
    // Also call backend stop endpoint
    if (backendPort && backendToken) {
      const req = http.request({
        hostname: '127.0.0.1',
        port: backendPort,
        path: '/agent/cancel-all',
        method: 'POST',
        headers: { Authorization: `Bearer ${backendToken}`, 'Content-Length': 0 },
      })
      req.on('error', () => {})
      req.end()
    }
  })
}

// ─── Global Shortcuts ─────────────────────────────────────────────────────────

function setupShortcuts(): void {
  // Ctrl+Shift+Space — activate voice assistant
  const voiceShortcut = globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.webContents.send('aura:activate-voice')
    } else {
      mainWindow?.show()
      mainWindow?.focus()
      setTimeout(() => mainWindow?.webContents.send('aura:activate-voice'), 300)
    }
  })
  if (!voiceShortcut) console.warn('[Main] Could not register voice shortcut')

  // Ctrl+Shift+X — emergency stop
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    mainWindow?.webContents.send('aura:emergency-stop')
  })
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  console.log('[Main] AURA starting...')

  setupIPC()
  createMainWindow()
  createTray()
  startPythonBackend()
  setupShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  // On Windows, keep running in tray
  if (process.platform !== 'darwin') {
    // Don't quit — just hide to tray
  }
})

app.on('before-quit', () => {
  isQuitting = true
  globalShortcut.unregisterAll()
  stopPythonBackend()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
