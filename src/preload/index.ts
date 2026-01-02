import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  setIgnoreMouseEvents: (ignore: boolean): void => {
    ipcRenderer.send('set-ignore-mouse-events', ignore)
  },
  startDrag: (): void => {
    ipcRenderer.send('start-drag')
  },
  stopDrag: (): void => {
    ipcRenderer.send('stop-drag')
  },
  resizeWindow: (width: number, height: number): void => {
    ipcRenderer.send('resize-window', width, height)
  },
  getInteractionMode: (): Promise<'passthrough' | 'interactive' | 'ghost'> => {
    return ipcRenderer.invoke('get-interaction-mode')
  },
  setInteractionMode: (mode: 'passthrough' | 'interactive' | 'ghost'): void => {
    ipcRenderer.send('set-interaction-mode', mode)
  },
  onInteractionModeChanged: (
    callback: (mode: 'passthrough' | 'interactive' | 'ghost') => void
  ): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      mode: 'passthrough' | 'interactive' | 'ghost'
    ): void => {
      callback(mode)
    }
    ipcRenderer.on('interaction-mode-changed', handler)
    return () => {
      ipcRenderer.removeListener('interaction-mode-changed', handler)
    }
  },
  chat: (message: string): Promise<{ success: boolean; response?: string; error?: string }> => {
    return ipcRenderer.invoke('chat', message)
  },
  getCharacterSize: (): Promise<number> => {
    return ipcRenderer.invoke('get-character-size')
  },
  setCharacterSize: (size: number): void => {
    ipcRenderer.send('set-character-size', size)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
