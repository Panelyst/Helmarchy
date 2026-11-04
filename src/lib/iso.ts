export const COS30 = Math.cos(Math.PI / 6)
export const SIN30 = Math.sin(Math.PI / 6)

export interface Pt {
  x: number
  y: number
}

export interface Frame {
  s: number
  ox: number
  oy: number
}

/** Project a world coordinate onto the isometric screen plane. */
export function project(frame: Frame, wx: number, wy: number, wz = 0): Pt {
  return {
    x: frame.ox + (wx - wy) * COS30 * frame.s,
    y: frame.oy + (wx + wy) * SIN30 * frame.s - wz * frame.s,
  }
}

export function toPoints(pts: Pt[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

/** A flat square on the ground plane, centred on wx/wy. */
export function quad(frame: Frame, wx: number, wy: number, size: number, z = 0): string {
  const r = size / 2
  return toPoints([
    project(frame, wx - r, wy - r, z),
    project(frame, wx + r, wy - r, z),
    project(frame, wx + r, wy + r, z),
    project(frame, wx - r, wy + r, z),
  ])
}

/** Points of a circle on the ground plane (renders as an ellipse in iso). */
export function disc(frame: Frame, wx: number, wy: number, r: number, z = 0, segments = 56): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(project(frame, wx + Math.cos(a) * r, wy + Math.sin(a) * r, z))
  }
  return pts
}

/** Deterministic PRNG so the floor geometry is stable across renders. */
export function rng(seed: number) {
  let s = (seed >>> 0) || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
