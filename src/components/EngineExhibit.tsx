import { JPText } from './JPText'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { Interactable } from '@xrift/world-components'
import { useRef } from 'react'
import type { Group } from 'three'
import { COLORS, EXHIBIT_AXIS_Y, EXHIBIT_POS } from '../constants'
import { ENGINE_MODULES } from '../parts'
import { FloatingLabel } from './FloatingLabel'

// Base z position (local, +z = intake side) of each module, keyed by catalog order
const MODULE_BASE_Z: Record<string, number> = {
  inlet: 1.65,
  fan: 1.05,
  lpc: 0.5,
  hpc: -0.1,
  combustor: -0.62,
  hpt: -1.0,
  lpt: -1.55,
  nozzle: -2.3,
}

function ModuleMesh({ id }: { id: string }) {
  const fanRef = useRef<Group>(null)
  useFrame((_, delta) => {
    if (fanRef.current) fanRef.current.rotation.z += delta * 0.9
  })

  switch (id) {
    case 'inlet':
      return (
        <group>
          <mesh position={[0, 0, 0.25]}>
            <torusGeometry args={[1.32, 0.16, 12, 32]} />
            <meshStandardMaterial color={COLORS.engineCowl} roughness={0.32} metalness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.32, 1.28, 0.6, 28, 1, true]} />
            <meshStandardMaterial color={COLORS.engineCowl} roughness={0.32} metalness={0.3} />
          </mesh>
          {/* Accessory gearbox and plumbing on the fan case (maintenance photo) */}
          <mesh position={[0, -1.32, -0.15]}>
            <boxGeometry args={[0.6, 0.3, 0.5]} />
            <meshStandardMaterial color="#6d7680" roughness={0.45} metalness={0.6} />
          </mesh>
          {[0.4, -0.4].map((x) => (
            <mesh key={x} position={[x, -1.18, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.9, 8]} />
              <meshStandardMaterial color="#b3925a" roughness={0.4} metalness={0.7} />
            </mesh>
          ))}
          {[0.7, 2.05, 3.6].map((angle) => (
            <mesh
              key={angle}
              position={[Math.cos(angle) * 1.36, Math.sin(angle) * 1.36, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
              <meshStandardMaterial color="#8e959d" roughness={0.4} metalness={0.7} />
            </mesh>
          ))}
        </group>
      )
    case 'fan': {
      const blades = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2)
      return (
        <group>
          <group ref={fanRef}>
            {blades.map((angle) => (
              <mesh
                key={angle}
                position={[Math.cos(angle) * 0.66, Math.sin(angle) * 0.66, 0]}
                rotation={[0, 0.42, angle - Math.PI / 2]}
              >
                <boxGeometry args={[0.05, 1.06, 0.2]} />
                <meshStandardMaterial color="#7d888f" roughness={0.3} metalness={0.75} />
              </mesh>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.24, 16]} />
              <meshStandardMaterial color="#aab1b9" roughness={0.35} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.26, 0.5, 16]} />
              <meshStandardMaterial color="#cdd3d9" roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        </group>
      )
    }
    case 'lpc':
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.0, 0.78, 0.75, 22]} />
            <meshStandardMaterial color="#aeb6bf" roughness={0.4} metalness={0.55} />
          </mesh>
          {[0.2, 0, -0.2].map((z, i) => (
            <mesh key={z} position={[0, 0, z]}>
              <torusGeometry args={[1.0 - i * 0.08, 0.03, 8, 28]} />
              <meshStandardMaterial color="#6d757e" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
        </group>
      )
    case 'hpc':
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.76, 0.5, 0.75, 22]} />
            <meshStandardMaterial color="#959ca6" roughness={0.4} metalness={0.6} />
          </mesh>
          {[0.22, 0.05, -0.12].map((z, i) => (
            <mesh key={z} position={[0, 0, z]}>
              <torusGeometry args={[0.72 - i * 0.09, 0.025, 8, 26]} />
              <meshStandardMaterial color="#5d646d" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
        </group>
      )
    case 'combustor':
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.55, 22]} />
            <meshStandardMaterial
              color="#5e4633"
              emissive="#ff7a2a"
              emissiveIntensity={0.9}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[0, 0, 0.26]}>
            <torusGeometry args={[0.5, 0.05, 8, 22]} />
            <meshStandardMaterial color="#3c3833" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      )
    case 'hpt': {
      const blades = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.62, 0.66, 0.3, 22]} />
            <meshStandardMaterial color="#8a5a52" roughness={0.4} metalness={0.65} />
          </mesh>
          {blades.map((angle) => (
            <mesh
              key={angle}
              position={[Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, 0]}
              rotation={[0, 0.3, angle - Math.PI / 2]}
            >
              <boxGeometry args={[0.04, 0.4, 0.16]} />
              <meshStandardMaterial color="#b08a7f" roughness={0.35} metalness={0.7} />
            </mesh>
          ))}
        </group>
      )
    }
    case 'lpt':
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.72, 0.95, 0.85, 22]} />
            <meshStandardMaterial color="#9aa2ab" roughness={0.4} metalness={0.6} />
          </mesh>
          {[0.25, 0, -0.25].map((z, i) => (
            <mesh key={z} position={[0, 0, z]}>
              <torusGeometry args={[0.74 + i * 0.08, 0.03, 8, 26]} />
              <meshStandardMaterial color="#6d757e" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
        </group>
      )
    case 'nozzle':
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.85, 0.5, 1.0, 22, 1, true]} />
            <meshStandardMaterial color="#5b636c" roughness={0.45} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.28, 0.85, 14]} />
            <meshStandardMaterial color="#454c54" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

export interface EngineExhibitProps {
  exploded: boolean
  onToggle: () => void
}

export function EngineExhibit({ exploded, onToggle }: EngineExhibitProps) {
  const progressRef = useRef(0)
  const moduleRefs = useRef<Array<Group | null>>([])

  useFrame((_, delta) => {
    const target = exploded ? 1 : 0
    const next =
      progressRef.current + (target - progressRef.current) * Math.min(1, delta * 2.6)
    progressRef.current = Math.abs(next - target) < 0.001 ? target : next
    const t = progressRef.current
    const eased = t * t * (3 - 2 * t)
    ENGINE_MODULES.forEach((module, i) => {
      const group = moduleRefs.current[i]
      if (group) {
        group.position.z = MODULE_BASE_Z[module.id] + eased * module.explodeOffset
      }
    })
  })

  return (
    <group position={EXHIBIT_POS}>
      {/* Pedestal */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[3.0, 3.2, 0.24, 36]} />
        <meshStandardMaterial color="#6c737b" roughness={0.7} />
      </mesh>

      {/* Engine stand */}
      {[1.3, -1.3].map((z) =>
        [0.55, -0.55].map((x) => (
          <mesh
            key={`${z}-${x}`}
            position={[x, 1.15, z]}
            rotation={[0, 0, x > 0 ? 0.32 : -0.32]}
            castShadow
          >
            <boxGeometry args={[0.16, 2.0, 0.16]} />
            <meshStandardMaterial color="#3f474f" roughness={0.5} metalness={0.4} />
          </mesh>
        )),
      )}

      {/* Engine modules */}
      <group position={[0, EXHIBIT_AXIS_Y, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 4.8, 10]} />
          <meshStandardMaterial color="#8e959d" roughness={0.35} metalness={0.7} />
        </mesh>
        {ENGINE_MODULES.map((module, i) => (
          <group
            key={module.id}
            ref={(el) => {
              moduleRefs.current[i] = el
            }}
            position={[0, 0, MODULE_BASE_Z[module.id]]}
          >
            <ModuleMesh id={module.id} />
            {exploded ? (
              <group>
                <mesh position={[0, 1.15, 0]}>
                  <boxGeometry args={[0.02, 1.0, 0.02]} />
                  <meshBasicMaterial color="#dfe6ee" />
                </mesh>
                <FloatingLabel
                  text={module.name}
                  position={[0, 1.95, 0]}
                  fontSize={0.3}
                />
              </group>
            ) : null}
          </group>
        ))}
      </group>

      {/* Toggle button */}
      <group position={[0, 0, 3.7]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.14, 1.1, 0.14]} />
          <meshStandardMaterial color="#3f474f" roughness={0.5} metalness={0.4} />
        </mesh>
        <Interactable
          id="engine-exhibit-toggle"
          onInteract={onToggle}
          interactionText={exploded ? 'エンジンを組み立てる' : 'エンジンを分解する'}
        >
          <mesh position={[0, 1.2, 0.06]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.8, 0.5, 0.12]} />
            <meshStandardMaterial
              color={exploded ? COLORS.buttonActive : COLORS.buttonIdle}
              emissive={exploded ? COLORS.buttonActive : COLORS.buttonIdle}
              emissiveIntensity={0.45}
              roughness={0.4}
            />
          </mesh>
        </Interactable>
        <JPText
          position={[0, 1.24, 0.16]}
          rotation={[-0.4, 0, 0]}
          fontSize={0.13}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {exploded ? '組み立てる' : '分解する'}
        </JPText>
      </group>

      {/* Explainer board (angled toward the kiosk/spawn walkway) */}
      <group position={[-3.6, 0, -2.8]} rotation={[0, 0.9, 0]}>
        {[1.3, -1.3].map((x) => (
          <mesh key={x} position={[x, 0.9, 0]}>
            <boxGeometry args={[0.1, 1.8, 0.1]} />
            <meshStandardMaterial color="#3f474f" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[3.2, 1.9, 0.08]} />
          <meshStandardMaterial color={COLORS.boardBg} roughness={0.6} />
        </mesh>
        <JPText
          position={[0, 2.9, 0.06]}
          fontSize={0.2}
          color={COLORS.highlight}
          anchorX="center"
          anchorY="middle"
        >
          ターボファンエンジンのしくみ
        </JPText>
        <JPText
          position={[0, 2.05, 0.06]}
          fontSize={0.125}
          color="#e8eef5"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.9}
          lineHeight={1.5}
          overflowWrap="break-word"
        >
          {
            '吸い込んだ空気の大部分はファンで加速され、コアの外側を素通りして推力になります（バイパス比 約5:1）。残りの空気は圧縮機で約30倍に圧縮され、燃焼室で燃やされてタービンを回し、その力でファンと圧縮機を駆動します。ボタンで分解して、各部の名前と役割を確かめてみましょう。'
          }
        </JPText>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[1.6, 1.0, 0.1]} position={[0, 1.9, 0]} />
        </RigidBody>
      </group>

      {/* Colliders */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.12, 3.0]} position={[0, 0.12, 0]} />
        <CuboidCollider args={[0.1, 0.6, 0.1]} position={[0, 0.6, 3.7]} />
      </RigidBody>
    </group>
  )
}
