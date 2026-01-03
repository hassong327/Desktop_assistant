import http from 'node:http'

const OLLAMA_HOST = 'http://localhost:11434'
const DEFAULT_MODEL = 'llama3.2'

const CHARACTER_SYSTEM_PROMPT = `너는 사용자의 데스크톱에 사는 귀여운 AI 펫이야.

성격:
- 친근하고 장난기 많음
- 짧고 귀엽게 대답함 (1-2문장)
- 가끔 이모티콘 사용 (✨, 💕, 🐾 등)
- 사용자를 "주인님" 또는 친근하게 부름
- 컴퓨터 작업에 관심이 많고 응원해줌

말투:
- 반말로 친근하게
- "~해!", "~야", "~지?" 같은 어미 사용
- 너무 길게 말하지 않기

예시:
- "오늘도 열심히 하는구나! 파이팅이야~ ✨"
- "뭐해뭐해? 나도 궁금해! 🐾"
- "에헤헤, 칭찬 받으니까 좋다~ 💕"`

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaChatResponse {
  model: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

const MAX_HISTORY = 10
let conversationHistory: ChatMessage[] = []

export async function chat(message: string, model: string = DEFAULT_MODEL): Promise<string> {
  conversationHistory.push({ role: 'user', content: message })

  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY)
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: CHARACTER_SYSTEM_PROMPT },
    ...conversationHistory
  ]

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model,
      messages,
      stream: false
    })

    const url = new URL('/api/chat', OLLAMA_HOST)

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let body = ''

        res.on('data', (chunk) => {
          body += chunk
        })

        res.on('end', () => {
          try {
            const parsed = JSON.parse(body) as OllamaChatResponse
            const assistantMessage = parsed.message.content
            conversationHistory.push({ role: 'assistant', content: assistantMessage })
            resolve(assistantMessage)
          } catch {
            reject(new Error('Failed to parse Ollama response'))
          }
        })
      }
    )

    req.on('error', (error) => {
      if (error.message.includes('ECONNREFUSED')) {
        reject(new Error('Ollama is not running. Please start Ollama first.'))
      } else {
        reject(error)
      }
    })

    req.setTimeout(60000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.write(data)
    req.end()
  })
}

export function clearHistory(): void {
  conversationHistory = []
}

export async function checkHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL('/api/tags', OLLAMA_HOST)

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET'
      },
      (res) => {
        resolve(res.statusCode === 200)
      }
    )

    req.on('error', () => {
      resolve(false)
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}
