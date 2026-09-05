// Upper-deck hump silhouette for the 747-400, lofted from control points.
// Tuned against reference photos of the 747-8/-400: a smooth rise over the
// cockpit, a long flat crest, and a gentle teardrop fairing tapering down
// onto the fuselage crown above the wing box.

interface ControlPoint {
  z: number
  value: number
}

// Top (crown) height of the hump at station z
const TOP_POINTS: ControlPoint[] = [
  { z: 32.4, value: 8.05 },
  { z: 30.2, value: 9.6 },
  { z: 28.4, value: 10.55 },
  { z: 26.0, value: 10.95 },
  { z: 22.0, value: 11.15 },
  { z: 15.0, value: 11.1 },
  { z: 10.0, value: 10.8 },
  { z: 6.0, value: 10.15 },
  { z: 3.0, value: 9.6 },
  { z: 1.0, value: 9.42 },
]

// Half-width of the hump at station z (slimmer than the main hull,
// roughly 0.6x the fuselage half-width like the real upper lobe)
const WIDTH_POINTS: ControlPoint[] = [
  { z: 32.4, value: 0.06 },
  { z: 30.2, value: 1.25 },
  { z: 28.4, value: 1.85 },
  { z: 26.0, value: 2.08 },
  { z: 22.0, value: 2.15 },
  { z: 15.0, value: 2.15 },
  { z: 10.0, value: 2.0 },
  { z: 6.0, value: 1.58 },
  { z: 3.0, value: 0.85 },
  { z: 1.0, value: 0.06 },
]

export const HUMP_FRONT_Z = 32.4
export const HUMP_REAR_Z = 1.0
export const HUMP_BOTTOM_Y = 7.6 // buried inside the main hull (crown ~9.4)
// Superellipse exponent: flat-flanked upper lobe like the real aircraft,
// which also keeps enough width low in the section for the cabin floor.
export const HUMP_SECTION_N = 2.6

function interpolate(points: ControlPoint[], z: number): number {
  if (z >= points[0].z) return points[0].value
  const last = points[points.length - 1]
  if (z <= last.z) return last.value
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (z <= a.z && z >= b.z) {
      const t = (a.z - z) / (a.z - b.z)
      const smooth = t * t * (3 - 2 * t)
      return a.value + (b.value - a.value) * smooth
    }
  }
  return last.value
}

export const humpTopAt = (z: number) => interpolate(TOP_POINTS, z)
export const humpHalfWidthAt = (z: number) => interpolate(WIDTH_POINTS, z)

// Half-width of the hump surface at station z and height y (0 when outside)
export function humpHalfWidthAtHeight(z: number, y: number): number {
  const top = humpTopAt(z)
  const w = humpHalfWidthAt(z)
  const center = (top + HUMP_BOTTOM_Y) / 2
  const ry = (top - HUMP_BOTTOM_Y) / 2
  if (ry <= 0) return 0
  const k = Math.abs(y - center) / ry
  if (k >= 1) return 0
  return w * Math.pow(1 - Math.pow(k, HUMP_SECTION_N), 1 / HUMP_SECTION_N)
}
