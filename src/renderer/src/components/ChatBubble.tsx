import { useState, useRef, useEffect } from 'react'

interface ChatBubbleProps {
  isVisible: boolean
  onSendMessage: (message: string) => void
  response: string | null
  isLoading: boolean
  onClose: () => void
}

export function ChatBubble({
  isVisible,
  onSendMessage,
  response,
  isLoading,
  onClose
}: ChatBubbleProps): React.JSX.Element | null {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onClose])

  if (!isVisible) return null

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="chat-bubble">
      {isLoading ? (
        <div className="chat-loading">
          <span />
          <span />
          <span />
        </div>
      ) : response ? (
        <div className="chat-response">{response}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
          />
        </form>
      )}
    </div>
  )
}
