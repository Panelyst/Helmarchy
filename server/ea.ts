/**
 * The server side of the executive assistant.
 *
 * This is the only place an API key exists. It is never bundled: Vite only
 * exposes VITE_ prefixed variables to the browser, and nothing here is imported
 * by src/. The client talks to /api/ea, gets back a sentence, and falls back to
 * the deterministic router if this file says no.
 *
 * Deliberately dependency-free — no SDK. Every provider worth using speaks the
 * OpenAI chat-completions shape now, including OpenRouter and Anthropic's
 * compatibility endpoint, so one fetch covers all three.
 */

export type EaKind = 'answer' | 'status' | 'brief' | 'go'

export interface EaReply {
  kind: EaKind
  target?: string
  spoken: string
}

export interface EaEnv {
  apiKey?: string
  baseUrl: string
  model: string
  /** injected in tests */
  fetchImpl?: typeof fetch
}

export const KINDS: EaKind[] = ['answer', 'status', 'brief', 'go']

/**
 * State changes are not the model's to make. Approving a budget, amending a
 * plan or holding a meeting all move the gate, and those must come from the
 * router matching what you actually said — never from a paraphrase.
 */
const MUTATING = /approv|amend|\bhold\b|escalat|\breject|send.?back|\bchanges?\b/i

export const SYSTEM = [
  'You are Hermes, the executive assistant inside a small AI-native company.',
  'You speak to the founder, James, in a calm, specific, unhurried voice.',
  'Answer in one or two spoken sentences, under 45 words, numbers before adjectives.',
  'Never invent metrics: only use figures present in the STATE block you are given.',
  'If the state does not contain the answer, say what you do know and what you would check.',
  'You cannot approve, amend, hold or escalate anything. The interface does that from his',
  'direct instructions; you explain the situation and let him decide.',
  'Reply with JSON only, no prose around it:',
  '{"kind":"answer|status|brief|go","target":"optional room id","spoken":"the sentence you say aloud"}',
  'Use kind "go" only when he is clearly asking to be taken somewhere, and target one of:',
  'floor, board, marketing, engineering, research, operations, finance, people, data.',
].join(' ')

function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
}

/** Tolerant: models wrap JSON in prose, fences, or both. Take the first object. */
export function parseReply(raw: string): EaReply | null {
  if (!raw || typeof raw !== 'string') return null
  const text = stripFences(raw)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null

  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }

  const spokenRaw = obj.spoken ?? obj.text ?? obj.answer
  if (typeof spokenRaw !== 'string') return null
  const spoken = spokenRaw.trim().slice(0, 400)
  if (!spoken) return null

  const kindRaw = typeof obj.kind === 'string' ? obj.kind.trim().toLowerCase() : ''
  let kind: EaKind = 'answer'
  if (kindRaw === 'status' || kindRaw === 'brief' || kindRaw === 'go') kind = kindRaw
  // Any attempt to claim a state change is downgraded to plain explanation.
  if (MUTATING.test(kindRaw)) kind = 'answer'

  const target =
    kind === 'go' && typeof obj.target === 'string' ? obj.target.trim().toLowerCase() : undefined

  return { kind, ...(target ? { target } : {}), spoken }
}

function baseOf(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

/** One provider call. Returns the raw assistant text, or null if the shape is wrong. */
export async function complete(
  env: EaEnv,
  user: string,
): Promise<string | null> {
  const doFetch = env.fetchImpl ?? fetch
  const res = await doFetch(`${baseOf(env.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.apiKey ?? ''}`,
      'x-title': 'Helmarchy',
    },
    body: JSON.stringify({
      model: env.model,
      temperature: 0.4,
      max_tokens: 220,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`upstream ${res.status} ${detail.slice(0, 180)}`)
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[]
  }
  const content = json?.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : null
}

export interface EaRequest {
  utterance?: unknown
  context?: unknown
}

export async function handleEa(
  req: EaRequest,
  env: EaEnv,
): Promise<{ status: number; body: unknown }> {
  const utterance = typeof req.utterance === 'string' ? req.utterance.trim() : ''
  if (!utterance) return { status: 400, body: { error: 'empty_utterance' } }
  if (utterance.length > 500) return { status: 400, body: { error: 'too_long' } }

  if (!env.apiKey) {
    // Not an error the user should see mid-sentence: the client falls back.
    return { status: 503, body: { error: 'no_key' } }
  }

  const context = typeof req.context === 'string' ? req.context.slice(0, 4000) : ''
  const user = `STATE\n${context || '(no state provided)'}\n\nHE SAYS\n${utterance}`

  try {
    const raw = await complete(env, user)
    if (!raw) return { status: 502, body: { error: 'empty_completion' } }
    const reply = parseReply(raw)
    if (!reply) return { status: 502, body: { error: 'unparseable' } }
    return { status: 200, body: reply }
  } catch (err) {
    return {
      status: 502,
      body: { error: 'upstream', detail: err instanceof Error ? err.message : String(err) },
    }
  }
}
