import { useRapier } from '@react-three/rapier'
import type { PropsWithChildren } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DevEnvironment, XRiftProvider, TeleportProvider } from '@xrift/world-components'
import type { CameraConfig, PhysicsConfig, TeleportDestination } from '@xrift/world-components'
import { StrictMode, useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { createRoot } from 'react-dom/client'
import { World } from './World'
import { EXHIBITION_LOOK, EXHIBITION_SPAWN } from './components/Exhibition'
import xriftConfig from '../xrift.json'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const worldConfig = (
  xriftConfig as {
    world?: {
      physics?: PhysicsConfig
      camera?: CameraConfig
    }
  }
).world

const physicsConfig: PhysicsConfig | undefined = worldConfig?.physics
const cameraConfig: CameraConfig | undefined = worldConfig?.camera

// Optional camera override for screenshots: ?cam=x,y,z&look=x,y,z
const params = new URLSearchParams(window.location.search)
const parseVec = (value: string | null): [number, number, number] | null => {
  if (!value) return null
  const parts = value.split(',').map(Number)
  return parts.length === 3 && parts.every(Number.isFinite)
    ? (parts as [number, number, number])
    : null
}
const camOverride = parseVec(params.get('cam'))
const lookOverride = parseVec(params.get('look'))

const SPAWN_POSITION = camOverride ?? [EXHIBITION_SPAWN[0], 1.7, EXHIBITION_SPAWN[2]] as [number, number, number]
const LOOK_TARGET = new Vector3(...(lookOverride ?? EXHIBITION_LOOK))

// The SDK default teleport only logs. Connect the single dev player body.
function PreviewTeleport({ children }: PropsWithChildren) {
  const { world } = useRapier()
  const { camera } = useThree()
  const value = useMemo(() => ({ teleport: ({ position, yaw }: TeleportDestination) => {
    world.forEachRigidBody((body) => {
      if (!body.isDynamic()) return
      body.setTranslation({ x: position[0], y: position[1] + 0.8, z: position[2] }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    })
    if (yaw !== undefined) camera.rotation.set(0, yaw * Math.PI / 180, 0)
  } }), [world, camera])
  return <TeleportProvider value={value}>{children}</TeleportProvider>
}

// Local preview diagnostics; dev.tsx is never exposed in the world bundle.
function PreviewDiagnostics() {
  const state = useThree()
  useEffect(() => {
    Object.defineProperty(window, '__b747Preview', { configurable: true, value: state })
    return () => { Reflect.deleteProperty(window, '__b747Preview') }
  }, [state])
  return null
}

function DevCameraBootstrap() {
  const { camera } = useThree()
  const framesRef = useRef(0)

  useFrame(() => {
    if (framesRef.current > 6) {
      return
    }

    camera.lookAt(LOOK_TARGET)
    framesRef.current += 1
  })

  return null
}

// With an explicit ?cam= override, take over rendering (priority > 0) so
// the screenshot camera is pinned regardless of the dev player physics.
function DevCameraPin() {
  useFrame((state) => {
    if (!camOverride) return
    state.camera.position.set(camOverride[0], camOverride[1], camOverride[2])
    state.camera.lookAt(LOOK_TARGET)
    state.gl.render(state.scene, state.camera)
  }, 1)

  return null
}

createRoot(rootElement).render(
  <StrictMode>
    <XRiftProvider baseUrl="/">
      <DevEnvironment
        physicsConfig={physicsConfig}
        camera={cameraConfig}
        spawnPosition={SPAWN_POSITION}
      >
        <PreviewDiagnostics />
        <DevCameraBootstrap />
        {camOverride ? <DevCameraPin /> : null}
        <PreviewTeleport><World /></PreviewTeleport>
      </DevEnvironment>
    </XRiftProvider>
  </StrictMode>,
)
