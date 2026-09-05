import { JPText } from './JPText'
import { BillboardY } from '@xrift/world-components'
import { COLORS } from '../constants'

export interface FloatingLabelProps {
  text: string
  position: [number, number, number]
  fontSize?: number
}

// Y-axis billboard text label with a translucent backing plate
export function FloatingLabel({ text, position, fontSize = 0.62 }: FloatingLabelProps) {
  return (
    <BillboardY position={position}>
      <mesh>
        <planeGeometry args={[text.length * fontSize * 0.66 + 0.6, fontSize * 2]} />
        <meshBasicMaterial color={COLORS.labelBg} transparent opacity={0.78} />
      </mesh>
      <JPText
        position={[0, 0, 0.01]}
        fontSize={fontSize}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </JPText>
    </BillboardY>
  )
}
