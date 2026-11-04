import type { MarkKey, Status } from '../data/org'

const GLYPHS: Record<MarkKey, string> = {
  hex: 'M12 3.4l6.7 3.9v7.4L12 20.6l-6.7-3.9V7.3z',
  tri: 'M12 4.4l7.6 14.2H4.4z',
  dia: 'M12 3.4l8.2 8.6-8.2 8.6-8.2-8.6z',
  orb: 'M12 4.2a7.8 7.8 0 100 15.6 7.8 7.8 0 000-15.6zm0 5.1a2.7 2.7 0 110 5.4 2.7 2.7 0 010-5.4z',
  arc: 'M4.4 17.6a7.6 7.6 0 0115.2 0',
  bolt: 'M13.2 3.2L6.4 12.6h4.2l-1.2 8.2 7-9.8h-4.2z',
  star: 'M12 3.6l2.2 5.6 5.9.5-4.5 3.9 1.4 5.8L12 16.5 6.9 19.4l1.4-5.8-4.5-3.9 5.9-.5z',
  ring: 'M12 4.4a7.6 7.6 0 100 15.2 7.6 7.6 0 000-15.2zm0 3a4.6 4.6 0 110 9.2 4.6 4.6 0 010-9.2z',
  square: 'M6.2 6.2h11.6v11.6H6.2z',
  wave: 'M3 14.2c3-7.4 6-7.4 9 0s6 7.4 9 0',
}

export function DeptGlyph({ mark, size = 15 }: { mark: MarkKey; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(3.6 3.6) scale(0.7)"
      >
        <path d={GLYPHS[mark]} />
      </g>
    </svg>
  )
}

export function AgentMark({
  mark,
  color,
  status,
  size = 34,
}: {
  mark: MarkKey
  color: string
  status?: Status
  size?: number
}) {
  return (
    <span className="mark-wrap" style={{ width: size, height: size, color }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="rgba(7,11,18,.92)" stroke="currentColor" strokeOpacity="0.34" />
        <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeOpacity="0.12" />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(4.2 4.2) scale(0.65)"
          opacity="0.95"
        >
          <path d={GLYPHS[mark]} />
        </g>
      </svg>
      {status && <span className={`status-dot s-${status}`} aria-label={status} />}
    </span>
  )
}
