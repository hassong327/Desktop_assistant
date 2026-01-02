import { useCallback, useRef } from 'react'

interface WindowDragOptions {
  checkCanDrag?: (clientX: number, clientY: number) => boolean
  enabled?: boolean
}

interface WindowDragResult {
  handleMouseDown: (event: React.MouseEvent) => void
}

export function useWindowDrag({
  checkCanDrag,
  enabled = true
}: WindowDragOptions = {}): WindowDragResult {
  const isDraggingRef = useRef(false)

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!enabled) return
      if (event.button !== 0) return

      if (checkCanDrag && !checkCanDrag(event.clientX, event.clientY)) {
        return
      }

      isDraggingRef.current = true
      window.api?.startDrag()

      const handleMouseUp = (): void => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false
          window.api?.stopDrag()
        }
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mouseup', handleMouseUp)
    },
    [checkCanDrag, enabled]
  )

  return { handleMouseDown }
}
