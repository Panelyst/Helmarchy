import { DEPTS, NEEDS, OVERNIGHT, WORRY } from '../data/org'
import type { Intent } from './intents'

export interface EaReply {
  kind: 'answer' | 'status' | 'brief' | 'go'
  target?: string
  spoken: string
}

/**
 * A compact, honest snapshot of what is on screen. The assistant is only
 * allowed to reason about figures that appear here — everything else it is
 * instructed to admit it does not know.
 */
export function buildContext(decisions: Record<string, string>, where: string): string {
  const open = NEEDS.filter((n) => decisions[n.id] === 'pending')
  const lines = [
    `view: ${where}`,
    `needs_him: ${open.length ? open.map((n) => `${n.label} (${n.impact})`).join('; ') : 'nothing'}`,
    `decisions: ${Object.entries(decisions)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`,
    `overnight_done: ${OVERNIGHT.map((o) => o.text).join('; ')}`,
    `watch: ${WORRY}`,
  ]

  for (const d of DEPTS) {
    if (d.id === 'board') continue
    const head = d.agents.find((a) => a.isHead) ?? d.agents[0]
    const gate = d.gate ? ` gate="${d.gate.title}"` : ''
    lines.push(
      `dept ${d.id}: head=${head.name} spend=${d.spend} budget=${d.budget} agents=${d.agents.length}${gate}`,
    )
  }

  return lines.join('\n')
}

/**
 * Ask the server-side assistant. Returns null for every failure mode — no key,
 * offline, slow, unparseable — so the caller can fall back to the router rather
 * than leaving the user waiting on a spinner that will never resolve.
 */
export async function askEa(utterance: string, context: string): Promise<EaReply | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12000)
  try {
    const res = await fetch('/api/ea', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ utterance, context }),
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const json = (await res.json()) as Partial<EaReply>
    if (typeof json.spoken !== 'string' || !json.spoken.trim()) return null
    const kind =
      json.kind === 'status' || json.kind === 'brief' || json.kind === 'go' ? json.kind : 'answer'
    return { kind, ...(typeof json.target === 'string' ? { target: json.target } : {}), spoken: json.spoken }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Rooms the assistant is allowed to navigate to. */
export function targetFor(intent: Intent): string | null {
  return intent.kind === 'go' ? intent.to : null
}
