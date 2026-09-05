import { Instance, Instances } from '@react-three/drei'
import { JPText } from '../JPText'
import { useFrame } from '@react-three/fiber'
import { Interactable } from '@xrift/world-components'
import { useMemo, useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Shape,
  Vector2,
} from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import {
  AIRCRAFT_LENGTH,
  BOARDING_DOOR_Z,
  COLORS,
  FUSELAGE_CENTER_Y,
  FUSELAGE_RADIUS,
  NOSE_TAPER_START_Z,
  NOSE_TIP_Z,
  TAIL_END_Z,
  TAIL_TAPER_START_Z,
  TAIL_UPSWEEP,
} from '../../constants'
import {
  HUMP_BOTTOM_Y,
  HUMP_FRONT_Z,
  HUMP_REAR_Z,
  HUMP_SECTION_N,
  humpHalfWidthAt,
  humpHalfWidthAtHeight,
  humpTopAt,
} from './humpProfile'

const NOSE_LEN = NOSE_TIP_Z - NOSE_TAPER_START_Z
const TAIL_LEN = TAIL_TAPER_START_Z - TAIL_END_Z
const TAIL_START_S = AIRCRAFT_LENGTH - TAIL_LEN
// Two-stage tail: a gentle blend keeps the hull wide enough to contain the
// cabin back to z=-24, then the cone tapers quickly to the tail tip.
const TAIL_BLEND_LEN = 9.5
const TAIL_BLEND_RADIUS = 2.6
const TAIL_CONE_START_S = TAIL_START_S + TAIL_BLEND_LEN
const TAIL_CONE_LEN = AIRCRAFT_LENGTH - TAIL_CONE_START_S

// Fuselage radius as a function of distance s from the nose tip
export function radiusAt(s: number): number {
  if (s <= NOSE_LEN) {
    const t = s / NOSE_LEN
    return FUSELAGE_RADIUS * Math.pow(1 - Math.pow(1 - t, 2.1), 0.62)
  }
  if (s >= TAIL_CONE_START_S) {
    const t = (s - TAIL_CONE_START_S) / TAIL_CONE_LEN
    return Math.max(0.3, TAIL_BLEND_RADIUS * Math.pow(1 - t, 1.05))
  }
  if (s >= TAIL_START_S) {
    const t = (s - TAIL_START_S) / TAIL_BLEND_LEN
    const smooth = t * t * (3 - 2 * t)
    return FUSELAGE_RADIUS - (FUSELAGE_RADIUS - TAIL_BLEND_RADIUS) * smooth
  }
  return FUSELAGE_RADIUS
}

export function upsweepAt(s: number): number {
  if (s <= TAIL_START_S) return 0
  const t = (s - TAIL_START_S) / (AIRCRAFT_LENGTH - TAIL_START_S)
  return TAIL_UPSWEEP * Math.pow(t, 2.2)
}

// Lathe shell between stations s0..s1 (distance from nose tip), with the
// 747's upswept tail applied as a vertical shear on the aft cone.
// `paint` adds per-vertex livery colors: white hull, grey belly and a navy
// cheatline that wraps the curved skin for the full length of the aircraft.
function makeShellGeometry(s0: number, s1: number, steps: number, paint = false) {
  const points: Vector2[] = []
  for (let i = 0; i <= steps; i++) {
    const s = s0 + ((s1 - s0) * i) / steps
    points.push(new Vector2(Math.max(radiusAt(s), 0.001), s))
  }
  const geometry = new LatheGeometry(points, paint ? 80 : 48)
  geometry.rotateX(-Math.PI / 2) // profile axis -> -Z (nose at z=0, tail at z=-length)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const s = -position.getZ(i)
    position.setY(i, position.getY(i) + upsweepAt(s))
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()

  if (paint) {
    const white = new Color(COLORS.fuselage)
    const belly = new Color(COLORS.belly)
    const cheat = new Color(COLORS.cheatline)
    const colors = new Float32Array(position.count * 3)
    for (let i = 0; i < position.count; i++) {
      const s = -position.getZ(i)
      const yLocal = position.getY(i) - upsweepAt(s) // height above hull centerline
      let c = white
      if (yLocal < -1.35) {
        c = belly
      } else if (yLocal > 0.32 && yLocal < 0.84 && radiusAt(s) > 1.5) {
        c = cheat
      }
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
  }
  return geometry
}

// Upper-deck hump lofted along superellipse cross-sections that follow the
// real silhouette: cockpit slope, long flat crest, teardrop aft fairing.
// The lower half of each section is buried inside the main hull, so the
// visible part blends seamlessly into the crown.
function makeHumpGeometry() {
  const SECTIONS = 72
  const RING = 30
  const exponent = 2 / HUMP_SECTION_N
  const positions: number[] = []
  for (let i = 0; i <= SECTIONS; i++) {
    const z = HUMP_FRONT_Z + ((HUMP_REAR_Z - HUMP_FRONT_Z) * i) / SECTIONS
    const top = humpTopAt(z)
    const w = Math.max(humpHalfWidthAt(z), 0.02)
    const yC = (top + HUMP_BOTTOM_Y) / 2
    const ry = Math.max((top - HUMP_BOTTOM_Y) / 2, 0.02)
    for (let j = 0; j < RING; j++) {
      const phi = (j / RING) * Math.PI * 2
      const c = Math.cos(phi)
      const sn = Math.sin(phi)
      const x = w * Math.sign(c) * Math.pow(Math.abs(c), exponent)
      const y = yC + ry * Math.sign(sn) * Math.pow(Math.abs(sn), exponent)
      positions.push(x, y, z)
    }
  }
  const index: number[] = []
  for (let i = 0; i < SECTIONS; i++) {
    for (let j = 0; j < RING; j++) {
      const jn = (j + 1) % RING
      const a = i * RING + j
      const b = (i + 1) * RING + j
      const c = i * RING + jn
      const d = (i + 1) * RING + jn
      index.push(a, b, d, a, d, c)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return geometry
}

// Cockpit window band: two thin conformal strips floating just above the
// hump loft's front slope — one per side, leaving a white crown strip over
// the top like the real windscreen arrangement.
function makeCockpitBandGeometry() {
  const Z0 = 29.85
  const Z1 = 31.35
  const SECTIONS = 8
  const ARC = 8
  const exponent = 2 / HUMP_SECTION_N
  const positions: number[] = []
  const index: number[] = []

  const appendStrip = (phi0: number, phi1: number) => {
    const base = positions.length / 3
    for (let i = 0; i <= SECTIONS; i++) {
      const z = Z0 + ((Z1 - Z0) * i) / SECTIONS
      const top = humpTopAt(z) + 0.03
      const w = humpHalfWidthAt(z) + 0.03
      const yC = (top + HUMP_BOTTOM_Y) / 2
      const ry = Math.max((top - HUMP_BOTTOM_Y) / 2, 0.02)
      for (let j = 0; j < ARC; j++) {
        const phi = phi0 + ((phi1 - phi0) * j) / (ARC - 1)
        const c = Math.cos(phi)
        const sn = Math.sin(phi)
        const x = w * Math.sign(c) * Math.pow(Math.abs(c), exponent)
        const y = yC + ry * Math.sign(sn) * Math.pow(Math.abs(sn), exponent)
        positions.push(x, y, z)
      }
    }
    for (let i = 0; i < SECTIONS; i++) {
      for (let j = 0; j < ARC - 1; j++) {
        const a = base + i * ARC + j
        const b = base + (i + 1) * ARC + j
        const c = a + 1
        const d = b + 1
        index.push(a, b, d, a, d, c)
      }
    }
  }

  appendStrip(0.44, 1.13) // starboard windscreen arc
  appendStrip(Math.PI - 1.13, Math.PI - 0.44) // port windscreen arc

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return geometry
}

// Dorsal fin fillet blending the spine into the vertical stabilizer
function makeDorsalFinGeometry() {
  const shape = new Shape() // shape x = aircraft z, shape y = aircraft y
  shape.moveTo(-15.0, 9.35)
  shape.lineTo(-24.6, 10.7)
  shape.lineTo(-23.5, 8.3)
  shape.closePath()
  // No bevel: the needle-sharp forward corner makes beveled miters explode
  // into kilometer-long sliver polygons.
  const geometry = new ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: false })
  geometry.rotateY(-Math.PI / 2)
  geometry.translate(0.14, 0, 0)
  geometry.computeVertexNormals()
  return geometry
}

const DOOR_ZS = [25.5, BOARDING_DOOR_Z, 7, -7, -16]
const DOOR_ARC = 0.32

interface WindowInstance {
  position: [number, number, number]
  rotationY: number
}

// Anti-collision beacons (top + belly) blink in sync
function Beacons() {
  const topRef = useRef<Mesh>(null)
  const bottomRef = useRef<Mesh>(null)

  useFrame((state) => {
    const on = Math.sin(state.clock.elapsedTime * 5.2) > 0.55
    for (const ref of [topRef, bottomRef]) {
      const material = ref.current?.material as MeshStandardMaterial | undefined
      if (material) material.emissiveIntensity = on ? 2.4 : 0.15
    }
  })

  return (
    <group>
      <mesh ref={topRef} position={[0, 9.42, -2]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#5a0d0d" emissive="#ff2a1a" emissiveIntensity={0.15} />
      </mesh>
      <mesh ref={bottomRef} position={[0, 2.88, 8]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#5a0d0d" emissive="#ff2a1a" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}

export interface AirframeProps {
  explodeProgress: { current: number }
  onSelectPart: (id: string) => void
}

export function Airframe({ explodeProgress, onSelectPart }: AirframeProps) {
  const radomeRef = useRef<Group>(null)
  const apuRef = useRef<Group>(null)

  const shellGeometry = useMemo(() => makeShellGeometry(1.9, AIRCRAFT_LENGTH, 96, true), [])
  const radomeGeometry = useMemo(() => makeShellGeometry(0, 2.0, 10), [])
  const humpGeometry = useMemo(() => makeHumpGeometry(), [])
  const cockpitBandGeometry = useMemo(() => makeCockpitBandGeometry(), [])
  const dorsalFinGeometry = useMemo(() => makeDorsalFinGeometry(), [])
  const doorGeometryPort = useMemo(
    () => [Math.PI / 2 - DOOR_ARC / 2, DOOR_ARC] as const,
    [],
  )
  const doorGeometryStbd = useMemo(
    () => [-Math.PI / 2 - DOOR_ARC / 2, DOOR_ARC] as const,
    [],
  )

  const windows = useMemo<WindowInstance[]>(() => {
    const list: WindowInstance[] = []
    // Main deck rows hug the hull at every station (nose and tail tapers too)
    for (let z = -23; z <= 27; z += 1.05) {
      if (DOOR_ZS.some((doorZ) => Math.abs(z - doorZ) < 0.9)) continue
      const s = NOSE_TIP_Z - z
      const r = radiusAt(s)
      if (r < 2.0) continue
      const dy = 6.6 - (FUSELAGE_CENTER_Y + upsweepAt(s))
      const inside = r * r - dy * dy
      if (inside < 0.3) continue
      const x = Math.sqrt(inside) + 0.015
      for (const side of [1, -1]) {
        list.push({
          position: [side * x, 6.6, z],
          rotationY: (side * Math.PI) / 2,
        })
      }
    }
    // Upper deck rows along the hump loft
    for (let z = 7; z <= 26; z += 1.1) {
      const w = humpHalfWidthAtHeight(z, 9.25)
      if (w < 1.0) continue
      const x = w + 0.02
      for (const side of [1, -1]) {
        list.push({
          position: [side * x, 9.25, z],
          rotationY: (side * Math.PI) / 2,
        })
      }
    }
    return list
  }, [])

  useFrame(() => {
    const k = explodeProgress.current
    if (radomeRef.current) radomeRef.current.position.z = NOSE_TIP_Z + k * 5
    if (apuRef.current) apuRef.current.position.z = -34.3 - k * 5
  })

  return (
    <group>
      {/* Main fuselage shell (vertex-painted livery) */}
      <mesh
        geometry={shellGeometry}
        position={[0, FUSELAGE_CENTER_Y, NOSE_TIP_Z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#ffffff" vertexColors roughness={0.34} metalness={0.14} />
      </mesh>

      {/* Dorsal fin fillet */}
      <mesh geometry={dorsalFinGeometry} castShadow>
        <meshStandardMaterial color={COLORS.fuselage} roughness={0.38} metalness={0.18} />
      </mesh>

      <Beacons />

      {/* Radome (slides forward in exploded mode, revealing the weather radar) */}
      <group ref={radomeRef} position={[0, FUSELAGE_CENTER_Y, NOSE_TIP_Z]}>
        <Interactable
          id="part-radome"
          onInteract={() => onSelectPart('radome')}
          interactionText="レドーム"
        >
          <mesh geometry={radomeGeometry} castShadow>
            <meshStandardMaterial color="#e8eaec" roughness={0.5} metalness={0.05} />
          </mesh>
        </Interactable>
      </group>

      {/* Weather radar dish hidden behind the radome */}
      <group position={[0, FUSELAGE_CENTER_Y, 32.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.85, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
          <meshStandardMaterial color="#c8cdd4" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.5]}>
          <boxGeometry args={[0.3, 0.7, 0.6]} />
          <meshStandardMaterial color={COLORS.metal} roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[0, -1.0, -0.2]}>
          <boxGeometry args={[0.9, 0.9, 1.1]} />
          <meshStandardMaterial color="#6d7680" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>

      {/* Upper deck hump (continuous loft from cockpit to aft fairing) */}
      <Interactable
        id="part-upper-deck"
        onInteract={() => onSelectPart('upper-deck')}
        interactionText="アッパーデッキ"
      >
        <mesh geometry={humpGeometry} castShadow>
          <meshStandardMaterial color={COLORS.fuselage} roughness={0.34} metalness={0.14} />
        </mesh>
      </Interactable>

      {/* Cockpit windscreen band conforming to the hump's front slope */}
      <Interactable
        id="part-cockpit"
        onInteract={() => onSelectPart('cockpit')}
        interactionText="コックピット"
      >
        <mesh geometry={cockpitBandGeometry}>
          <meshStandardMaterial
            color="#0e141c"
            roughness={0.18}
            metalness={0.4}
            emissive="#1d3450"
            emissiveIntensity={0.4}
            side={DoubleSide}
          />
        </mesh>
      </Interactable>

      {/* Wing-to-body fairing */}
      <mesh position={[0, 4.6, -1.5]} scale={[4.1, 1.7, 13]} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={COLORS.belly} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Passenger doors (conformal cylinder segments hugging the hull radius).
          L2 door is clickable. */}
      {DOOR_ZS.map((z) => {
        const doorRadius = radiusAt(NOSE_TIP_Z - z) + 0.05
        return [1, -1].map((side) => {
          const [thetaStart, thetaLength] =
            side > 0 ? doorGeometryPort : doorGeometryStbd
          const door = (
            <mesh position={[0, 6.32, z]} key={`${z}-${side}`}>
              <cylinderGeometry
                args={[doorRadius, doorRadius, 1.92, 8, 1, true, thetaStart, thetaLength]}
              />
              <meshStandardMaterial color="#d9dee4" roughness={0.45} metalness={0.12} />
            </mesh>
          )
          if (side > 0 && z === BOARDING_DOOR_Z) {
            return (
              <Interactable
                key={`${z}-${side}-door`}
                id="part-door"
                onInteract={() => onSelectPart('door')}
                interactionText="乗降ドア"
              >
                {door}
              </Interactable>
            )
          }
          return door
        })
      })}

      {/* Cabin windows */}
      <Instances limit={windows.length} frustumCulled={false}>
        <planeGeometry args={[0.26, 0.4]} />
        <meshStandardMaterial
          color="#2a3340"
          emissive={COLORS.windowGlow}
          emissiveIntensity={0.5}
          roughness={0.3}
        />
        {windows.map((w, i) => (
          <Instance key={i} position={w.position} rotation={[0, w.rotationY, 0]} />
        ))}
      </Instances>

      {/* APU tail cone (slides aft in exploded mode) */}
      <group ref={apuRef} position={[0, 8.55, -34.3]}>
        <Interactable
          id="part-apu"
          onInteract={() => onSelectPart('apu')}
          interactionText="APU（補助動力装置）"
        >
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.55, 0.26, 2.2, 20]} />
              <meshStandardMaterial color="#aeb6bf" roughness={0.4} metalness={0.55} />
            </mesh>
            <mesh position={[0, 0, -1.12]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.2, 0.16, 16]} />
              <meshStandardMaterial color="#33373c" roughness={0.7} metalness={0.6} />
            </mesh>
          </group>
        </Interactable>
      </group>

      {/* Livery titles on the hump */}
      {[1, -1].map((side) => (
        <JPText
          key={side}
          position={[side * 2.17, 9.6, 16]}
          rotation={[0, (side * Math.PI) / 2, 0]}
          fontSize={0.74}
          letterSpacing={0.06}
          color="#16386e"
          anchorX="center"
          anchorY="middle"
        >
          XRIFT AIRWAYS
        </JPText>
      ))}
    </group>
  )
}
