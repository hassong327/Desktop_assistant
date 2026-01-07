import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window'

export type InteractionMode = 'passthrough' | 'interactive' | 'ghost'

export interface ChatResponse {
  success: boolean
  response?: string
  error?: string
}

export const tauriApi = {
  async setIgnoreMouseEvents(ignore: boolean): Promise<void> {
    await invoke('set_ignore_mouse_events', { ignore })
  },

  async startDrag(): Promise<void> {
    await invoke('start_drag')
  },

  stopDrag(): void {},

  async resizeWindow(width: number, height: number): Promise<void> {
    const window = getCurrentWindow()
    await window.setSize(new PhysicalSize(width, height))
  },

  async getInteractionMode(): Promise<InteractionMode> {
    return await invoke<InteractionMode>('get_interaction_mode')
  },

  async setInteractionMode(mode: InteractionMode): Promise<void> {
    await invoke('set_interaction_mode', { mode })
  },

  onInteractionModeChanged(callback: (mode: InteractionMode) => void): () => void {
    let unlisten: UnlistenFn | null = null

    listen<InteractionMode>('interaction-mode-changed', (event) => {
      callback(event.payload)
    }).then((fn) => {
      unlisten = fn
    })

    return () => {
      unlisten?.()
    }
  },

  async chat(message: string): Promise<ChatResponse> {
    return await invoke<ChatResponse>('chat', { message })
  },

  async getCharacterSize(): Promise<number> {
    return await invoke<number>('get_character_size')
  },

  async setCharacterSize(size: number): Promise<void> {
    await invoke('set_character_size', { size })
  },

  onCharacterSizeChanged(callback: (size: number) => void): () => void {
    let unlisten: UnlistenFn | null = null

    listen<number>('character-size-changed', (event) => {
      callback(event.payload)
    }).then((fn) => {
      unlisten = fn
    })

    return () => {
      unlisten?.()
    }
  },

  async toggleChat(): Promise<void> {
    await invoke('toggle_chat')
  },

  async closeChat(): Promise<void> {
    await invoke('close_chat')
  }
}

if (typeof window !== 'undefined') {
  window.api = tauriApi
}

export default tauriApi
