import { useCallback, useEffect, useRef, useState } from 'react'
import { NEEDS, OVERNIGHT, WORRY, type DeptId } from '../data/org'
import { cancelSpeech, speak } from '../lib/speech'
import { useSpeaking } from '../lib/useSpeaking'
import { useVoice } from '../lib/voice'
import { AgentMark } from './Marks'

export type Decision = 'pending' | 'approved' | 'changes'

interface Exchange {
  id: number
  me: string
  ea: string
}

export function Rail({
  decisions,
  onEnter,
  onCommand,
}: {
  decisions: Record<string, Decision>
  onEnter: (id: DeptId) => void
  onCommand: (text: string) => Promise<string> | string
}) {
  const [draft, setDraft] = useState('')
  const [thread, setThread] = useState<Exchange[]>([])
  const [handsFree, setHandsFree] = useState(false)
  const [thinking, setThinking] = useState(false)

  const hfRef = useRef(false)
  const startRef = useRef<() => void>(() => {})
  const thinkingRef = useRef(false)

  const setHF = useCallback((v: boolean) => {
    hfRef.current = v
    setHandsFree(v)
  }, [])

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      // One question in flight at a time — a double submit would talk over itself.
      if (!text || thinkingRef.current) return
      thinkingRef.current = true
      setThinking(true)

      const reply = await Promise.resolve(onCommand(text))
        .catch(() => 'Something went wrong on my side. Say that again.')
        .finally(() => {
          thinkingRef.current = false
          setThinking(false)
        })

      setThread((prev) => [...prev.slice(-2), { id: Date.now() + Math.random(), me: text, ea: reply }])
      // Hands-free: once Hermes finishes, hand the floor straight back.
      speak(reply, 'hermes', () => {
        if (hfRef.current) startRef.current()
      })
    },
    [onCommand],
  )

  const voice = useVoice((text) => {
    void submit(text)
  })
  const speaking = useSpeaking()

  useEffect(() => {
    startRef.current = voice.start
  }, [voice.start])

  useEffect(() => {
    if (voice.error) setHF(false)
  }, [voice.error, setHF])

  const takeFloor = () => {
    cancelSpeech()
    setHF(true)
    voice.start()
  }

  const onMic = () => {
    if (voice.listening) {
      setHF(false)
      voice.stop()
      return
    }
    takeFloor()
  }

  const open = NEEDS.filter((n) => decisions[n.id] === 'pending')
  const talking = voice.listening || speaking || thinking

  return (
    <aside className="rail">
      <div className="rail-hd">
        <span className="label">Mission control</span>
        <span className="rail-live">
          <i className="dot s-working" /> live
        </span>
      </div>

      <div className="rail-greeting">
        <AgentMark mark="dia" color="#9a8cff" status={voice.listening ? 'waiting' : 'working'} size={34} />
        <div>
          <div className="rail-name">Hermes · Executive assistant</div>
          <div className="rail-hello">Good morning, James.</div>
        </div>
      </div>

      <p className="rail-lede">
        {open.length > 0
          ? `${open.length} things need you. Everything else ran overnight.`
          : 'Nothing needs you. Everything else ran overnight.'}
      </p>

      <section className="section">
        <div className="section-label">
          <span>Completed overnight</span>
          <span className="section-count">5</span>
        </div>
        <ul className="overnight">
          {OVERNIGHT.map((o) => (
            <li key={o.text} className="ov-item">
              <span className="ov-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="ov-text">{o.text}</span>
              <span className="ov-time">{o.time}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="section-label">
          <span>Needs you now</span>
          <span className="section-count">{open.length}</span>
        </div>
        {open.length === 0 && <p className="rail-empty">Queue clear. I will keep working.</p>}
        <ul className="needs">
          {open.map((n) => (
            <li key={n.id}>
              <button className="need" onClick={() => onEnter(n.id)}>
                <span className="need-top">
                  <span className="need-label">{n.label}</span>
                  <span className={`impact ${n.impact === 'High' ? 'high' : 'med'}`}>{n.impact}</span>
                </span>
                <span className="need-meta">{n.meta}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="section-label">
          <span>One thing to watch</span>
        </div>
        <p className="worry">{WORRY}</p>
      </section>

      <div className="rail-ask">
        {thread.length > 0 && (
          <div className="rail-thread" aria-live="polite">
            {thread.map((x) => (
              <div key={x.id} className="exchange">
                <div className="bubble me">{x.me}</div>
                <div className="bubble ea">{x.ea}</div>
              </div>
            ))}
          </div>
        )}

        {talking && (
          <div className={`voice-strip ${speaking && !voice.listening ? 'speaking' : ''}`} aria-live="polite">
            <span className="voice-wave" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="voice-text">
              {voice.listening
                ? voice.interim || 'Listening…'
                : thinking
                  ? 'Hermes is thinking…'
                  : 'Hermes is speaking — tap the mic to cut in'}
            </span>
          </div>
        )}

        {voice.error && <p className="voice-error">{voice.error}</p>}

        <form
          className="ask-row"
          onSubmit={(e) => {
            e.preventDefault()
            void submit(draft)
            setDraft('')
          }}
        >
          <button
            type="button"
            className={`mic ${voice.listening ? 'on' : speaking ? 'speaking' : ''}`}
            onClick={speaking && !voice.listening ? takeFloor : onMic}
            disabled={!voice.supported}
            aria-pressed={voice.listening}
            title={
              !voice.supported
                ? 'Voice input needs Chrome, Edge or Safari'
                : voice.listening
                  ? 'Stop listening'
                  : speaking
                    ? 'Interrupt and talk'
                    : 'Talk to Hermes — stays open for a reply'
            }
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="9.2" y="3" width="5.6" height="10.4" rx="2.8" />
              <path d="M5.6 11.4a6.4 6.4 0 0012.8 0M12 17.8V21M8.6 21h6.8" strokeLinecap="round" />
            </svg>
          </button>
          <input
            className="ask-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={voice.listening ? 'Listening…' : 'Ask anything, or tap the mic'}
            aria-label="Ask your executive assistant"
          />
          <button className="ask-send" type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h13M12.5 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        <div className="rail-voice-foot">
          <span className="voice-hint">
            {handsFree
              ? 'Hands-free · reply when ready'
              : voice.supported
                ? 'Try “what needs me”'
                : 'Voice needs Chrome'}
          </span>
          {handsFree ? (
            <button
              className="voice-toggle"
              onClick={() => {
                setHF(false)
                voice.stop()
                cancelSpeech()
              }}
            >
              End
            </button>
          ) : (
            <span className="voice-hint">Room voices in the board</span>
          )}
        </div>
      </div>
    </aside>
  )
}
