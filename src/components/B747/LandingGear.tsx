import { useFrame } from '@react-three/fiber'
import { Interactable } from '@xrift/world-components'
import { useRef } from 'react'
import type { Group } from 'three'
import {
  BODY_GEAR_X,
  BODY_GEAR_Z,
  COLORS,
  MAIN_WHEEL_RADIUS,
  NOSE_GEAR_Z,
  NOSE_WHEEL_RADIUS,
  WING_GEAR_X,
  WING_GEAR_Z,
} from '../../constants'

function Wheel({
  position,
  radius,
}: {
  position: [number, number, number]
  radius: number
}) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius, radius, 0.5, 20]} />
        <meshStandardMaterial color={COLORS.tire} roughness={0.95} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.45, radius * 0.45, 0.52, 14]} />
        <meshStandardMaterial color="#b9bec5" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

// Four-wheel main gear bogie
function Bogie({ position }: { position: [number, number, number] }) {
  const r = MAIN_WHEEL_RADIUS
  return (
    <group position={position}>
      {/* bogie beam */}
      <mesh position={[0, r, 0]} castShadow>
        <boxGeometry args={[0.38, 0.3, 2.9]} />
        <meshStandardMaterial color={COLORS.strut} roughness={0.45} metalness={0.5} />
      </mesh>
      {/* axles */}
      {[0.98, -0.98].map((z) => (
        <mesh key={z} position={[0, r, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 1.5, 10]} />
          <meshStandardMaterial color={COLORS.metal} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* wheels */}
      {[0.98, -0.98].map((z) =>
        [0.58, -0.58].map((x) => (
          <Wheel key={`${z}-${x}`} position={[x, r, z]} radius={r} />
        )),
      )}
      {/* main strut */}
      <mesh position={[0, r + 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.24, 3.0, 14]} />
        <meshStandardMaterial color={COLORS.strut} roughness={0.35} metalness={0.6} />
      </mesh>
      {/* drag brace */}
      <mesh position={[0, r + 1.2, 0.85]} rotation={[0.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.6, 10]} />
        <meshStandardMaterial color={COLORS.strut} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  )
}

function NoseGear() {
  const r = NOSE_WHEEL_RADIUS
  return (
    <group position={[0, 0, NOSE_GEAR_Z]}>
      <mesh position={[0, r + 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.2, 2.8, 14]} />
        <meshStandardMaterial color={COLORS.strut} roughness={0.35} metalness={0.6} />
      </mesh>
      {/* fork */}
      {[0.32, -0.32].map((x) => (
        <mesh key={x} position={[x, r * 0.95, 0]} castShadow>
          <boxGeometry args={[0.1, r * 1.4, 0.3]} />
          <meshStandardMaterial color={COLORS.strut} roughness={0.4} metalness={0.55} />
        </mesh>
      ))}
      {[0.46, -0.46].map((x) => (
        <Wheel key={x} position={[x, r, 0]} radius={r} />
      ))}
      {/* drag brace */}
      <mesh position={[0, r + 1.1, -0.8]} rotation={[-0.55, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 2.4, 10]} />
        <meshStandardMaterial color={COLORS.strut} roughness={0.4} metalness={0.5} />
      </mesh>
      {/* taxi light */}
      <mesh position={[0, r + 0.7, 0.25]}>
        <boxGeometry args={[0.22, 0.14, 0.1]} />
        <meshStandardMaterial emissive="#fff6cf" emissiveIntensity={1.4} color="#888" />
      </mesh>
    </group>
  )
}

export interface LandingGearProps {
  explodeProgress: { current: number }
  onSelectPart: (id: string) => void
}

export function LandingGear({ explodeProgress, onSelectPart }: LandingGearProps) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    const k = explodeProgress.current
    if (groupRef.current) groupRef.current.position.z = -10 * k
  })

  return (
    <group>
      <group ref={groupRef}>
        <Interactable
          id="part-nose-gear"
          onInteract={() => onSelectPart('nose-gear')}
          interactionText="前脚（ノーズギア）"
        >
          <NoseGear />
        </Interactable>

        {/* Wing gear (port bogie is clickable) */}
        <Interactable
          id="part-main-gear"
          onInteract={() => onSelectPart('main-gear')}
          interactionText="主脚（メインギア）"
        >
          <Bogie position={[WING_GEAR_X, 0, WING_GEAR_Z]} />
        </Interactable>
        <Bogie position={[-WING_GEAR_X, 0, WING_GEAR_Z]} />
        <Bogie position={[BODY_GEAR_X, 0, BODY_GEAR_Z]} />
        <Bogie position={[-BODY_GEAR_X, 0, BODY_GEAR_Z]} />
      </group>

      {/* Gear doors stay on the airframe when the gear explodes away */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 3.05, 3.6, WING_GEAR_Z]}
            rotation={[0, 0, side * 1.25]}
            castShadow
          >
            <boxGeometry args={[0.06, 1.5, 2.9]} />
            <meshStandardMaterial color={COLORS.belly} roughness={0.5} metalness={0.15} />
          </mesh>
          <mesh
            position={[side * 0.78, 2.62, NOSE_GEAR_Z]}
            rotation={[0, 0, side * 1.3]}
            castShadow
          >
            <boxGeometry args={[0.05, 1.1, 2.1]} />
            <meshStandardMaterial color={COLORS.belly} roughness={0.5} metalness={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
