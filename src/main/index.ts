import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  screen,
  globalShortcut,
  Menu,
  Tray,
  nativeImage
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'
import { chat as ollamaChat } from './services/ollamaService'

let tray: Tray | null = null

interface StoreSchema {
  windowPosition: { x: number; y: number } | null
  characterSize: number
}

const StoreConstructor = (Store as unknown as { default: typeof Store }).default || Store
const store = new StoreConstructor<StoreSchema>({
  defaults: {
    windowPosition: null,
    characterSize: 300
  }
})

const DEFAULT_SIZE = store.get('characterSize')
let currentWindowSize = { width: DEFAULT_SIZE, height: DEFAULT_SIZE }
let interactionMode: 'passthrough' | 'interactive' | 'ghost' = 'passthrough'
let mainWindow: BrowserWindow | null = null

const dragState = {
  isDragging: false,
  startMouseX: 0,
  startMouseY: 0,
  startWindowX: 0,
  startWindowY: 0
}

function setupDragHandlers(win: BrowserWindow): () => void {
  const handleMouseMove = (): void => {
    if (!dragState.isDragging) return

    const { x: mouseX, y: mouseY } = screen.getCursorScreenPoint()
    const deltaX = mouseX - dragState.startMouseX
    const deltaY = mouseY - dragState.startMouseY

    win.setBounds({
      x: dragState.startWindowX + deltaX,
      y: dragState.startWindowY + deltaY,
      width: currentWindowSize.width,
      height: currentWindowSize.height
    })
  }

  const interval = setInterval(handleMouseMove, 16)
  return () => clearInterval(interval)
}

function createWindow(): void {
  const savedPosition = store.get('windowPosition')
  const savedSize = store.get('characterSize')

  mainWindow = new BrowserWindow({
    width: savedSize,
    height: savedSize,
    x: savedPosition?.x,
    y: savedPosition?.y,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  currentWindowSize = { width: savedSize, height: savedSize }

  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('moved', () => {
    if (!mainWindow) return
    const [x, y] = mainWindow.getPosition()
    store.set('windowPosition', { x, y })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setCharacterSize(size: number): void {
  store.set('characterSize', size)
  currentWindowSize = { width: size, height: size }
  if (mainWindow) {
    mainWindow.setSize(size, size)
  }
}

function buildSizeSubmenu(): Electron.MenuItemConstructorOptions[] {
  const sizes = [100, 150, 200, 250, 300, 350, 400, 450, 500]
  const currentSize = store.get('characterSize')
  return sizes.map((size) => ({
    label: `${size}px`,
    type: 'radio' as const,
    checked: currentSize === size,
    click: (): void => setCharacterSize(size)
  }))
}

function setupMenuAndTray(): void {
  const trayIcon = nativeImage.createFromPath(icon)
  const resizedIcon = trayIcon.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)
  tray.setToolTip('My AI Pet')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Size',
      submenu: buildSizeSubmenu()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: (): void => app.quit()
    }
  ])
  tray.setContextMenu(contextMenu)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward: true })
      return
    }

    win.setIgnoreMouseEvents(false)
  })

  ipcMain.on('resize-window', (event, width: number, height: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    currentWindowSize = { width, height }
    win.setSize(width, height)
  })

  let cleanupDrag: (() => void) | null = null

  ipcMain.on('start-drag', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const { x: mouseX, y: mouseY } = screen.getCursorScreenPoint()
    const [winX, winY] = win.getPosition()

    dragState.isDragging = true
    dragState.startMouseX = mouseX
    dragState.startMouseY = mouseY
    dragState.startWindowX = winX
    dragState.startWindowY = winY

    cleanupDrag = setupDragHandlers(win)
  })

  ipcMain.on('stop-drag', () => {
    dragState.isDragging = false
    if (cleanupDrag) {
      cleanupDrag()
      cleanupDrag = null
    }
  })

  ipcMain.handle('get-interaction-mode', () => {
    return interactionMode
  })

  ipcMain.on('set-interaction-mode', (event, mode: 'passthrough' | 'interactive' | 'ghost') => {
    interactionMode = mode
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    if (mode === 'ghost') {
      win.setIgnoreMouseEvents(true, { forward: true })
    } else if (mode === 'interactive') {
      win.setIgnoreMouseEvents(false)
    }
  })

  ipcMain.handle('chat', async (_, message: string) => {
    try {
      const response = await ollamaChat(message)
      return { success: true, response }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  })

  ipcMain.handle('get-character-size', () => {
    return store.get('characterSize')
  })

  ipcMain.on('set-character-size', (_, size: number) => {
    setCharacterSize(size)
  })

  createWindow()

  setupMenuAndTray()

  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (!mainWindow) return

    const modeOrder: Array<'passthrough' | 'interactive' | 'ghost'> = [
      'passthrough',
      'interactive',
      'ghost'
    ]
    const currentIndex = modeOrder.indexOf(interactionMode)
    interactionMode = modeOrder[(currentIndex + 1) % modeOrder.length]

    mainWindow.webContents.send('interaction-mode-changed', interactionMode)

    if (interactionMode === 'ghost') {
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
    } else if (interactionMode === 'interactive') {
      mainWindow.setIgnoreMouseEvents(false)
    }
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
