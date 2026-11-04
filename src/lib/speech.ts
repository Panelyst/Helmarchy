/**
 * One owner of speech output for the whole app, so two surfaces can never
 * talk over each other. Recognition lives in `voice.ts`; this is the mouth.
 *
 * Browser voices are a small, OS-dependent pool, so an "identity" here is a
 * (voice, pitch, rate) tuple derived deterministically from the agent id —
 * distinguishable, not characterful. Real casting needs a TTS vendor.
 */

let muted = false
let speaking = false
let current = 0
let warmed = false

const listeners = new Set<(speaking: boolean) => void>()

function synth(): SpeechSynthesis | undefined {
  return typeof window === 'undefined' ? undefined : window.speechSynthesis
}

function emit(): void {
  for (const l of listeners) l(speaking)
}

export function onSpeaking(cb: (speaking: boolean) => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function isSpeaking(): boolean {
  return speaking
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(next: boolean): void {
  muted = next
  if (next) cancelSpeech()
}

/** Some browsers only populate the voice list after a `voiceschanged` tick. */
export function warmVoices(): void {
  const s = synth()
  if (!s || warmed) return
  warmed = true
  s.getVoices()
  s.onvoiceschanged = () => {
    s.getVoices()
  }
}

function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // splitmix32 avalanche — the plain FNV value collided on adjacent bits
  h = (h ^ (h >>> 16)) >>> 0
  h = Math.imul(h, 0x7feb352d) >>> 0
  h = (h ^ (h >>> 15)) >>> 0
  h = Math.imul(h, 0x846ca68b) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h
}

export interface VoiceProfile {
  pitch: number
  rate: number
  voiceName: string | null
}

function voices(): SpeechSynthesisVoice[] {
  const s = synth()
  if (!s) return []
  const all = s.getVoices()
  const en = all.filter((v) => /^en/i.test(v.lang))
  return en.length ? en : all
}

export function profileFor(seed: string): VoiceProfile {
  const h = hash(seed)
  const list = voices()
  return {
    pitch: Math.round((0.84 + (h % 43) / 100) * 100) / 100,
    rate: Math.round((0.95 + ((h >>> 10) % 19) / 100) * 100) / 100,
    voiceName: list.length ? list[h % list.length].name : null,
  }
}

/*
 * Hash luck is not good enough for a room. Two of five board seats collided on
 * identical pitch and rate, which destroys attribution — the one thing voices
 * are for. A cast assigns bands by position instead, so every speaker in a set
 * is guaranteed to differ. Beyond ten speakers the bands wrap.
 */
const PITCH_BANDS = [0.88, 0.94, 1.0, 1.06, 1.12, 0.91, 0.97, 1.03, 1.09, 1.15]
const RATE_BANDS = [1.0, 1.05, 0.96, 1.08, 0.93, 1.02, 0.98, 1.06, 0.95, 1.04]

export function castVoices(ids: string[]): Record<string, VoiceProfile> {
  const list = voices()
  const sorted = [...new Set(ids)].sort()
  const rotate = sorted.length ? hash(sorted.join('|')) % PITCH_BANDS.length : 0
  const cast: Record<string, VoiceProfile> = {}
  sorted.forEach((id, i) => {
    const band = (i + rotate) % PITCH_BANDS.length
    cast[id] = {
      pitch: PITCH_BANDS[band],
      rate: RATE_BANDS[band],
      voiceName: list.length ? list[(hash(id) >>> 3) % list.length].name : null,
    }
  })
  return cast
}

export function speak(text: string, voice: string | VoiceProfile = 'hermes', onEnd?: () => void): void {
  const s = synth()
  const id = ++current

  if (muted || !s || typeof SpeechSynthesisUtterance === 'undefined') {
    onEnd?.()
    return
  }

  s.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const p = typeof voice === 'string' ? profileFor(voice) : voice
  u.pitch = p.pitch
  u.rate = p.rate
  u.volume = 0.95
  const match = s.getVoices().find((v) => v.name === p.voiceName)
  if (match) u.voice = match

  const done = () => {
    if (id !== current) return
    speaking = false
    emit()
    onEnd?.()
  }
  u.onend = done
  u.onerror = done

  speaking = true
  emit()
  s.speak(u)
}

export function cancelSpeech(): void {
  current++
  synth()?.cancel()
  if (speaking) {
    speaking = false
    emit()
  }
}
