import { useEffect, useRef, useCallback } from 'react'

interface PixelTransparencyOptions {
  imageRef: React.RefObject<HTMLImageElement | null>
  enabled?: boolean
}

interface PixelTransparencyResult {
  isOverOpaque: boolean
  checkPixelAlpha: (clientX: number, clientY: number) => boolean
}

export function usePixelTransparency({
  imageRef,
  enabled = true
}: PixelTransparencyOptions): PixelTransparencyResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isOverOpaqueRef = useRef(false)
  const ignoreStateRef = useRef<boolean | null>(null)

  const updateIgnoreMouseEvents = useCallback((ignore: boolean) => {
    if (ignoreStateRef.current === ignore) return
    ignoreStateRef.current = ignore
    window.api?.setIgnoreMouseEvents(ignore)
  }, [])

  const checkPixelAlpha = useCallback(
    (clientX: number, clientY: number): boolean => {
      const image = imageRef.current
      const canvas = canvasRef.current
      const context = contextRef.current

      if (!image || !canvas || !context || !canvas.width || !canvas.height) {
        return false
      }

      const rect = image.getBoundingClientRect()
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom

      if (!inside) {
        return false
      }

      const x = Math.floor(((clientX - rect.left) / rect.width) * canvas.width)
      const y = Math.floor(((clientY - rect.top) / rect.height) * canvas.height)

      const alpha = context.getImageData(x, y, 1, 1).data[3]
      return alpha > 0
    },
    [imageRef]
  )

  useEffect(() => {
    if (!enabled) return

    const image = imageRef.current
    if (!image) return

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    canvasRef.current = canvas
    contextRef.current = context

    const drawImageToCanvas = (): void => {
      if (!image.naturalWidth || !image.naturalHeight) return
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
    }

    if (image.complete && image.naturalWidth) {
      drawImageToCanvas()
    }
    image.addEventListener('load', drawImageToCanvas)

    const handleMouseMove = (event: MouseEvent): void => {
      const isOpaque = checkPixelAlpha(event.clientX, event.clientY)
      isOverOpaqueRef.current = isOpaque
      updateIgnoreMouseEvents(!isOpaque)
    }

    updateIgnoreMouseEvents(true)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      image.removeEventListener('load', drawImageToCanvas)
      updateIgnoreMouseEvents(false)
    }
  }, [enabled, imageRef, checkPixelAlpha, updateIgnoreMouseEvents])

  return {
    isOverOpaque: isOverOpaqueRef.current,
    checkPixelAlpha
  }
}
