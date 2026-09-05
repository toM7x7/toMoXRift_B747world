import { JPText } from './JPText'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Skybox } from '@xrift/world-components'
import {
  AIRCRAFT_LENGTH,
  APRON_SIZE,
  COLORS,
  TAIL_HEIGHT,
  WINGSPAN,
} from '../constants'
import { FloatingLabel } from './FloatingLabel'

function GroundLine({
  position,
  size,
  color = COLORS.apronLine,
}: {
  position: [number, number, number]
  size: [number, number]
  color?: string
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

// Aircraft-relative apron paint + dimension markers. Rendered inside the
// aircraft scale group so the lines always match the airframe footprint;
// the placards quote the real-world dimensions being depicted.
export function ApronMarkings() {
  return (
    <group>
      {/* Taxi lead-in line + stop bar */}
      <GroundLine position={[0, 0.015, 75]} size={[0.35, 90]} />
      <GroundLine position={[0, 0.015, 29]} size={[3.2, 0.35]} />

      {/* Clearance box around the aircraft */}
      <GroundLine position={[0, 0.013, 44]} size={[76, 0.25]} color={COLORS.apronRed} />
      <GroundLine position={[0, 0.013, -44]} size={[76, 0.25]} color={COLORS.apronRed} />
      <GroundLine position={[38, 0.013, 0]} size={[0.25, 88]} color={COLORS.apronRed} />
      <GroundLine position={[-38, 0.013, 0]} size={[0.25, 88]} color={COLORS.apronRed} />

      {/* Spot number painted on the apron */}
      <JPText
        position={[18, 0.02, 38]}
        rotation={[-Math.PI / 2, 0, 0.5]}
        fontSize={4.5}
        color="#e9ecef"
        anchorX="center"
        anchorY="middle"
      >
        SPOT 747
      </JPText>

      {/* ---- Dimension markers ---- */}
      {/* Wingspan */}
      <GroundLine position={[0, 0.014, -48]} size={[WINGSPAN, 0.16]} color="#f1f4f7" />
      <GroundLine position={[-WINGSPAN / 2, 0.014, -48]} size={[0.16, 1.8]} color="#f1f4f7" />
      <GroundLine position={[WINGSPAN / 2, 0.014, -48]} size={[0.16, 1.8]} color="#f1f4f7" />
      <FloatingLabel text="全幅 64.4 m" position={[0, 1.7, -48]} fontSize={0.7} />

      {/* Length */}
      <GroundLine position={[-40, 0.014, 0]} size={[0.16, AIRCRAFT_LENGTH]} color="#f1f4f7" />
      <GroundLine position={[-40, 0.014, AIRCRAFT_LENGTH / 2]} size={[1.8, 0.16]} color="#f1f4f7" />
      <GroundLine position={[-40, 0.014, -AIRCRAFT_LENGTH / 2]} size={[1.8, 0.16]} color="#f1f4f7" />
      <FloatingLabel text="全長 70.6 m" position={[-40, 1.7, 0]} fontSize={0.7} />

      {/* Height pole near the tail */}
      <mesh position={[-9, TAIL_HEIGHT / 2, -33]}>
        <boxGeometry args={[0.09, TAIL_HEIGHT, 0.09]} />
        <meshStandardMaterial color="#f1f4f7" roughness={0.6} />
      </mesh>
      {[0, 5, 10, 15, TAIL_HEIGHT].map((h) => (
        <mesh key={h} position={[-9, h === 0 ? 0.05 : h, -33]}>
          <boxGeometry args={[0.6, 0.07, 0.07]} />
          <meshStandardMaterial color="#f1f4f7" roughness={0.6} />
        </mesh>
      ))}
      <FloatingLabel text="全高 19.4 m" position={[-9, TAIL_HEIGHT + 1.2, -33]} fontSize={0.7} />
    </group>
  )
}

export function Environment({ exhibitionGround = true }: { exhibitionGround?: boolean }) {
  return (
    <group>
      <group position={[300, 0, 0]} scale={10}><Skybox topColor={COLORS.sky} bottomColor={COLORS.skyBottom} /></group>

      {/* Lighting */}
      <ambientLight intensity={0.42} />
      <hemisphereLight intensity={0.55} color="#dfeeff" groundColor="#8d9298" />
      <directionalLight
        position={[60, 80, 35]}
        intensity={2.1}
        color="#fff6e8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={300}
        shadow-camera-left={-115}
        shadow-camera-right={115}
        shadow-camera-top={115}
        shadow-camera-bottom={-115}
      />
      <directionalLight position={[-45, 30, -55]} intensity={0.45} color="#cfe0f2" />

      {exhibitionGround && <>
      {/* Apron (frustumCulled off: huge ground plane must never be culled) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow frustumCulled={false}>
        <planeGeometry args={[APRON_SIZE, APRON_SIZE]} />
        <meshStandardMaterial color={COLORS.apron} roughness={0.95} />
      </mesh>

      {/* Ground collider */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[APRON_SIZE / 2, 0.5, APRON_SIZE / 2]} position={[0, -0.5, 0]} />
      </RigidBody>
      <mesh position={[300, -0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow frustumCulled={false}><planeGeometry args={[1040, 600]} /><meshStandardMaterial color={COLORS.apron} roughness={0.95} /></mesh>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[520, 0.5, 300]} position={[300, -0.63, 0]} /></RigidBody>
      </>}
    </group>
  )
}
