import { ElectronAPI } from '@electron-toolkit/preload'

export type InteractionMode = 'passthrough' | 'interactive' | 'ghost'

export interface CustomAPI {
  setIgnoreMouseEvents: (ignore: boolean) => void
  startDrag: () => void
  stopDrag: () => void
  resizeWindow: (width: number, height: number) => void
  getInteractionMode: () => Promise<InteractionMode>
  setInteractionMode: (mode: InteractionMode) => void
  onInteractionModeChanged: (callback: (mode: InteractionMode) => void) => () => void
  chat: (message: string) => Promise<{ success: boolean; response?: string; error?: string }>
  getCharacterSize: () => Promise<number>
  setCharacterSize: (size: number) => void
  toggleChat: () => void
  closeChat: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}

export {}
