import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEPTS, NEEDS, type DeptId } from './data/org'
import type { BoardOutcome } from './data/board'
import { route, type Intent } from './lib/intents'
import { askEa, buildContext } from './lib/ea'
import { warmVoices } from './lib/speech'
import { BoardRoom } from './components/BoardRoom'
import { DeptRoom } from './components/DeptRoom'
import { Floor } from './components/Floor'
import { Rail, type Decision } from './components/Rail'
import { TopBar } from './components/TopBar'

type View = { k: 'floor' } | { k: 'dept'; id: DeptId } | { k: 'board' }

function sentenceList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export default function App() {
  const [view, setView] = useState<View>({ k: 'floor' })
  const [decisions, setDecisions] = useState<Record<string, Decision>>({
    marketing: 'pending',
    finance: 'pending',
    board: 'pending',
  })
  const [outcome, setOutcome] = useState<BoardOutcome | null>(null)
  const [escalated, setEscalated] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 3600)
  }, [])

  useEffect(() => {
    warmVoices()
  }, [])

  const pending = useMemo(
    () => Object.values(decisions).filter((d) => d === 'pending').length,
    [decisions],
  )

  const go = useCallback((next: View) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }, [])

  const enter = useCallback(
    (id: DeptId) => go(id === 'board' ? { k: 'board' } : { k: 'dept', id }),
    [go],
  )

  const set = useCallback((id: DeptId, d: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: d }))
  }, [])

  const resolveBoard = useCallback(
    (o: BoardOutcome) => {
      setOutcome(o)
      setDecisions((prev) => ({
        ...prev,
        board: 'approved',
        marketing: o === 'as-scoped' ? 'approved' : 'changes',
      }))
      flash(
        o === 'as-scoped'
          ? 'Board approved the launch as scoped — flight starts at 10:00'
          : o === 'amended'
            ? 'Approved with amendments — Marketing is re-cutting the plan for 11:30'
            : 'Held to Thursday — no spend today, four actions filed',
      )
    },
    [flash],
  )

  /**
   * Deterministic first. Everything the router recognises resolves instantly and
   * free; the model only ever sees the sentences it did not understand.
   */
  const run = useCallback(
    (intent: Intent): string => {
      const open = NEEDS.filter((n) => decisions[n.id] === 'pending')
      const here = view.k === 'dept' ? DEPTS.find((d) => d.id === view.id) : undefined

      switch (intent.kind) {
        case 'go': {
          if (intent.to === 'floor') {
            go({ k: 'floor' })
            return 'Back to the floor.'
          }
          if (intent.to === 'board') {
            go({ k: 'board' })
            return 'The board room. Five seats, twenty minutes.'
          }
          const d = DEPTS.find((x) => x.id === intent.to)
          if (!d) return 'I cannot find that room.'
          go({ k: 'dept', id: d.id })
          const head = d.agents.find((a) => a.isHead) ?? d.agents[0]
          const first = head.name.split(' ')[0]
          return d.gate && decisions[d.id] === 'pending'
            ? `${d.name}. ${first} is holding for your approval.`
            : `${d.name}. ${first} is ${head.status === 'idle' ? 'quiet' : 'working'}.`
        }

        case 'approve': {
          if (view.k === 'board' && !outcome) {
            resolveBoard('as-scoped')
            return 'Approved as scoped. The flight starts at ten.'
          }
          if (here?.gate && decisions[here.id] === 'pending') {
            set(here.id, 'approved')
            flash(`${here.gate.title} approved`)
            return 'Approved. I have told the department to move, and I will bring you the spend at six.'
          }
          const next = open[0]
          if (!next) return 'Nothing is waiting on you. Everything else ran overnight.'
          if (next.id === 'board') {
            go({ k: 'board' })
            return 'The board room is in session. Hear both sides before I put a signature on it.'
          }
          const d = DEPTS.find((x) => x.id === next.id)
          if (!d) return 'I could not find that department.'
          set(d.id, 'approved')
          flash(`Approved — ${d.short} is moving`)
          return `Approved ${next.said}. ${d.short} is moving.`
        }

        case 'amend': {
          if (view.k === 'board' && !outcome) {
            resolveBoard('amended')
            return 'Carried with the three amendments. Marketing re-cuts the plan for half past eleven.'
          }
          return 'The amendments only exist at the board table. Open the board room and I will put it to them.'
        }

        case 'hold': {
          if (view.k === 'board' && !outcome) {
            resolveBoard('held')
            return 'Held to Thursday. Nothing spends today.'
          }
          return 'Nothing is in session to hold. Say, open the board room.'
        }

        case 'changes': {
          if (here?.gate && decisions[here.id] === 'pending') {
            set(here.id, 'changes')
            flash('Sent back for rework')
            return 'Sent back. I will have a revised plan from them within the hour.'
          }
          return 'There is nothing in front of you to send back.'
        }

        case 'escalate': {
          if (here?.gate) set(here.id, 'changes')
          setEscalated(true)
          go({ k: 'board' })
          flash('Escalated to the board room')
          return 'Escalated. The board room is open, and everyone at that table has an opinion.'
        }

        case 'status': {
          if (!open.length) return 'Nothing needs you. The queue is empty.'
          return `${open.length} things need you: ${sentenceList(open.map((n) => n.said))}.`
        }

        case 'brief':
          return 'Overnight: the campaign is dressed and waiting, the forecast came in four percent over plan, and support cleared its queue for the first time in nine days.'

        default:
          return 'I can open a room, tell you what needs you, or approve what is waiting. Try, what needs me.'
      }
    },
    [decisions, view, go, set, flash, outcome, resolveBoard],
  )

  /**
   * The assistant proper. Known commands never leave the browser; anything else
   * goes to the server, which returns one spoken sentence or nothing at all. If
   * it returns nothing the user still gets a reply, just a plainer one.
   */
  const command = useCallback(
    async (text: string): Promise<string> => {
      const intent = route(text)
      if (intent.kind !== 'unknown') return run(intent)

      const where = view.k === 'dept' ? view.id : view.k
      const reply = await askEa(text, buildContext(decisions, where))
      if (!reply) {
        return 'I did not follow that one. I can open a room, tell you what needs you, or approve what is waiting.'
      }

      if (reply.kind === 'go' && reply.target) {
        const t = reply.target
        if (t === 'floor') go({ k: 'floor' })
        else if (t === 'board') go({ k: 'board' })
        else if (DEPTS.some((d) => d.id === t)) go({ k: 'dept', id: t as DeptId })
      }

      return reply.spoken
    },
    [run, decisions, view, go],
  )

  const dept = view.k === 'dept' ? DEPTS.find((d) => d.id === view.id) : undefined

  return (
    <div className="shell">
      <TopBar
        pending={pending}
        onHome={() => go({ k: 'floor' })}
        onStub={(what) => flash(`${what} is not in this prototype yet`)}
      />

      <div className="body">
        <main className="main">
          {view.k === 'floor' && <Floor decisions={decisions} onEnter={enter} />}

          {view.k === 'board' && (
            <BoardRoom
              outcome={outcome}
              escalated={escalated}
              onBack={() => go({ k: 'floor' })}
              onResolve={resolveBoard}
              onReopen={() => {
                setOutcome(null)
                setDecisions((prev) => ({ ...prev, board: 'pending' }))
                flash('The meeting is back in session')
              }}
            />
          )}

          {dept && (
            <DeptRoom
              dept={dept}
              decision={decisions[dept.id] ?? 'pending'}
              onBack={() => go({ k: 'floor' })}
              onApprove={() => {
                set(dept.id, 'approved')
                flash(`${dept.gate?.title ?? 'Decision'} approved — ${dept.short} is moving`)
              }}
              onChanges={(note) => {
                set(dept.id, 'changes')
                flash(note ? 'Sent back to the department with your note' : 'Sent back for rework')
              }}
              onEscalate={() => {
                set(dept.id, 'changes')
                setEscalated(true)
                go({ k: 'board' })
                flash('Escalated — the board room is in session, five seats waiting')
              }}
              onRevert={() => {
                set(dept.id, 'pending')
                flash('Decision reopened')
              }}
            />
          )}
        </main>

        <Rail decisions={decisions} onEnter={enter} onCommand={command} />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
