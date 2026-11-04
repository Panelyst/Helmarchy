import type { Agent, Dept, Status } from '../data/org'
import { ArtifactCard } from './Artifact'
import { Gate } from './Gate'
import { AgentMark, DeptGlyph } from './Marks'
import type { Decision } from './Rail'

const STATUS_LABEL: Record<Status, string> = {
  working: 'working',
  idle: 'idle',
  blocked: 'blocked',
  waiting: 'waiting on you',
}

const TIERS: { tier: 0 | 1 | 2; label: string }[] = [
  { tier: 0, label: 'Head' },
  { tier: 1, label: 'Managers' },
  { tier: 2, label: 'Specialists' },
]

export function DeptRoom({
  dept,
  decision,
  onBack,
  onApprove,
  onChanges,
  onEscalate,
  onRevert,
}: {
  dept: Dept
  decision: Decision
  onBack: () => void
  onApprove: () => void
  onChanges: (note: string) => void
  onEscalate: () => void
  onRevert: () => void
}) {
  const head = dept.agents.find((a) => a.isHead) ?? dept.agents[0]
  const campaign = dept.campaign

  const tiered = dept.agents.some((a) => a.tier !== undefined)
  const agentRow = (a: Agent, sub = false) => (
    <li key={a.id} className={`agent ${sub ? 'sub' : ''}`}>
      <AgentMark mark={a.mark} color={dept.color} status={a.status} size={34} />
      <div className="agent-info">
        <span className="agent-name">{a.name}</span>
        <span className="agent-role">{a.role}</span>
        <span className="agent-doing">{a.doing}</span>
      </div>
      <span className="agent-load">
        <span className={`status-pill s-${a.status}`}>{STATUS_LABEL[a.status]}</span>
        <span className="ts-count">{a.load} tasks</span>
      </span>
    </li>
  )

  return (
    <div className="dept">
      <div className="dept-hd">
        <button className="back" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H6M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Floor
        </button>
        <span className="dept-sep" />
        <span className="dept-mark" style={{ color: dept.color }}>
          <DeptGlyph mark={dept.mark} size={17} />
        </span>
        <div>
          <h1 className="dept-title">{dept.name}</h1>
          <p className="dept-mandate">{dept.mandate}</p>
        </div>
        <div className="dept-spend">
          <div>
            <span className="label">Spend today</span>
            <span className="spend-value">{dept.spend}</span>
          </div>
          <div>
            <span className="label">Cap</span>
            <span className="spend-value dim">{dept.budget}</span>
          </div>
        </div>
      </div>

      <div className="dept-grid">
        <div className="col left">
          <section className="panel">
            <div className="panel-hd">
              <span className="label">Team</span>
              <span className="panel-count">{dept.agents.length}</span>
            </div>
            {tiered ? (
              <ul className="roster">
                {TIERS.map((t) => {
                  const group = dept.agents.filter((a) => (a.tier ?? 0) === t.tier)
                  if (group.length === 0) return null
                  return (
                    <li key={t.tier} className="roster-group">
                      <span className="roster-tier">{t.label}</span>
                      <ul>{group.map((a) => agentRow(a, t.tier > 0))}</ul>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <ul className="roster">{dept.agents.map((a) => agentRow(a))}</ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-hd">
              <span className="label">Activity</span>
              <span className="panel-count">today</span>
            </div>
            <ul className="feed">
              {dept.feed.map((f, i) => (
                <li key={i} className={`feed-item tone-${f.tone}`}>
                  <span className="feed-time">{f.time}</span>
                  <span className="feed-dot" />
                  <span className="feed-text">{f.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="col mid">
          {campaign && (
            <section className="panel campaign">
              <div className="campaign-hd">
                <div>
                  <span className="label">Campaign</span>
                  <h2>{campaign.name}</h2>
                </div>
                <span className={`state-pill st-${decision}`}>
                  {decision === 'approved' ? 'Approved' : decision === 'changes' ? 'In rework' : 'Awaiting you'}
                </span>
              </div>

              <ol className="stepper">
                {campaign.stepper.map((s, i) => {
                  const state = i < campaign.current ? 'done' : i === campaign.current ? 'current' : 'todo'
                  return (
                    <li key={s} className={`step ${state}`}>
                      <span className="step-dot">{state === 'done' ? '✓' : state === 'current' ? '●' : ''}</span>
                      <span className="step-name">{s}</span>
                    </li>
                  )
                })}
              </ol>

              {dept.readiness && (
                <>
                  <div className="section-label inset">
                    <span>Ready for approval</span>
                    <span className="section-count">
                      {dept.readiness.filter((r) => r.done).length}/{dept.readiness.length}
                    </span>
                  </div>
                  <ul className="readiness">
                    {dept.readiness.map((r) => (
                      <li key={r.label} className={r.done ? 'done' : ''}>
                        <span className="ready-check">{r.done ? '✓' : '○'}</span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          <div className="artifacts">
            <div className="section-label inset">
              <span>Artifacts</span>
              <span className="section-count">{dept.artifacts.length}</span>
            </div>
            {dept.artifacts.map((art) => (
              <ArtifactCard key={art.id} art={art} />
            ))}
          </div>
        </div>

        <div className="col right">
          <section className="panel brief">
            <div className="brief-hd">
              <AgentMark mark={head.mark} color={dept.color} status={head.status} size={40} />
              <div className="brief-id">
                <span className="agent-name">{head.name}</span>
                <span className="agent-role">{head.role}</span>
              </div>
              <span className={`status-pill s-${head.status}`}>{STATUS_LABEL[head.status]}</span>
            </div>
            <p className="brief-text">{dept.brief}</p>
          </section>

          <Gate
            dept={dept}
            decision={decision}
            onApprove={onApprove}
            onChanges={onChanges}
            onEscalate={onEscalate}
            onRevert={onRevert}
          />
        </div>
      </div>
    </div>
  )
}
