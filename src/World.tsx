import { useState } from 'react'
import { ExhibitionNavigation, ImportedExhibits, EXHIBITION_SPAWN } from './components/Exhibition'
import type { ExhibitionMode } from './components/Exhibition'
import { JPText } from './components/JPText'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import {
  Interactable,
  SpawnPoint,
  useInstanceState,
  useTeleport,
} from '@xrift/world-components'
import { B747 } from './components/B747'
import { BoardingGate } from './components/BoardingGate'
import { EngineExhibit } from './components/EngineExhibit'
import { ApronMarkings, Environment } from './components/Environment'
import { InfoBoard } from './components/InfoBoard'
import { ObservationKiosk } from './components/ObservationKiosk'
import {
  BODY_GEAR_X,
  BODY_GEAR_Z,
  BOARDING_DOOR_Z,
  COLORS,
  NOSE_GEAR_Z,
  STATE_ENGINE_EXPLODED,
  STATE_EXPLODED,
  STATE_SELECTED_PART,
  WING_GEAR_X,
  WING_GEAR_Z,
  WORLD_SCALE,
  WORLD_SPAWN_POINT,
  WORLD_SPAWN_YAW,
} from './constants'

// Small wall-mounted button inside the cabin that returns players to the apron
function DeboardButton() {
  const { teleport } = useTeleport()
  return (
    <group position={[2.55, 6.25, BOARDING_DOOR_Z + 1.6]} rotation={[0, -Math.PI / 2, 0]}>
      <Interactable
        id="deboard-button"
        onInteract={() =>
          teleport({ position: WORLD_SPAWN_POINT, yaw: WORLD_SPAWN_YAW })
        }
        interactionText="地上へ降りる"
      >
        <mesh>
          <boxGeometry args={[0.9, 0.5, 0.08]} />
          <meshStandardMaterial
            color={COLORS.buttonIdle}
            emissive={COLORS.buttonIdle}
            emissiveIntensity={0.45}
            roughness={0.4}
          />
        </mesh>
      </Interactable>
      <JPText
        position={[0, 0, 0.06]}
        fontSize={0.11}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        地上へ降りる
      </JPText>
    </group>
  )
}

export interface WorldProps {
  position?: [number, number, number]
  scale?: number
}

// Dev-only screenshot helpers (?exploded=1 / ?engine=1)
const DEV_FLAGS = import.meta.env.DEV
  ? new URLSearchParams(window.location.search)
  : null

export function World({ position = [0, 0, 0], scale = 1 }: WorldProps) {
  const initialMode = DEV_FLAGS?.get('exhibit')
  const [mode, setMode] = useState<ExhibitionMode>(initialMode === 'sol' || initialMode === 'astra' || initialMode === 'flight' ? initialMode : 'compare')
  const [animated, setAnimated] = useState(false)
  const [selectedPart, setSelectedPart] = useInstanceState<string | null>(
    STATE_SELECTED_PART,
    null,
  )
  const [exploded, setExploded] = useInstanceState<boolean>(
    STATE_EXPLODED,
    DEV_FLAGS?.get('exploded') === '1',
  )
  const [engineExploded, setEngineExploded] = useInstanceState<boolean>(
    STATE_ENGINE_EXPLODED,
    DEV_FLAGS?.get('engine') === '1',
  )

  return (
    <group position={position} scale={scale}>
      <fog attach="fog" args={['#dcebf5', 1400, 5000]} />

      <Environment exhibitionGround={mode === 'compare'} />

      {/* Dev builds show the spawn gizmo; production strips it automatically.
          Skipped when a ?cam= override is set, because the registered spawn
          would otherwise win over DevEnvironment's spawnPosition. */}
      {DEV_FLAGS?.has('cam') ? null : (
        <SpawnPoint position={EXHIBITION_SPAWN} yaw={0} />
      )}

      {mode === 'compare' && <>
      {/* Aircraft, gate and aircraft-relative markings at exhibition scale.
          react-three-rapier bakes the world scale into collider args. */}
      <group scale={WORLD_SCALE}>
        <B747 exploded={exploded} selectedPart={selectedPart} onSelectPart={setSelectedPart} />
        <BoardingGate />
        <DeboardButton />
        <ApronMarkings />

        {/* Wheel-cluster colliders so players cannot walk through the landing gear */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.6, 1.0, 1.0]} position={[0, 1.0, NOSE_GEAR_Z]} />
          {[WING_GEAR_X, -WING_GEAR_X].map((x) => (
            <CuboidCollider key={x} args={[0.75, 1.05, 1.55]} position={[x, 1.05, WING_GEAR_Z]} />
          ))}
          {[BODY_GEAR_X, -BODY_GEAR_X].map((x) => (
            <CuboidCollider key={x} args={[0.75, 1.05, 1.55]} position={[x, 1.05, BODY_GEAR_Z]} />
          ))}
        </RigidBody>
      </group>

      <EngineExhibit
        exploded={engineExploded}
        onToggle={() => setEngineExploded((prev) => !prev)}
      />

      <ObservationKiosk
        exploded={exploded}
        onToggleExploded={() => setExploded((prev) => !prev)}
      />

      <InfoBoard
        selectedPartId={selectedPart}
        position={[28.5, 0, 17]}
        rotationY={Math.atan2(WORLD_SPAWN_POINT[0] - 28.5, WORLD_SPAWN_POINT[2] - 17)}
      />
      </>}
      <ImportedExhibits mode={mode} animated={animated} />
      <ExhibitionNavigation mode={mode} setMode={setMode} animated={animated} setAnimated={setAnimated} />
    </group>
  )
}
