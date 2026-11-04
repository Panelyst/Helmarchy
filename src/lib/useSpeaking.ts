import { useEffect, useState } from 'react'
import { onSpeaking } from './speech'

/** Reactive read on whether anything in the app is currently talking. */
export function useSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(false)
  useEffect(() => onSpeaking(setSpeaking), [])
  return speaking
}
