import { JPText } from '../JPText'
import { useFrame } from '@react-three/fiber'
import { Interactable } from '@xrift/world-components'
import { useMemo, useRef } from 'react'
import { DoubleSide, ExtrudeGeometry, Shape } from 'three'
import type { Group } from 'three'
import { COLORS } from '../../constants'

const HSTAB_DIHEDRAL = 0.087

function makeHStabGeometry(side: number) {
  const shape = new Shape()
  const pts: Array<[number, number]> = [
    [0.8, -25.5],
    [11.1, -32.7],
    [11.1, -35.3],
    [0.8, -34.5],
  ]
  shape.moveTo(side * pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) shape.lineTo(side * pts[i][0], pts[i][1])
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.22,
    bevelSegments: 2,
  })
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, 0.1, 0)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const ax = Math.abs(position.getX(i))
    if (ax > 0.8) {
      position.setY(i, position.getY(i) + (ax - 0.8) * HSTAB_DIHEDRAL)
    }
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function makeVStabGeometry() {
  // Shape x = aircraft z, shape y = aircraft y; extrude -> aircraft x
  const shape = new Shape()
  shape.moveTo(-22.5, 8.4)
  shape.lineTo(-31.85, 19.4)
  shape.lineTo(-35.4, 19.4)
  shape.lineTo(-33.6, 8.4)
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.3,
    bevelSegments: 2,
  })
  geometry.rotateY(-Math.PI / 2) // shape x -> world z, extrude -> world x
  geometry.translate(0.2, 0, 0)
  geometry.computeVertexNormals()
  return geometry
}

export interface EmpennageProps {
  explodeProgress: { current: number }
  onSelectPart: (id: string) => void
}

export function Empennage({ explodeProgress, onSelectPart }: EmpennageProps) {
  const vstabRef = useRef<Group>(null)
  const hstabPortRef = useRef<Group>(null)
  const hstabStbdRef = useRef<Group>(null)

  const hstabPortGeometry = useMemo(() => makeHStabGeometry(1), [])
  const hstabStbdGeometry = useMemo(() => makeHStabGeometry(-1), [])
  const vstabGeometry = useMemo(() => makeVStabGeometry(), [])

  useFrame(() => {
    const k = explodeProgress.current
    if (vstabRef.current) {
      vstabRef.current.position.y = 5 * k
      vstabRef.current.position.z = -2.5 * k
    }
    if (hstabPortRef.current) {
      hstabPortRef.current.position.x = 5 * k
      hstabPortRef.current.position.z = -3 * k
    }
    if (hstabStbdRef.current) {
      hstabStbdRef.current.position.x = -5 * k
      hstabStbdRef.current.position.z = -3 * k
    }
  })

  const elevator = (side: number) => (
    <mesh
      position={[side * 5.9, 7.44, -35.35]}
      rotation={[0, side * 0.0775, 0]}
      castShadow
    >
      <boxGeometry args={[9.6, 0.12, 1.1]} />
      <meshStandardMaterial color={COLORS.controlSurface} roughness={0.45} metalness={0.3} />
    </mesh>
  )

  return (
    <group>
      {/* Horizontal stabilizers + elevators */}
      <group ref={hstabPortRef}>
        <Interactable
          id="part-hstab"
          onInteract={() => onSelectPart('hstab')}
          interactionText="水平尾翼"
        >
          <group>
            <mesh geometry={hstabPortGeometry} position={[0, 7.0, 0]} castShadow>
              <meshStandardMaterial
                color={COLORS.wing}
                roughness={0.4}
                metalness={0.3}
                side={DoubleSide}
              />
            </mesh>
            {elevator(1)}
          </group>
        </Interactable>
      </group>
      <group ref={hstabStbdRef}>
        <mesh geometry={hstabStbdGeometry} position={[0, 7.0, 0]} castShadow>
          <meshStandardMaterial
            color={COLORS.wing}
            roughness={0.4}
            metalness={0.3}
            side={DoubleSide}
          />
        </mesh>
        {elevator(-1)}
      </group>

      {/* Vertical stabilizer + rudder + tail logo */}
      <group ref={vstabRef}>
        <Interactable
          id="part-vstab"
          onInteract={() => onSelectPart('vstab')}
          interactionText="垂直尾翼"
        >
          <group>
            <mesh geometry={vstabGeometry} castShadow>
              <meshStandardMaterial
                color={COLORS.fuselage}
                roughness={0.38}
                metalness={0.2}
                side={DoubleSide}
              />
            </mesh>
            <mesh position={[0, 13.8, -34.6]} rotation={[-0.162, 0, 0]} castShadow>
              <boxGeometry args={[0.22, 10.6, 1.7]} />
              <meshStandardMaterial
                color={COLORS.controlSurface}
                roughness={0.45}
                metalness={0.3}
              />
            </mesh>
          </group>
        </Interactable>
        {[1, -1].map((side) => (
          <JPText
            key={side}
            position={[side * 0.48, 14.6, -28.8]}
            rotation={[0, (side * Math.PI) / 2, 0]}
            fontSize={3.6}
            color="#16386e"
            anchorX="center"
            anchorY="middle"
          >
            XR
          </JPText>
        ))}
      </group>
    </group>
  )
}
