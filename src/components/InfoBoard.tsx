import { JPText } from './JPText'
import { COLORS } from '../constants'
import { PART_MAP } from '../parts'

export interface InfoBoardProps {
  selectedPartId: string | null
  position: [number, number, number]
  rotationY?: number
}

// Standing signboard that shows the description of the selected airframe part
export function InfoBoard({ selectedPartId, position, rotationY = 0 }: InfoBoardProps) {
  const part = selectedPartId ? PART_MAP[selectedPartId] : null

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[2.1, -2.1].map((x) => (
        <mesh key={x} position={[x, 1.2, -0.06]} castShadow>
          <boxGeometry args={[0.14, 2.4, 0.14]} />
          <meshStandardMaterial color="#3f474f" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 2.6, 0]} castShadow>
        <boxGeometry args={[5.0, 2.8, 0.1]} />
        <meshStandardMaterial color={COLORS.boardBg} roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.85, 0.051]}>
        <planeGeometry args={[5.0, 0.3]} />
        <meshBasicMaterial color={COLORS.highlight} />
      </mesh>
      <JPText
        position={[0, 3.85, 0.06]}
        fontSize={0.17}
        color="#10203a"
        anchorX="center"
        anchorY="middle"
      >
        パーツ解説 / PARTS GUIDE
      </JPText>

      {part ? (
        <group>
          <JPText
            position={[-2.3, 3.4, 0.06]}
            fontSize={0.34}
            color={COLORS.highlight}
            anchorX="left"
            anchorY="middle"
          >
            {part.name}
          </JPText>
          <JPText
            position={[-2.3, 3.08, 0.06]}
            fontSize={0.16}
            color="#9fb7d8"
            anchorX="left"
            anchorY="middle"
          >
            {part.english}
          </JPText>
          <JPText
            position={[-2.3, 2.78, 0.06]}
            fontSize={0.185}
            color="#e8eef5"
            anchorX="left"
            anchorY="top"
            maxWidth={4.6}
            lineHeight={1.55}
            overflowWrap="break-word"
          >
            {part.description}
          </JPText>
        </group>
      ) : (
        <group>
          <JPText
            position={[0, 2.9, 0.06]}
            fontSize={0.24}
            color="#e8eef5"
            anchorX="center"
            anchorY="middle"
          >
            機体の各部をクリックしてみよう
          </JPText>
          <JPText
            position={[0, 2.4, 0.06]}
            fontSize={0.15}
            color="#9fb7d8"
            anchorX="center"
            anchorY="middle"
            maxWidth={4.5}
            lineHeight={1.6}
            overflowWrap="break-word"
          >
            {
              '主翼・エンジン・尾翼・車輪など、気になるパーツに照準を合わせてクリックすると、ここに解説が表示されます。選択はみんなと共有されます。'
            }
          </JPText>
        </group>
      )}
    </group>
  )
}
