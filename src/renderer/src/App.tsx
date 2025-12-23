import { useEffect, useRef } from 'react'

function App(): React.JSX.Element {
  const characterImage = new URL('./assets/characters/A.gif', import.meta.url).toString()
  const imageRef = useRef<HTMLImageElement | null>(null)
  const ignoreMouseRef = useRef<boolean | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const image = imageRef.current
    if (!image) return

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    canvasRef.current = canvas
    contextRef.current = context

    const updateIgnoreMouseEvents = (ignore: boolean): void => {
      if (ignoreMouseRef.current === ignore) return
      ignoreMouseRef.current = ignore
      window.api?.setIgnoreMouseEvents(ignore)
    }

    const syncCanvasSize = (): void => {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
    }

    const handleLoad = (): void => {
      syncCanvasSize()
    }

    if (image.complete) {
      handleLoad()
    } else {
      image.addEventListener('load', handleLoad)
    }

    updateIgnoreMouseEvents(true)

    const handleMouseMove = (event: MouseEvent): void => {
      if (!canvas.width || !canvas.height) {
        updateIgnoreMouseEvents(true)
        return
      }

      const rect = image.getBoundingClientRect()
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!inside) {
        updateIgnoreMouseEvents(true)
        return
      }

      const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      const alpha = context.getImageData(x, y, 1, 1).data[3]
      updateIgnoreMouseEvents(alpha === 0)
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      image.removeEventListener('load', handleLoad)
      window.api?.setIgnoreMouseEvents(false)
    }
  }, [])

  return <img ref={imageRef} className="character" src={characterImage} alt="character" />
}

export default App
