import { useCallback, useEffect, useRef, useState } from 'react'

/* Minimal typings for the Web Speech API — not in every TS DOM lib yet. */
interface Alt {
  transcript: string
}
interface Result {
  isFinal: boolean
  0: Alt
}
interface ResultList {
  length: number
  [i: number]: Result
}
interface ResultEvent extends Event {
  resultIndex: number
  results: ResultList
}
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: ResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
type RecognitionCtor = new () => Recognition

function ctor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone blocked. Allow it in the address bar, then try again.',
  'service-not-allowed': 'This frame cannot use the speech service. Open the app in its own tab.',
  'no-speech': 'Heard nothing. Tap the mic and try again.',
  network: 'The speech service could not be reached.',
  'audio-capture': 'No microphone found.',
}

/** Recognition only — speech output lives in `speech.ts`. */
export function useVoice(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const finalRef = useRef(onFinal)
  const recRef = useRef<Recognition | null>(null)

  useEffect(() => {
    finalRef.current = onFinal
  }, [onFinal])

  useEffect(() => {
    setSupported(!!ctor())
    return () => {
      recRef.current?.abort()
      recRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    const Ctor = ctor()
    if (!Ctor) {
      setError('Voice input needs Chrome, Edge or Safari.')
      return
    }
    recRef.current?.abort()
    const rec = new Ctor()
    rec.lang = navigator.language || 'en-US'
    rec.continuous = false
    rec.interimResults = true

    rec.onstart = () => {
      setError(null)
      setListening(true)
    }
    rec.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const text = r[0]?.transcript?.trim() ?? ''
        if (r.isFinal) {
          if (text) finalRef.current(text)
        } else {
          live += r[0]?.transcript ?? ''
        }
      }
      setInterim(live)
    }
    rec.onerror = (e) => {
      if (e.error === 'aborted') return
      setError(ERRORS[e.error] ?? 'Voice input failed. Try again.')
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      setInterim('')
      recRef.current = null
    }

    recRef.current = rec
    try {
      rec.start()
    } catch {
      setError('Voice is already listening.')
    }
  }, [])

  return { supported, listening, interim, error, start, stop, clearError: () => setError(null) }
}
