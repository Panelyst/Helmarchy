import { useMemo, useState } from 'react'
import { DEPTS, HEAD_IDS, type DeptId, type Status } from '../data/org'
import { disc, project, quad, rng, toPoints, type Frame } from '../lib/iso'
import { AgentMark, DeptGlyph } from './Marks'
import type { Decision } from './Rail'

const F: Frame = { s: 140, ox: 500, oy: 312 }
const VBW = 1000
const VBH = 660
const SIZE = 0.88
const SPACING = 1.3

const STATUS_LABEL: Record<Status, string> = {
  working: 'working',
  idle: 'idle',
  blocked: 'blocked',
  waiting: 'waiting on you',
}

export function Floor({
  decisions,
  onEnter,
}: {
  decisions: Record<string, Decision>
  onEnter: (id: DeptId) => void
}) {
  const [hot, setHot] = useState<DeptId | null>(null)

  const grid = useMemo(() => {
    const lines: { a: { x: number; y: number }; b: { x: number; y: number } }[] = []
    for (let i = -4; i <= 4; i++) {
      const t = i * 0.43
      lines.push({ a: project(F, -1.95, t), b: project(F, 1.95, t) })
      lines.push({ a: project(F, t, -1.95), b: project(F, t, 1.95) })
    }
    return lines
  }, [])

  const sorted = useMemo(
    () => [...DEPTS].sort((a, b) => a.grid[0] + a.grid[1] - (b.grid[0] + b.grid[1])),
    [],
  )

  const globe = project(F, 0, 0, 0.62)
  const globeR = 0.3 * F.s

  const heads = HEAD_IDS.map((id) => DEPTS.find((d) => d.id === id)!).filter(Boolean)

  return (
    <div className="floor-wrap">
      <div className="floor-stage">
        <svg viewBox={`0 0 ${VBW} ${VBH}`} className="floor-svg" role="img" aria-label="Organization floor">
          <defs>
            <radialGradient id="globeGrad" cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor="#e6f1ff" />
              <stop offset="28%" stopColor="#6fa5ff" />
              <stop offset="68%" stopColor="#2a5cc9" />
              <stop offset="100%" stopColor="#0a1a3d" />
            </radialGradient>
            <radialGradient id="bloom">
              <stop offset="0%" stopColor="#4c8dff" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#4c8dff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4c8dff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="vignette" cx="50%" cy="44%" r="66%">
              <stop offset="52%" stopColor="#04060a" stopOpacity="0" />
              <stop offset="100%" stopColor="#04060a" stopOpacity="0.92" />
            </radialGradient>
            <clipPath id="globeClip">
              <circle cx={globe.x} cy={globe.y} r={globeR} />
            </clipPath>
          </defs>

          <rect x="0" y="0" width={VBW} height={VBH} fill="#06080e" />
          <ellipse cx={500} cy={330} rx={430} ry={250} fill="url(#bloom)" opacity="0.55" />

          <g stroke="#22304a" strokeWidth="0.7" opacity="0.35">
            {grid.map((l, i) => (
              <line key={i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />
            ))}
          </g>

          {/* plaza */}
          <polygon points={toPoints(disc(F, 0, 0, 0.82))} fill="#080d16" stroke="#1b2740" strokeWidth="1" />
          <polygon points={toPoints(disc(F, 0, 0, 0.68))} fill="none" stroke="#2c4a7a" strokeWidth="1" strokeOpacity="0.7" />
          <polygon points={toPoints(disc(F, 0, 0, 0.5))} fill="#0a1220" stroke="#33578f" strokeWidth="1" />
          <polygon points={toPoints(disc(F, 0, 0, 0.36, 0.1))} fill="#0e1930" stroke="#3d6bab" strokeWidth="1" />

          {sorted.map((d) => {
            const cx = d.grid[0] * SPACING
            const cy = d.grid[1] * SPACING
            const h = d.height
            const hx = SIZE / 2
            const hy = SIZE / 2
            const A = project(F, cx - hx, cy - hy, h)
            const B = project(F, cx + hx, cy - hy, h)
            const C = project(F, cx + hx, cy + hy, h)
            const D = project(F, cx - hx, cy + hy, h)
            const B0 = project(F, cx + hx, cy - hy, 0)
            const C0 = project(F, cx + hx, cy + hy, 0)
            const D0 = project(F, cx - hx, cy + hy, 0)
            const isHot = hot === d.id
            const needs = d.gate && decisions[d.id] === 'pending'

            const rand = rng(d.grid[0] * 37 + d.grid[1] * 91 + 7)
            const desks: { pts: string; o: number }[] = []
            for (let i = 0; i < 5; i++) {
              const dx = (rand() - 0.5) * 0.5
              const dy = (rand() - 0.5) * 0.5
              desks.push({ pts: quad(F, cx + dx, cy + dy, 0.13, h + 0.002), o: 0.22 + rand() * 0.4 })
            }

            return (
              <g
                key={d.id}
                className={`room ${isHot ? 'hot' : ''}`}
                onMouseEnter={() => setHot(d.id)}
                onMouseLeave={() => setHot((cur) => (cur === d.id ? null : cur))}
                onClick={() => onEnter(d.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onEnter(d.id)
                }}
                aria-label={`Enter ${d.name}`}
              >
                <polygon points={toPoints([B, C, C0, B0])} fill={d.color} fillOpacity={isHot ? 0.14 : 0.09} />
                <polygon points={toPoints([C, D, D0, C0])} fill={d.color} fillOpacity={isHot ? 0.09 : 0.055} />
                <polygon
                  points={toPoints([A, B, C, D])}
                  fill={d.color}
                  fillOpacity={isHot ? 0.2 : 0.12}
                  stroke={d.color}
                  strokeOpacity={isHot ? 0.75 : 0.4}
                  strokeWidth="1"
                />
                <polyline
                  points={toPoints([B, C, D])}
                  fill="none"
                  stroke={d.color}
                  strokeOpacity={isHot ? 0.95 : 0.6}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {desks.map((desk, i) => (
                  <polygon key={i} points={desk.pts} fill={d.color} fillOpacity={desk.o} />
                ))}
                {d.agents.map((a, i) => {
                  const px = (rand() - 0.5) * 0.46
                  const py = (rand() - 0.5) * 0.46
                  const p = project(F, cx + px, cy + py, h + 0.004)
                  return (
                    <circle
                      key={a.id}
                      className={`presence s-${a.status}`}
                      cx={p.x}
                      cy={p.y}
                      r={2.4}
                      style={{ animationDelay: `${i * 0.45}s` }}
                    />
                  )
                })}
                {needs && (
                  <circle
                    cx={C.x}
                    cy={C.y}
                    r={4}
                    className="needs-dot"
                  />
                )}
              </g>
            )
          })}

          {/* globe */}
          <g className="globe">
            <circle cx={globe.x} cy={globe.y} r={globeR * 2.2} fill="url(#bloom)" />
            <circle cx={globe.x} cy={globe.y} r={globeR} fill="url(#globeGrad)" />
            <g clipPath="url(#globeClip)" fill="none" stroke="#dbeaff" strokeOpacity="0.28" strokeWidth="0.8">
              {[-0.66, -0.33, 0, 0.33, 0.66].map((k) => (
                <ellipse
                  key={k}
                  cx={globe.x}
                  cy={globe.y + globeR * k}
                  rx={globeR * Math.sqrt(Math.max(0, 1 - k * k))}
                  ry={globeR * Math.sqrt(Math.max(0, 1 - k * k)) * 0.3}
                />
              ))}
              {[0.25, 0.58, 0.92].map((w) => (
                <ellipse key={w} cx={globe.x} cy={globe.y} rx={globeR * w} ry={globeR} />
              ))}
            </g>
            <circle cx={globe.x} cy={globe.y} r={globeR} fill="none" stroke="#a9caff" strokeOpacity="0.55" />
          </g>

          <rect x="0" y="0" width={VBW} height={VBH} fill="url(#vignette)" pointerEvents="none" />
        </svg>

        <div className="floor-overlay">
          {DEPTS.map((d) => {
            const cx = d.grid[0] * SPACING
            const cy = d.grid[1] * SPACING
            const p = project(F, cx, cy, d.height)
            const needs = d.gate && decisions[d.id] === 'pending'
            const style = {
              left: `${(p.x / VBW) * 100}%`,
              top: `${(p.y / VBH) * 100}%`,
              ['--c' as string]: d.color,
            } as React.CSSProperties

            return (
              <button
                key={d.id}
                className={`room-chip ${hot === d.id ? 'hot' : ''}`}
                style={style}
                onMouseEnter={() => setHot(d.id)}
                onMouseLeave={() => setHot((cur) => (cur === d.id ? null : cur))}
                onClick={() => onEnter(d.id)}
              >
                <span className="chip-glyph">
                  <DeptGlyph mark={d.mark} />
                </span>
                <span className="chip-text">
                  <span className="chip-name">{d.name}</span>
                  <span className="chip-mandate">{d.mandate}</span>
                </span>
                {needs && <span className="chip-badge">1</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="team-status">
        <div className="ts-hd">
          <span className="label">Your team · right now</span>
          <span className="ts-hint">Click any room to walk in</span>
        </div>
        <div className="ts-row">
          {heads.map((d) => {
            const head = d.agents.find((a) => a.isHead) ?? d.agents[0]
            return (
              <button key={d.id} className="ts-card" onClick={() => onEnter(d.id)} style={{ ['--c' as string]: d.color } as React.CSSProperties}>
                <AgentMark mark={head.mark} color={d.color} status={head.status} size={38} />
                <span className="ts-body">
                  <span className="ts-name">{head.name}</span>
                  <span className="ts-role">{head.role}</span>
                  <span className="ts-doing">{head.doing}</span>
                </span>
                <span className="ts-load">
                  <span className={`status-pill s-${head.status}`}>{STATUS_LABEL[head.status]}</span>
                  <span className="ts-count">{head.load} tasks</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
