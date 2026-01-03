import { useState, useCallback, useRef, useEffect } from 'react'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

function ChatApp(): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: '안녕! 나는 너의 데스크톱 펫이야~ 🐾' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      const userMessage: Message = {
        id: Date.now(),
        role: 'user',
        content: input.trim()
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      try {
        const result = await window.api?.chat(input.trim())
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result?.success
            ? result.response || '...'
            : result?.error || '오류가 발생했어...'
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: '연결 오류가 발생했어... 😢'
          }
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading]
  )

  const handleClose = useCallback(() => {
    window.api?.closeChat()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    },
    [handleClose]
  )

  return (
    <div className="chat-window" onKeyDown={handleKeyDown}>
      <div className="chat-header">
        <span className="chat-title">Pet Chat</span>
        <button className="chat-close" onClick={handleClose}>
          ×
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-bubble">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          autoFocus
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          전송
        </button>
      </form>
    </div>
  )
}

export default ChatApp
