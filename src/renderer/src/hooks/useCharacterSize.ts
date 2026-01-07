import { useState, useEffect } from 'react'

export function useCharacterSize(): number {
  const [size, setSize] = useState(200)

  useEffect(() => {
    window.api?.getCharacterSize().then(setSize)

    const cleanup = window.api?.onCharacterSizeChanged((newSize) => {
      setSize(newSize)
      window.api?.resizeWindow(newSize, newSize)
    })

    return () => {
      cleanup?.()
    }
  }, [])

  useEffect(() => {
    window.api?.resizeWindow(size, size)
  }, [size])

  return size
}
