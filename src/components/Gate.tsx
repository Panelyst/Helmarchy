import { useState } from 'react'
import type { Dept } from '../data/org'
import type { Decision } from './Rail'

export function Gate({
  dept,
  decision,
  onApprove,
  onChanges,
  onEscalate,
  onRevert,
}: {
  dept: Dept
  decision: Decision
  onApprove: () => void
  onChanges: (note: string) => void
  onEscalate: () => void
  onRevert: () => void
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')

  if (!dept.gate) return null

  if (decision === 'approved') {
    return (
      <section className="panel gate approved">
        <div className="section-label">
          <span>Decision</span>
        </div>
        <div className="banner good">
          <strong>Approved at 09:47</strong>
          <span>Launch scheduled for 10:00. Spend reported daily; the flight stops automatically if CPA passes $45.</span>
        </div>
        <button className="btn ghost full" onClick={onRevert}>
          Reopen the decision
        </button>
      </section>
    )
  }

  if (decision === 'changes') {
    return (
      <section className="panel gate">
        <div className="section-label">
          <span>Decision</span>
        </div>
        <div className="banner warn">
          <strong>Sent back with a note</strong>
          <span>{note || 'Waiting on a revised plan.'}</span>
        </div>
        <button className="btn ghost full" onClick={onRevert}>
          Reopen the decision
        </button>
      </section>
    )
  }

  return (
    <section className="panel gate">
      <div className="gate-hd">
        <div className="section-label">
          <span>{dept.gate.title}</span>
        </div>
        <span className="gate-owner">You only</span>
      </div>

      <dl className="gate-rows">
        {dept.gate.rows.map((r) => (
          <div key={r.k} className="gate-row">
            <dt>{r.k}</dt>
            <dd className={r.tone ?? ''}>{r.v}</dd>
          </div>
        ))}
      </dl>

      {open && (
        <div className="changes">
          <label className="label" htmlFor="note">
            What needs to change
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Too much on paid social — bring it to $70k and hold the partner flight until week 3."
            rows={3}
          />
          <button className="btn warn full" onClick={() => onChanges(note)}>
            Send back for rework
          </button>
        </div>
      )}

      <div className="gate-actions">
        <button className="btn primary full" onClick={onApprove}>
          Approve
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="gate-secondary">
          <button className="btn ghost" onClick={() => setOpen((v) => !v)}>
            {open ? 'Cancel' : 'Request changes'}
          </button>
          <button className="btn ghost" onClick={onEscalate}>
            Escalate to the board room
          </button>
        </div>
      </div>
    </section>
  )
}
