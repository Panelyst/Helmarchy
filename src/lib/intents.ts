import type { DeptId } from '../data/org'

export type Intent =
  | { kind: 'go'; to: 'floor' | 'board' | DeptId }
  | { kind: 'approve' }
  | { kind: 'amend' }
  | { kind: 'hold' }
  | { kind: 'escalate' }
  | { kind: 'changes' }
  | { kind: 'status' }
  | { kind: 'brief' }
  | { kind: 'unknown' }

/**
 * Deterministic phrase routing. Deliberately not a model call: at this stage the
 * point is to prove the command surface exists, and a model can replace this
 * function later without touching the UI.
 */
const TARGETS: [RegExp, DeptId | 'floor' | 'board'][] = [
  [/marketing|growth|campaign/, 'marketing'],
  [/engineer|engineering|platform|release/, 'engineering'],
  [/operation|\bops\b|support/, 'operations'],
  [/research|\blab\b/, 'research'],
  [/finance|financial|forecast|budget office/, 'finance'],
  [/people|\bhr\b|hiring|talent/, 'people'],
  [/\bdata\b|infra|infrastructure|systems/, 'data'],
  [/board|conference|executive|c-suite|c suite/, 'board'],
  [/floor|\bhome\b|organization|org chart|overview/, 'floor'],
]

export function route(raw: string): Intent {
  const t = ` ${raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `

  if (!t.trim()) return { kind: 'unknown' }

  if (/\bescalate|take it to the board|bring it to the board|ask the board|put it on the agenda/.test(t)) {
    return { kind: 'escalate' }
  }
  if (/\bamend|with the amendments|take the amendments|the three amendments|\bcap it\b|\btrim it\b/.test(t)) {
    return { kind: 'amend' }
  }
  if (/\bhold\b|wait until|delay it|push it to|not this week/.test(t)) {
    return { kind: 'hold' }
  }
  if (/\bapprove|approved|go ahead|green ?light|ship it|sign it|do it\b/.test(t)) {
    return { kind: 'approve' }
  }
  if (/send it back|request changes|\brevise|\bnot yet\b|change (it|the plan)|rework/.test(t)) {
    return { kind: 'changes' }
  }
  if (/what.*(need|waiting)|needs me|need me|\bstatus\b|\bqueue\b|anything for me|what.s left/.test(t)) {
    return { kind: 'status' }
  }
  if (/\bbrief|overnight|catch me up|summary|what happened|good morning|this morning\b/.test(t)) {
    return { kind: 'brief' }
  }

  for (const [re, to] of TARGETS) {
    if (re.test(t)) return { kind: 'go', to }
  }

  return { kind: 'unknown' }
}
