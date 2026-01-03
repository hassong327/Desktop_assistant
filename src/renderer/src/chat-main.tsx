import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatApp from './ChatApp'
import './assets/chat.css'

ReactDOM.createRoot(document.getElementById('chat-root') as HTMLElement).render(
  <React.StrictMode>
    <ChatApp />
  </React.StrictMode>
)
