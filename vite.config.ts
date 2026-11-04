import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleEa } from './server/ea'

// No @types/node in this project, so reach process defensively.
const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process

/**
 * Vite only exposes VITE_ prefixed variables to the browser, so the key lives
 * here and in server/ea.ts and nowhere near the bundle.
 */
function pick(fileEnv: Record<string, string>, name: string): string | undefined {
  const v = fileEnv[name] ?? proc?.env?.[name]
  return v && v.trim() ? v.trim() : undefined
}

interface EaEnv {
  apiKey?: string
  baseUrl: string
  model: string
}

function eaProxy(env: EaEnv) {
  return {
    name: 'hermes-ea-proxy',
    configureServer(server: {
      middlewares: { use: (path: string, fn: (req: any, res: any) => void) => void }
    }) {
      server.middlewares.use('/api/ea', (req: any, res: any) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.setHeader('cache-control', 'no-store')
          res.end(JSON.stringify(body))
        }

        if (req.method !== 'POST') return send(405, { error: 'method' })

        let raw = ''
        req.on('data', (chunk: { toString: () => string }) => {
          raw += chunk.toString()
          if (raw.length > 200_000) req.destroy()
        })
        req.on('end', () => {
          let parsed: unknown = {}
          try {
            parsed = JSON.parse(raw || '{}')
          } catch {
            return send(400, { error: 'bad_json' })
          }
          void handleEa(parsed as { utterance?: unknown; context?: unknown }, env).then(
            (result) => send(result.status, result.body),
            () => send(500, { error: 'handler' }),
          )
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, '.', '')

  // Extra hostnames are injected per-run so the preview host never lands in the repo.
  const allowedHosts = (pick(fileEnv, 'VITE_ALLOWED_HOSTS') ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)

  const ea: EaEnv = {
    apiKey:
      pick(fileEnv, 'EA_API_KEY') ??
      pick(fileEnv, 'OPENROUTER_API_KEY') ??
      pick(fileEnv, 'OPENAI_API_KEY'),
    baseUrl: pick(fileEnv, 'EA_BASE_URL') ?? 'https://openrouter.ai/api/v1',
    model: pick(fileEnv, 'EA_MODEL') ?? 'openai/gpt-4o-mini',
  }

  return {
    plugins: [react(), eaProxy(ea)],
    server: { host: '0.0.0.0', port: 3000, strictPort: true, allowedHosts },
    preview: { host: '0.0.0.0', port: 3000, strictPort: true, allowedHosts },
  }
})
