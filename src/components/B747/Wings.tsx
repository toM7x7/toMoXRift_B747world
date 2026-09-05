import { useFrame } from '@react-three/fiber'
import { Interactable } from '@xrift/world-components'
import { useMemo, useRef } from 'react'
import { DoubleSide, ExtrudeGeometry, Shape } from 'three'
import type { Group } from 'three'
import type { ReactNode } from 'react'
import {
  COLORS,
  ENGINE_INBOARD_X,
  ENGINE_OUTBOARD_X,
  WING_DIHEDRAL_TAN,
  WING_ROOT_CHORD,
  WING_ROOT_LE_Z,
  WING_ROOT_Y,
  WING_SWEEP_TAN,
  WING_TIP_CHORD,
  WING_TIP_X,
} from '../../constants'

const ROOT_X = 2.3
const TIP_LE_Z = WING_ROOT_LE_Z - (WING_TIP_X - ROOT_X) * WING_SWEEP_TAN // -12.0
const TIP_TE_Z = TIP_LE_Z - WING_TIP_CHORD
const ROOT_TE_Z = WING_ROOT_LE_Z - WING_ROOT_CHORD // -6.0
const KINK = { x: 11, z: -6.8 } // trailing edge yehudi break

const TE_IN_SLOPE = (KINK.z - ROOT_TE_Z) / (KINK.x - ROOT_X) // dz/dx inboard TE
const TE_OUT_SLOPE = (TIP_TE_Z - KINK.z) / (WING_TIP_X - KINK.x)
const TE_IN_ANGLE = Math.atan(-TE_IN_SLOPE)
const TE_OUT_ANGLE = Math.atan(-TE_OUT_SLOPE)
const LE_ANGLE = Math.atan(WING_SWEEP_TAN)

const wingY = (x: number) =>
  WING_ROOT_Y + Math.max(0, Math.abs(x) - 2.5) * WING_DIHEDRAL_TAN
const leZ = (x: number) => WING_ROOT_LE_Z - (Math.abs(x) - ROOT_X) * WING_SWEEP_TAN
const teZ = (x: number) => {
  const ax = Math.abs(x)
  if (ax <= KINK.x) return ROOT_TE_Z + (ax - ROOT_X) * TE_IN_SLOPE
  return KINK.z + (ax - KINK.x) * TE_OUT_SLOPE
}

function makeWingGeometry(side: number) {
  const shape = new Shape()
  const pts: Array<[number, number]> = [
    [ROOT_X, WING_ROOT_LE_Z],
    [WING_TIP_X, TIP_LE_Z],
    [WING_TIP_X, TIP_TE_Z],
    [KINK.x, KINK.z],
    [ROOT_X, ROOT_TE_Z],
  ]
  shape.moveTo(side * pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(side * pts[i][0], pts[i][1])
  }
  shape.closePath()

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.24,
    bevelSize: 0.36,
    bevelSegments: 2,
  })
  geometry.rotateX(Math.PI / 2) // shape Y -> world Z, thickness -> world Y
  geometry.translate(0, 0.22, 0)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const ax = Math.abs(position.getX(i))
    if (ax > 2.5) {
      position.setY(i, position.getY(i) + (ax - 2.5) * WING_DIHEDRAL_TAN)
    }
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

interface NacelleProps {
  position: [number, number, number]
}

function Nacelle({ position }: NacelleProps) {
  const rotorRef = useRef<Group>(null)
  const blades = useMemo(
    () => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2),
    [],
  )

  // Parked engines windmill slowly in the breeze
  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.z += delta * 0.55
  })

  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.55]} castShadow>
        <cylinderGeometry args={[1.5, 1.42, 3.0, 28, 1, true]} />
        <meshStandardMaterial
          color={COLORS.engineCowl}
          roughness={0.32}
          metalness={0.25}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 2.05]}>
        <torusGeometry args={[1.45, 0.14, 12, 30]} />
        <meshStandardMaterial color={COLORS.engineLip} roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 1.96]}>
        <circleGeometry args={[1.36, 28]} />
        <meshStandardMaterial color="#181c21" roughness={0.8} />
      </mesh>
      <group ref={rotorRef}>
        {blades.map((angle) => (
          <mesh
            key={angle}
            position={[Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, 2.0]}
            rotation={[0, 0, angle + Math.PI / 2]}
          >
            <boxGeometry args={[1.18, 0.12, 0.03]} />
            <meshStandardMaterial color="#454c54" roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0, 2.18]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.7, 16]} />
          <meshStandardMaterial color="#9aa2ab" roughness={0.35} metalness={0.6} />
        </mesh>
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1.7]} castShadow>
        <cylinderGeometry args={[0.98, 0.6, 1.5, 20]} />
        <meshStandardMaterial color="#b6bdc5" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -2.75]}>
        <cylinderGeometry args={[0.58, 0.34, 0.9, 18]} />
        <meshStandardMaterial color="#5b636c" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  )
}

export interface WingAssemblyProps {
  side: 1 | -1
  explodeProgress: { current: number }
  onSelectPart: (id: string) => void
}

export function WingAssembly({ side, explodeProgress, onSelectPart }: WingAssemblyProps) {
  const outerRef = useRef<Group>(null)
  const engineDropRef = useRef<Group>(null)
  const wingGeometry = useMemo(() => makeWingGeometry(side), [side])

  useFrame(() => {
    const k = explodeProgress.current
    if (outerRef.current) outerRef.current.position.x = side * 7 * k
    if (engineDropRef.current) {
      engineDropRef.current.position.y = -1.4 * k
      engineDropRef.current.position.z = 2.6 * k
    }
  })

  // Wrap a node in an Interactable only on the port wing (catalog anchors live there)
  const clickable = (id: string, text: string, node: ReactNode) =>
    side === 1 ? (
      <Interactable id={`part-${id}`} onInteract={() => onSelectPart(id)} interactionText={text}>
        {node}
      </Interactable>
    ) : (
      node
    )

  const slatXs = [6, 12.5, 19, 25.5]
  const inboardEngine: [number, number, number] = [side * ENGINE_INBOARD_X, 3.15, 4.1]
  const outboardEngine: [number, number, number] = [side * ENGINE_OUTBOARD_X, 3.65, -2.55]

  return (
    <group ref={outerRef}>
      {/* Main wing box */}
      {clickable(
        'wing',
        '主翼',
        <mesh geometry={wingGeometry} position={[0, WING_ROOT_Y, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color={COLORS.wing}
            roughness={0.4}
            metalness={0.3}
            side={DoubleSide}
          />
        </mesh>,
      )}

      {/* Leading edge slats */}
      {slatXs.map((x, i) => {
        const mesh = (
          <mesh
            position={[side * x, wingY(x) - 0.12, leZ(x) + 0.55]}
            rotation={[0, side * LE_ANGLE, 0.06 * side]}
            castShadow
          >
            <boxGeometry args={[5.6, 0.16, 0.85]} />
            <meshStandardMaterial color={COLORS.slat} roughness={0.4} metalness={0.35} />
          </mesh>
        )
        return <group key={x}>{i === 1 ? clickable('slat', '前縁スラット', mesh) : mesh}</group>
      })}

      {/* Inboard triple-slotted flap */}
      {clickable(
        'flap',
        '後縁フラップ',
        <mesh
          position={[side * 6.7, wingY(6.7) - 0.26, teZ(6.7) - 1.05]}
          rotation={[0, side * TE_IN_ANGLE, 0]}
          castShadow
        >
          <boxGeometry args={[7.2, 0.2, 2.5]} />
          <meshStandardMaterial color={COLORS.controlSurface} roughness={0.45} metalness={0.3} />
        </mesh>,
      )}
      {/* Outboard flap */}
      <mesh
        position={[side * 16.5, wingY(16.5) - 0.22, teZ(16.5) - 0.85]}
        rotation={[0, side * TE_OUT_ANGLE, 0]}
        castShadow
      >
        <boxGeometry args={[9.5, 0.18, 1.9]} />
        <meshStandardMaterial color={COLORS.controlSurface} roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Flap track fairings */}
      {[5, 9, 14, 19].map((x) => (
        <mesh
          key={x}
          position={[side * x, wingY(x) - 0.45, teZ(x) - 1.2]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.34, 3.2, 10]} />
          <meshStandardMaterial color={COLORS.wingEdge} roughness={0.5} metalness={0.25} />
        </mesh>
      ))}

      {/* Aileron */}
      {clickable(
        'aileron',
        'エルロン（補助翼）',
        <mesh
          position={[side * 27, wingY(27) - 0.12, teZ(27) - 0.65]}
          rotation={[0, side * TE_OUT_ANGLE, 0]}
          castShadow
        >
          <boxGeometry args={[6.2, 0.15, 1.4]} />
          <meshStandardMaterial color={COLORS.controlSurface} roughness={0.45} metalness={0.3} />
        </mesh>,
      )}

      {/* Spoiler panels (slightly raised) */}
      {clickable(
        'spoiler',
        'スポイラー',
        <mesh
          position={[side * 6.8, wingY(6.8) + 0.42, teZ(6.8) + 0.85]}
          rotation={[0.22, side * TE_IN_ANGLE, 0]}
        >
          <boxGeometry args={[5.5, 0.08, 1.1]} />
          <meshStandardMaterial color={COLORS.wingEdge} roughness={0.45} metalness={0.3} />
        </mesh>,
      )}
      <mesh
        position={[side * 16, wingY(16) + 0.5, teZ(16) + 0.7]}
        rotation={[0.22, side * TE_OUT_ANGLE, 0]}
      >
        <boxGeometry args={[6.5, 0.08, 1.0]} />
        <meshStandardMaterial color={COLORS.wingEdge} roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Winglet */}
      {clickable(
        'winglet',
        'ウィングレット',
        <mesh
          position={[side * 31.95, wingY(32.2) + 1.05, TIP_LE_Z - 1.9]}
          rotation={[0, 0, -side * 0.32]}
          castShadow
        >
          <boxGeometry args={[0.1, 1.85, 1.9]} />
          <meshStandardMaterial color={COLORS.wing} roughness={0.4} metalness={0.3} />
        </mesh>,
      )}

      {/* Navigation light: red = port (left), green = starboard (right) */}
      <mesh position={[side * 32.1, wingY(32.2) + 0.12, TIP_LE_Z - 0.35]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial
          color="#202020"
          emissive={side === 1 ? '#ff2418' : '#1aff48'}
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Engine pylons (stay on the wing in exploded mode) */}
      {clickable(
        'pylon',
        'パイロン',
        <mesh
          position={[side * ENGINE_INBOARD_X, 5.05, 2.4]}
          rotation={[-0.12, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.34, 1.5, 3.4]} />
          <meshStandardMaterial color={COLORS.pylon} roughness={0.45} metalness={0.3} />
        </mesh>,
      )}
      <mesh
        position={[side * ENGINE_OUTBOARD_X, 5.9, -4.2]}
        rotation={[-0.12, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.34, 1.5, 3.4]} />
        <meshStandardMaterial color={COLORS.pylon} roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Engines (drop away in exploded mode) */}
      <group ref={engineDropRef}>
        {clickable('engine', 'ジェットエンジン', <Nacelle position={inboardEngine} />)}
        <Nacelle position={outboardEngine} />
      </group>
    </group>
  )
}
