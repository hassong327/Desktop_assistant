import { useState, useEffect, useCallback } from 'react'

interface InteractionModeResult {
  mode: InteractionMode
  setMode: (mode: InteractionMode) => void
  cycleMode: () => void
  isInteractive: boolean
  isGhost: boolean
}

export function useInteractionMode(): InteractionModeResult {
  const [mode, setModeState] = useState<InteractionMode>('passthrough')

  useEffect(() => {
    window.api?.getInteractionMode().then(setModeState)

    const cleanup = window.api?.onInteractionModeChanged((newMode) => {
      setModeState(newMode)
    })

    return () => {
      cleanup?.()
    }
  }, [])

  const setMode = useCallback((newMode: InteractionMode) => {
    setModeState(newMode)
    window.api?.setInteractionMode(newMode)
  }, [])

  const cycleMode = useCallback(() => {
    const modeOrder: InteractionMode[] = ['passthrough', 'interactive', 'ghost']
    const currentIndex = modeOrder.indexOf(mode)
    const newMode = modeOrder[(currentIndex + 1) % modeOrder.length]
    setMode(newMode)
  }, [mode, setMode])

  return {
    mode,
    setMode,
    cycleMode,
    isInteractive: mode === 'interactive',
    isGhost: mode === 'ghost'
  }
}
