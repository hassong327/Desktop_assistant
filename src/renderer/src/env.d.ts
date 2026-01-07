/// <reference types="vite/client" />

type InteractionMode = 'passthrough' | 'interactive' | 'ghost'

interface ChatResponse {
  success: boolean
  response?: string
  error?: string
}

interface TauriApi {
  setIgnoreMouseEvents: (ignore: boolean) => Promise<void>
  startDrag: () => Promise<void>
  stopDrag: () => void
  resizeWindow: (width: number, height: number) => Promise<void>
  getInteractionMode: () => Promise<InteractionMode>
  setInteractionMode: (mode: InteractionMode) => Promise<void>
  onInteractionModeChanged: (callback: (mode: InteractionMode) => void) => () => void
  chat: (message: string) => Promise<ChatResponse>
  getCharacterSize: () => Promise<number>
  setCharacterSize: (size: number) => Promise<void>
  onCharacterSizeChanged: (callback: (size: number) => void) => () => void
  toggleChat: () => Promise<void>
  closeChat: () => Promise<void>
}

interface Window {
  api?: TauriApi
}
