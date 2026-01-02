/// <reference types="vite/client" />

type InteractionMode = 'passthrough' | 'interactive' | 'ghost'

interface ChatResponse {
  success: boolean
  response?: string
  error?: string
}

interface Window {
  api?: {
    setIgnoreMouseEvents: (ignore: boolean) => void
    startDrag: () => void
    stopDrag: () => void
    resizeWindow: (width: number, height: number) => void
    getInteractionMode: () => Promise<InteractionMode>
    setInteractionMode: (mode: InteractionMode) => void
    onInteractionModeChanged: (callback: (mode: InteractionMode) => void) => () => void
    chat: (message: string) => Promise<ChatResponse>
    getCharacterSize: () => Promise<number>
    setCharacterSize: (size: number) => void
  }
}
