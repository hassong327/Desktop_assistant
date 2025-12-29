import { useRef } from 'react'
import { usePixelTransparency, useWindowDrag } from './hooks'

function App(): React.JSX.Element {
  const characterImage = new URL('./assets/characters/A.png', import.meta.url).toString()
  const imageRef = useRef<HTMLImageElement | null>(null)

  const { checkPixelAlpha } = usePixelTransparency({ imageRef })
  const { handleMouseDown } = useWindowDrag({ checkCanDrag: checkPixelAlpha })

  return (
    <img
      ref={imageRef}
      className="character"
      src={characterImage}
      alt="character"
      onMouseDown={handleMouseDown}
    />
  )
}

export default App
