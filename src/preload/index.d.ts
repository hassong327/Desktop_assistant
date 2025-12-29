import { ElectronAPI } from '@electron-toolkit/preload'

export interface CustomAPI {
  setIgnoreMouseEvents: (ignore: boolean) => void
  startDrag: () => void
  stopDrag: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}

export {}
