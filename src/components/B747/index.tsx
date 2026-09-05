import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { COLORS } from '../../constants'
import { PART_MAP } from '../../parts'
import { FloatingLabel } from '../FloatingLabel'
import { Airframe } from './Airframe'
import { Empennage } from './Empennage'
import { Interior } from './Interior'
import { LandingGear } from './LandingGear'
import { WingAssembly } from './Wings'

const EXPLODE_LABELS: Array<{ text: string; position: [number, number, number] }> = [
  { text: 'レドーム / 気象レーダー', position: [0, 8.2, 41.5] },
  { text: 'APU 補助動力装置', position: [0, 10.4, -40.5] },
  { text: '主翼ユニット', position: [27, 10.6, -5] },
  { text: 'エンジン', position: [18.7, 5.2, 6.7] },
  { text: '水平尾翼', position: [11, 9.6, -36] },
  { text: '垂直尾翼', position: [0, 21.8, -32.5] },
  { text: '降着装置', position: [5.2, 4.2, -11.5] },
]

function PartMarker({ partId }: { partId: string }) {
  const ringRef = useRef<Mesh>(null)
  const part = PART_MAP[partId]

  useFrame((state) => {
    if (!ringRef.current) return
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 3.2) * 0.16
    ringRef.current.scale.setScalar(pulse)
    ringRef.current.rotation.z = t * 0.8
  })

  if (!part) return null
  return (
    <group position={part.anchor}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.07, 10, 36]} />
        <meshBasicMaterial color={COLORS.highlight} />
      </mesh>
      <FloatingLabel text={`${part.name} / ${part.english}`} position={[0, 1.7, 0]} fontSize={0.5} />
    </group>
  )
}

export interface B747Props {
  exploded: boolean
  selectedPart: string | null
  onSelectPart: (id: string) => void
}

export function B747({ exploded, selectedPart, onSelectPart }: B747Props) {
  const rawRef = useRef(0)
  const easedRef = useRef(0)

  useFrame((_, delta) => {
    const target = exploded ? 1 : 0
    const raw = rawRef.current + (target - rawRef.current) * Math.min(1, delta * 2.4)
    rawRef.current = Math.abs(raw - target) < 0.001 ? target : raw
    const t = rawRef.current
    easedRef.current = t * t * (3 - 2 * t)
  })

  return (
    <group>
      <Airframe explodeProgress={easedRef} onSelectPart={onSelectPart} />
      <WingAssembly side={1} explodeProgress={easedRef} onSelectPart={onSelectPart} />
      <WingAssembly side={-1} explodeProgress={easedRef} onSelectPart={onSelectPart} />
      <Empennage explodeProgress={easedRef} onSelectPart={onSelectPart} />
      <LandingGear explodeProgress={easedRef} onSelectPart={onSelectPart} />
      <Interior />

      {selectedPart ? <PartMarker partId={selectedPart} /> : null}

      {exploded
        ? EXPLODE_LABELS.map((label) => (
            <FloatingLabel key={label.text} text={label.text} position={label.position} />
          ))
        : null}
    </group>
  )
}
