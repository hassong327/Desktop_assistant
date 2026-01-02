import { useRef, useState, useCallback } from 'react'
import { usePixelTransparency, useWindowDrag, useInteractionMode } from './hooks'
import { ChatBubble } from './components/ChatBubble'

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

  const [showChat, setShowChat] = useState(false)
  const [chatResponse, setChatResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCharacterClick = useCallback(() => {
    if (isInteractive) {
      setShowChat(true)
      setChatResponse(null)
    }
  }, [isInteractive])

  const handleSendMessage = useCallback(async (message: string) => {
    setIsLoading(true)
    setChatResponse(null)

    try {
      const result = await window.api?.chat(message)
      if (result?.success && result.response) {
        setChatResponse(result.response)
      } else {
        setChatResponse(result?.error || 'Failed to get response')
      }
    } catch {
      setChatResponse('Error connecting to AI')
    } finally {
      setIsLoading(false)
    }

    setTimeout(() => {
      setChatResponse(null)
      setShowChat(false)
    }, 5000)
  }, [])

  const handleCloseChat = useCallback(() => {
    setShowChat(false)
    setChatResponse(null)
  }, [])

  return (
    <div className="pet-container">
      <ChatBubble
        isVisible={showChat}
        onSendMessage={handleSendMessage}
        response={chatResponse}
        isLoading={isLoading}
        onClose={handleCloseChat}
      />
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
