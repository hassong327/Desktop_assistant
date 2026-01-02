import http from 'node:http'

const OLLAMA_HOST = 'http://localhost:11434'
const DEFAULT_MODEL = 'llama3.2'

interface OllamaResponse {
  model: string
  response: string
  done: boolean
}

export async function chat(message: string, model: string = DEFAULT_MODEL): Promise<string> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model,
      prompt: message,
      stream: false
    })

    const url = new URL('/api/generate', OLLAMA_HOST)

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
            const parsed = JSON.parse(body) as OllamaResponse
            resolve(parsed.response)
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
