import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatApp from './ChatApp'
import './assets/chat.css'
import './lib/tauri-api'

ReactDOM.createRoot(document.getElementById('chat-root') as HTMLElement).render(
  <React.StrictMode>
    <ChatApp />
  </React.StrictMode>
)
