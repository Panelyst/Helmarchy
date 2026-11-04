import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BEATS,
  NUMBERS,
  OPTIONS,
  RESOLUTIONS,
  SEATS,
  TURNS,
  type BoardOutcome,
} from '../data/board'
import { cancelSpeech, castVoices, speak } from '../lib/speech'
import { useSpeaking } from '../lib/useSpeaking'
import { AgentMark, DeptGlyph } from './Marks'

const STANCE_LABEL = {
  chair: 'chair',
  support: 'support',
  concern: 'concern',
  opposed: 'opposed',
} as const

const STANCE_TONE = {
  chair: 'st-pending',
  support: 'st-approved',
  concern: 'st-changes',
  opposed: 'st-changes',
} as const

export function BoardRoom({
  outcome,
  escalated,
  onResolve,
  onReopen,
  onBack,
}: {
  outcome: BoardOutcome | null
  escalated: boolean
  onResolve: (o: BoardOutcome) => void
  onReopen: () => void
  onBack: () => void
}) {
  const total = TURNS.length
  const [revealed, setRevealed] = useState(outcome ? total : 0)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState<BoardOutcome | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const done = revealed >= total

  /* one voice per seat, spoken as each turn lands */
  const [voices, setVoices] = useState(false)
  const [speakingSeat, setSpeakingSeat] = useState<string | null>(null)
  const speaking = useSpeaking()
  const voiceCast = useMemo(() => castVoices(SEATS.map((s) => s.id)), [])

  useEffect(() => () => cancelSpeech(), [])

  useEffect(() => {
    if (!voices || revealed === 0) return
    const turn = TURNS[revealed - 1]
    const seat = SEATS.find((s) => s.id === turn.seat)
    if (!seat) return
    setSpeakingSeat(seat.id)
    const profile = voiceCast[seat.id] ?? seat.id
    speak(turn.text, profile, () => setSpeakingSeat((cur) => (cur === seat.id ? null : cur)))
  }, [revealed, voices, voiceCast])

  useEffect(() => {
    if (!playing || done) return
    const t = window.setTimeout(() => setRevealed((v) => Math.min(v + 1, total)), 2400)
    return () => window.clearTimeout(t)
  }, [playing, revealed, done, total])

  useEffect(() => {
    if (done) setPlaying(false)
  }, [done])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
        if (done) return
        e.preventDefault()
        setPlaying(false)
        setRevealed((v) => Math.min(v + 1, total))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, total])

  useEffect(() => {
    if (revealed === 0) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [revealed])

  const shown = TURNS.slice(0, revealed)
  const spoken = useMemo(() => new Set(shown.map((t) => t.seat)), [shown])
  const nextTurn = TURNS[revealed]
  const nextSeat = nextTurn ? SEATS.find((s) => s.id === nextTurn.seat) : undefined
  const resolution = outcome ? RESOLUTIONS[outcome] : null

  const beatState = (beatId: string) => {
    const turns = TURNS.filter((t) => t.beat === beatId)
    const lastIndex = TURNS.lastIndexOf(turns[turns.length - 1])
    if (revealed > lastIndex) return 'done'
    if (turns.some((t) => shown.includes(t))) return 'active'
    return 'todo'
  }

  const activeBeat = [...BEATS].reverse().find((b) => beatState(b.id) === 'active')
  const currentBeat = activeBeat ?? (done ? BEATS[BEATS.length - 1] : BEATS[0])

  return (
    <div className="board">
      <header className="dept-hd">
        <button className="back" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H6M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Floor
        </button>
        <span className="dept-sep" />
        <span className="dept-mark" style={{ color: '#9a8cff' }}>
          <DeptGlyph mark="dia" size={17} />
        </span>
        <div>
          <h1 className="dept-title">Board room</h1>
          <p className="dept-mandate">Executive session · 5 seats · one item</p>
        </div>
        <div className="board-status">
          {escalated && !outcome && <span className="escalated">Escalated from Marketing · 09:47</span>}
          <span className={`state-pill ${done ? 'st-approved' : 'st-pending'}`}>
            {outcome ? 'Adjourned 09:51' : done ? 'Your call' : 'In session'}
          </span>
        </div>
      </header>

      <div className="dept-grid board-grid">
        <div className="col left">
          <section className="panel">
            <div className="panel-hd">
              <span className="label">Agenda</span>
              <span className="panel-count">{done ? 'closed' : '09:44'}</span>
            </div>
            <ol className="agenda">
              {BEATS.map((b, i) => (
                <li key={b.id} className={`agenda-item ${beatState(b.id)} ${b.id === currentBeat.id ? 'current' : ''}`}>
                  <span className="agenda-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="agenda-text">
                    <span className="agenda-title">{b.title}</span>
                    <span className="agenda-meta">{b.meta}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel">
            <div className="panel-hd">
              <span className="label">At the table</span>
              <span className="panel-count">5</span>
            </div>
            <ul className="seats">
              {SEATS.map((s) => {
                const hasSpoken = spoken.has(s.id)
                const talking = speakingSeat === s.id || (!done && nextSeat?.id === s.id)
                return (
                  <li key={s.id} className={`seat ${hasSpoken ? '' : 'muted'} ${talking ? 'talking' : ''}`}>
                    <AgentMark mark={s.mark} color={s.color} status={talking ? 'waiting' : hasSpoken ? 'working' : 'idle'} size={32} />
                    <div className="seat-id">
                      <span className="seat-name">{s.name}</span>
                      <span className="seat-role" style={{ color: s.color }}>
                        {s.role}
                      </span>
                      {hasSpoken && s.condition && <span className="seat-condition">{s.condition}</span>}
                    </div>
                    <span className={`state-pill ${hasSpoken ? STANCE_TONE[s.stance] : 'st-idle'}`}>
                      {hasSpoken ? STANCE_LABEL[s.stance] : 'quiet'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <div className="col mid">
          <section className="panel minutes">
            <div className="panel-hd">
              <span className="label">Minutes</span>
              <span className="panel-count">
                {revealed}/{total} spoken
              </span>
            </div>

            <div className="minutes-body">
              {revealed === 0 && (
                <p className="minutes-empty">
                  Five seats, one item, twenty minutes. The chair opens when you are ready.
                </p>
              )}

              {BEATS.map((beat) => {
                const turns = shown.filter((t) => t.beat === beat.id)
                if (turns.length === 0) return null
                return (
                  <div key={beat.id} className="min-group">
                    <div className="beat">
                      <span className="beat-label">{beat.title}</span>
                      <span className="beat-meta">{beat.meta}</span>
                    </div>
                    {turns.map((t, i) => {
                      const seat = SEATS.find((s) => s.id === t.seat)!
                      const latest = shown[shown.length - 1] === t
                      return (
                        <article key={`${beat.id}-${i}`} className={`turn ${latest ? 'latest' : ''}`}>
                          <div className="turn-hd">
                            <AgentMark mark={seat.mark} color={seat.color} size={26} />
                            <span className="turn-who">{seat.name}</span>
                            <span className="turn-role" style={{ color: seat.color }}>
                              {seat.role}
                            </span>
                          </div>
                          <p className="turn-text">{t.text}</p>
                          {t.flag && (
                            <div className="flag">
                              <span className="flag-label">{t.flag.label}</span>
                              <span className="flag-detail">{t.flag.detail}</span>
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )
              })}

              <div ref={endRef} />
            </div>

            <div className="minutes-foot">
              {!done ? (
                <>
                  <button
                    className="btn primary"
                    onClick={() => {
                      setPlaying(false)
                      setRevealed((v) => Math.min(v + 1, total))
                    }}
                  >
                    {revealed === 0 ? 'Open the meeting' : `Next · ${nextSeat?.name ?? ''}`}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h13M12.5 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className={`btn ghost ${playing ? 'on' : ''}`} onClick={() => setPlaying((v) => !v)}>
                    {playing ? 'Pause' : 'Play'}
                  </button>
                  <button className="btn ghost" onClick={() => setRevealed(total)}>
                    Skip to your call
                  </button>
                  <button
                    className={`btn ghost tiny ${voices ? 'on' : ''}`}
                    onClick={() => {
                      if (voices) cancelSpeech()
                      setVoices((v) => !v)
                    }}
                  >
                    {voices ? 'Mute the room' : 'Hear the room'}
                  </button>
                  <span className="foot-hint">space to advance</span>
                </>
              ) : (
                <span className="foot-hint">
                  {speaking ? 'Speaking…' : 'The room is waiting on you.'}
                </span>
              )}
            </div>
          </section>

          {done && !outcome && (
            <section className="panel call">
              <div className="panel-hd">
                <span className="label">Your call</span>
                <span className="panel-count">binding</span>
              </div>
              <div className="options">
                {OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    className={`option ${hovered === o.id ? 'hot' : ''}`}
                    onMouseEnter={() => setHovered(o.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(o.id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => onResolve(o.id)}
                  >
                    <span className="option-top">
                      <span className="option-title">{o.title}</span>
                      <span className={`option-mark ${o.satisfies.length === 3 ? 'all' : o.satisfies.length ? 'some' : 'none'}`}>
                        {o.satisfies.length === 3 ? 'carries the room' : o.satisfies.length ? `satisfies ${o.satisfies.length}/3` : 'overrules 3'}
                      </span>
                    </span>
                    <span className="option-body">{o.body}</span>
                    <span className="option-cost">{o.cost}</span>
                    {hovered === o.id && <span className="option-go">Decide this →</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {resolution && (
            <section className="panel call resolved">
              <div className="panel-hd">
                <span className="label">Adjourned</span>
                <span className="panel-count">09:51</span>
              </div>
              <div className="resolved-body">
                <p className="res-summary">{resolution.summary}</p>
                <p className="dissent">
                  <span className="dissent-label">Dissent recorded</span>
                  {resolution.dissent}
                </p>
                <button className="btn ghost full" onClick={onReopen}>
                  Reopen the meeting
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="col right">
          <section className="panel">
            <div className="panel-hd">
              <span className="label">On the table</span>
              <span className="panel-count">Marketing</span>
            </div>
            <dl className="gate-rows flush">
              {NUMBERS.map((n) => (
                <div key={n.k} className="gate-row">
                  <dt>{n.k}</dt>
                  <dd className={n.tone ?? ''}>{n.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {resolution ? (
            <>
              <section className="panel">
                <div className="panel-hd">
                  <span className="label">Decisions</span>
                  <span className="panel-count">{resolution.decisions.length}</span>
                </div>
                <ul className="res-decisions">
                  {resolution.decisions.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </section>

              <section className="panel">
                <div className="panel-hd">
                  <span className="label">Filed to the org</span>
                  <span className="panel-count">{resolution.actions.length}</span>
                </div>
                <ul className="filed">
                  {resolution.actions.map((a) => (
                    <li key={a.what} className="filed-item">
                      <span className="filed-what">{a.what}</span>
                      <span className="filed-meta">
                        <span className="filed-owner">{a.owner}</span>
                        <span className="filed-due">{a.due}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <p className="board-note">
              Nothing is filed until you decide. The room leaves with either a decision or a note saying why there wasn’t one.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
