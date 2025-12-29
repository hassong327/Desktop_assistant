/// <reference types="vite/client" />

interface Window {
  api?: {
    setIgnoreMouseEvents: (ignore: boolean) => void
    startDrag: () => void
    stopDrag: () => void
  }
}
