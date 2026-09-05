import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import {
  BOARDING_DOOR_Z,
  COLORS,
  GATE_PLATFORM_Y,
  GATE_TOWER_X,
  GATE_TOWER_Z,
} from '../constants'
import { FloatingLabel } from './FloatingLabel'

// Bridge runs from the tower platform edge to the L2 door on the port side
const BRIDGE_START_X = GATE_TOWER_X - 2.2 // 11.3
const BRIDGE_END_X = 3.1
const BRIDGE_DX = BRIDGE_END_X - BRIDGE_START_X
const BRIDGE_DZ = BOARDING_DOOR_Z - GATE_TOWER_Z
const BRIDGE_LEN = Math.hypot(BRIDGE_DX, BRIDGE_DZ)
const BRIDGE_YAW = Math.atan2(-BRIDGE_DZ / BRIDGE_LEN, BRIDGE_DX / BRIDGE_LEN)
const BRIDGE_MID: [number, number, number] = [
  (BRIDGE_START_X + BRIDGE_END_X) / 2,
  0,
  (GATE_TOWER_Z + BOARDING_DOOR_Z) / 2,
]

// Stairs descend from the platform (+z edge) to the apron
const STAIR_TOP_Z = GATE_TOWER_Z + 2.25
const STAIR_RISE = GATE_PLATFORM_Y // 5.1
const STAIR_STEPS = 30
const STEP_RISE = STAIR_RISE / STAIR_STEPS
const STEP_RUN = 0.378
const STAIR_RUN = STAIR_STEPS * STEP_RUN
const STAIR_ANGLE = Math.atan(STAIR_RISE / STAIR_RUN)
const STAIR_SLOPE_LEN = Math.hypot(STAIR_RISE, STAIR_RUN)
const STAIR_MID_Z = STAIR_TOP_Z + STAIR_RUN / 2
const STAIR_MID_Y = STAIR_RISE / 2

const steelMaterial = { color: COLORS.gateSteel, roughness: 0.5, metalness: 0.4 } as const

export function BoardingGate() {
  const steps = useMemo(
    () =>
      Array.from({ length: STAIR_STEPS }, (_, i) => ({
        y: GATE_PLATFORM_Y - (i + 0.5) * STEP_RISE,
        z: STAIR_TOP_Z + (i + 0.5) * STEP_RUN,
      })),
    [],
  )

  return (
    <group>
      {/* ---- Gate tower ---- */}
      <group position={[GATE_TOWER_X, 0, GATE_TOWER_Z]}>
        <mesh position={[0, GATE_PLATFORM_Y - 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 0.3, 4.6]} />
          <meshStandardMaterial color={COLORS.gateFloor} roughness={0.7} />
        </mesh>
        {[1.9, -1.9].map((x) =>
          [1.9, -1.9].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 2.4, z]} castShadow>
              <cylinderGeometry args={[0.16, 0.16, 4.8, 12]} />
              <meshStandardMaterial {...steelMaterial} />
            </mesh>
          )),
        )}
        {/* roof */}
        <mesh position={[0, 8.35, 0]} castShadow>
          <boxGeometry args={[5.0, 0.14, 5.0]} />
          <meshStandardMaterial color={COLORS.signNavy} roughness={0.6} />
        </mesh>
        {[2.1, -2.1].map((x) =>
          [2.1, -2.1].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 6.65, z]}>
              <cylinderGeometry args={[0.07, 0.07, 3.1, 10]} />
              <meshStandardMaterial {...steelMaterial} />
            </mesh>
          )),
        )}
        {/* railings (visual) */}
        <mesh position={[2.3, 6.2, 0]}>
          <boxGeometry args={[0.08, 0.06, 4.6]} />
          <meshStandardMaterial {...steelMaterial} />
        </mesh>
        <mesh position={[0, 6.2, -2.3]}>
          <boxGeometry args={[4.6, 0.06, 0.08]} />
          <meshStandardMaterial {...steelMaterial} />
        </mesh>
        {[1.6, -1.6].map((x) => (
          <mesh key={x} position={[x, 6.2, 2.3]}>
            <boxGeometry args={[1.4, 0.06, 0.08]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
        ))}
        {[1.625, -1.625].map((z) => (
          <mesh key={z} position={[-2.3, 6.2, z]}>
            <boxGeometry args={[0.08, 0.06, 1.35]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
        ))}

        <FloatingLabel text="GATE 47 搭乗口" position={[0, 9.4, 0]} fontSize={0.55} />

        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[2.3, 0.15, 2.3]} position={[0, GATE_PLATFORM_Y - 0.15, 0]} />
          <CuboidCollider args={[0.06, 0.6, 2.3]} position={[2.3, 5.85, 0]} />
          <CuboidCollider args={[2.3, 0.6, 0.06]} position={[0, 5.85, -2.3]} />
          {[1.6, -1.6].map((x) => (
            <CuboidCollider key={x} args={[0.7, 0.6, 0.06]} position={[x, 5.85, 2.3]} />
          ))}
          {[1.625, -1.625].map((z) => (
            <CuboidCollider key={z} args={[0.06, 0.6, 0.675]} position={[-2.3, 5.85, z]} />
          ))}
        </RigidBody>
      </group>

      {/* ---- Stairs ---- */}
      <group>
        {steps.map((s) => (
          <mesh key={s.z} position={[GATE_TOWER_X, s.y, s.z]} castShadow>
            <boxGeometry args={[1.8, 0.05, 0.42]} />
            <meshStandardMaterial color="#7c8694" roughness={0.55} metalness={0.3} />
          </mesh>
        ))}
        {[0.94, -0.94].map((dx) => (
          <group key={dx}>
            <mesh
              position={[GATE_TOWER_X + dx, STAIR_MID_Y - 0.1, STAIR_MID_Z]}
              rotation={[STAIR_ANGLE, 0, 0]}
            >
              <boxGeometry args={[0.08, 0.28, STAIR_SLOPE_LEN]} />
              <meshStandardMaterial {...steelMaterial} />
            </mesh>
            <mesh
              position={[GATE_TOWER_X + dx, STAIR_MID_Y + 0.95, STAIR_MID_Z]}
              rotation={[STAIR_ANGLE, 0, 0]}
            >
              <boxGeometry args={[0.06, 0.07, STAIR_SLOPE_LEN]} />
              <meshStandardMaterial color="#aeb6c0" roughness={0.35} metalness={0.6} />
            </mesh>
          </group>
        ))}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[0.95, 0.09, STAIR_SLOPE_LEN / 2 + 0.2]}
            position={[GATE_TOWER_X, STAIR_MID_Y - 0.05, STAIR_MID_Z]}
            rotation={[STAIR_ANGLE, 0, 0]}
          />
          {[0.97, -0.97].map((dx) => (
            <CuboidCollider
              key={dx}
              args={[0.05, 0.5, STAIR_SLOPE_LEN / 2]}
              position={[GATE_TOWER_X + dx, STAIR_MID_Y + 0.5, STAIR_MID_Z]}
              rotation={[STAIR_ANGLE, 0, 0]}
            />
          ))}
        </RigidBody>
      </group>

      {/* ---- Bridge ---- */}
      <group position={BRIDGE_MID} rotation={[0, BRIDGE_YAW, 0]}>
        <mesh position={[0, 5.0, 0]} castShadow>
          <boxGeometry args={[BRIDGE_LEN + 0.3, 0.22, 1.9]} />
          <meshStandardMaterial color={COLORS.gateFloor} roughness={0.7} />
        </mesh>
        {[0.92, -0.92].map((z) => (
          <group key={z}>
            <mesh position={[0, 5.85, z]}>
              <boxGeometry args={[BRIDGE_LEN + 0.3, 1.25, 0.06]} />
              <meshStandardMaterial
                color={COLORS.gateGlass}
                roughness={0.1}
                metalness={0.1}
                transparent
                opacity={0.32}
              />
            </mesh>
            <mesh position={[0, 6.52, z]}>
              <boxGeometry args={[BRIDGE_LEN + 0.3, 0.07, 0.1]} />
              <meshStandardMaterial {...steelMaterial} />
            </mesh>
            {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => (
              <mesh key={x} position={[x, 6.0, z]}>
                <boxGeometry args={[0.1, 2.1, 0.09]} />
                <meshStandardMaterial {...steelMaterial} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 7.1, 0]} castShadow>
          <boxGeometry args={[BRIDGE_LEN + 0.5, 0.12, 2.15]} />
          <meshStandardMaterial color={COLORS.signNavy} roughness={0.6} />
        </mesh>
        {/* docking hood against the fuselage */}
        <mesh position={[BRIDGE_LEN / 2 + 0.1, 7.0, 0]}>
          <boxGeometry args={[1.6, 0.12, 2.2]} />
          <meshStandardMaterial color="#2e3742" roughness={0.7} />
        </mesh>
        {[1.08, -1.08].map((z) => (
          <mesh key={z} position={[BRIDGE_LEN / 2 + 0.1, 6.1, z]}>
            <boxGeometry args={[1.6, 1.9, 0.08]} />
            <meshStandardMaterial color="#2e3742" roughness={0.7} />
          </mesh>
        ))}

        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[BRIDGE_LEN / 2 + 0.15, 0.11, 0.95]} position={[0, 5.0, 0]} />
          {[0.93, -0.93].map((z) => (
            <CuboidCollider
              key={z}
              args={[BRIDGE_LEN / 2 + 0.15, 0.85, 0.05]}
              position={[0, 6.05, z]}
            />
          ))}
        </RigidBody>
      </group>
    </group>
  )
}
