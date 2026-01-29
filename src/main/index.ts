import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { initDatabase } from './database/connection'
import { runMigrations } from './database/migrations'
import { registerIpcHandlers } from './ipc/handlers'
import { startPriceUpdateScheduler, stopPriceUpdateScheduler } from './services/priceService'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Portfolio Manager',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Initialize database
  const db = initDatabase()
  runMigrations(db)

  // Register IPC handlers
  registerIpcHandlers(db)

  // Start price update scheduler
  startPriceUpdateScheduler(db)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopPriceUpdateScheduler()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
