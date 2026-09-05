import { JPText } from './JPText'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Interactable, useTeleport } from '@xrift/world-components'
import { COLORS, KIOSK_POS, WORLD_SPAWN_POINT } from '../constants'

interface KioskButton {
  id: string
  label: string
  action: 'teleport' | 'toggle-exploded'
  destination?: { position: [number, number, number]; yaw?: number }
}

// Teleport targets are world coordinates (aircraft interior = 1.25x scale)
const BUTTONS: KioskButton[] = [
  {
    id: 'tp-main-deck',
    label: '機内へ（1階客室）',
    action: 'teleport',
    destination: { position: [0, 6.7, 15], yaw: 180 },
  },
  {
    id: 'tp-upper-deck',
    label: '2階デッキへ',
    action: 'teleport',
    destination: { position: [0, 10.5, 17.5], yaw: 180 },
  },
  {
    id: 'tp-cockpit',
    label: 'コックピットへ',
    action: 'teleport',
    destination: { position: [0, 10.4, 34.6], yaw: 180 },
  },
  {
    id: 'tp-tail',
    label: '尾翼ビュー',
    action: 'teleport',
    destination: { position: [20, 0.2, -57] },
  },
  {
    id: 'tp-wingtip',
    label: '翼端ビュー',
    action: 'teleport',
    destination: { position: [42, 0.2, -23] },
  },
  { id: 'toggle-exploded', label: '機体分解モード', action: 'toggle-exploded' },
]

export interface ObservationKioskProps {
  exploded: boolean
  onToggleExploded: () => void
}

export function ObservationKiosk({ exploded, onToggleExploded }: ObservationKioskProps) {
  const { teleport } = useTeleport()

  // Face the spawn area
  const facingY = Math.atan2(
    WORLD_SPAWN_POINT[0] - KIOSK_POS[0],
    WORLD_SPAWN_POINT[2] - KIOSK_POS[2],
  )

  return (
    <group position={KIOSK_POS} rotation={[0, facingY, 0]}>
      {[1.5, -1.5].map((x) => (
        <mesh key={x} position={[x, 0.5, -0.05]} castShadow>
          <boxGeometry args={[0.15, 1.0, 0.15]} />
          <meshStandardMaterial color="#3f474f" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[3.8, 1.9, 0.14]} />
        <meshStandardMaterial color={COLORS.boardBg} roughness={0.6} />
      </mesh>

      <JPText
        position={[0, 2.4, 0.08]}
        fontSize={0.2}
        color={COLORS.highlight}
        anchorX="center"
        anchorY="middle"
      >
        BOEING 747-400 観察デッキ
      </JPText>
      <JPText
        position={[0, 2.12, 0.08]}
        fontSize={0.115}
        color="#9fb7d8"
        anchorX="center"
        anchorY="middle"
      >
        全長 70.6m ・ 全幅 64.4m ・ 全高 19.4m ・ 最大離陸重量 396.9t ・ 巡航 マッハ0.85
      </JPText>

      {BUTTONS.map((button, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = (col - 1) * 1.22
        const y = 1.72 - row * 0.56
        const isToggle = button.action === 'toggle-exploded'
        const active = isToggle && exploded
        return (
          <group key={button.id} position={[x, y, 0.08]}>
            <Interactable
              id={`kiosk-${button.id}`}
              onInteract={() => {
                if (button.action === 'teleport' && button.destination) {
                  teleport(button.destination)
                } else if (button.action === 'toggle-exploded') {
                  onToggleExploded()
                }
              }}
              interactionText={
                isToggle
                  ? exploded
                    ? '機体を組み立てる'
                    : '機体を分解する'
                  : button.label
              }
            >
              <mesh>
                <boxGeometry args={[1.08, 0.4, 0.08]} />
                <meshStandardMaterial
                  color={active ? COLORS.buttonActive : COLORS.buttonIdle}
                  emissive={active ? COLORS.buttonActive : COLORS.buttonIdle}
                  emissiveIntensity={0.4}
                  roughness={0.4}
                />
              </mesh>
            </Interactable>
            <JPText
              position={[0, 0, 0.06]}
              fontSize={0.105}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {isToggle ? (exploded ? '機体を組み立てる' : '機体を分解する') : button.label}
            </JPText>
          </group>
        )
      })}

      <JPText
        position={[0, 0.62, 0.08]}
        fontSize={0.1}
        color="#7e93b4"
        anchorX="center"
        anchorY="middle"
      >
        搭乗は GATE 47 の階段からどうぞ（機内にも降機ボタンがあります）
      </JPText>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.9, 1.35, 0.15]} position={[0, 1.35, 0]} />
      </RigidBody>
    </group>
  )
}
