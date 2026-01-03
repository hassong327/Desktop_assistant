import { useRef, useCallback } from 'react'
import { usePixelTransparency, useWindowDrag, useInteractionMode } from './hooks'

function App(): React.JSX.Element {
  const characterImage = new URL('./assets/characters/A.png', import.meta.url).toString()
  const imageRef = useRef<HTMLImageElement | null>(null)

  const { mode, isInteractive, isGhost } = useInteractionMode()
  const { checkPixelAlpha } = usePixelTransparency({
    imageRef,
    enabled: mode === 'passthrough'
  })
  const { handleMouseDown } = useWindowDrag({
    checkCanDrag: checkPixelAlpha,
    enabled: !isGhost
  })

  const handleCharacterClick = useCallback(() => {
    if (isInteractive) {
      window.api?.toggleChat()
    }
  }, [isInteractive])

  return (
    <div className="pet-container">
      <img
        ref={imageRef}
        className={`character ${mode}`}
        src={characterImage}
        alt="character"
        onMouseDown={handleMouseDown}
        onClick={handleCharacterClick}
      />
    </div>
  )
}

export default App
