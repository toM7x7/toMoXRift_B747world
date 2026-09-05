import { Instance, Instances } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import { BackSide } from 'three'
import {
  BOARDING_DOOR_Z,
  COLORS,
  MAIN_DECK_FLOOR_Y,
  STAIR_BOTTOM_Z,
  STAIR_TOP_Z,
  STAIR_WIDTH,
  STAIR_X,
  UPPER_DECK_FLOOR_Y,
} from '../../constants'

const STAIR_RISE = UPPER_DECK_FLOOR_Y - MAIN_DECK_FLOOR_Y // 3.05
const STAIR_RUN = STAIR_TOP_Z - STAIR_BOTTOM_Z // 4.6
const STAIR_ANGLE = Math.atan(STAIR_RISE / STAIR_RUN)
const STAIR_MID_Z = (STAIR_BOTTOM_Z + STAIR_TOP_Z) / 2
const STAIR_MID_Y = (MAIN_DECK_FLOOR_Y + UPPER_DECK_FLOOR_Y) / 2
const STAIR_SLOPE_LEN = Math.sqrt(STAIR_RISE * STAIR_RISE + STAIR_RUN * STAIR_RUN)

// Cabin envelope: full width to FULL_AFT, then a narrowing zone to the
// rear pressure bulkhead at CABIN_AFT (matches the hull's two-stage taper)
const CABIN_AFT = -24
const FULL_AFT = -18

interface Seat {
  position: [number, number, number]
  color: string
}

function buildSeats(): Seat[] {
  const seats: Seat[] = []
  // First class (main deck nose, 2-2)
  const firstXs = [-1.6, -0.85, 0.85, 1.6]
  for (let z = 21.5; z <= 28.6; z += 1.75) {
    for (const x of firstXs) {
      seats.push({ position: [x, MAIN_DECK_FLOOR_Y, z], color: COLORS.seatFirst })
    }
  }
  // Economy (3-4-3)
  const ecoXs = [-2.75, -2.27, -1.79, -0.72, -0.24, 0.24, 0.72, 1.79, 2.27, 2.75]
  for (let z = 18.5; z >= FULL_AFT + 0.4; z -= 0.9) {
    if (z > 16.6 && z < 19.4) continue // boarding-door cross aisle
    if (z > -1.6 && z < 1.0) continue // mid-cabin galley
    for (const x of ecoXs) {
      seats.push({ position: [x, MAIN_DECK_FLOOR_Y, z], color: COLORS.seatEco })
    }
  }
  // Aft narrowing zone drops the window seats (2-4-2)
  const aftXs = [-2.27, -1.79, -0.72, -0.24, 0.24, 0.72, 1.79, 2.27]
  for (let z = FULL_AFT - 0.5; z >= CABIN_AFT + 1.2; z -= 0.9) {
    for (const x of aftXs) {
      seats.push({ position: [x, MAIN_DECK_FLOOR_Y, z], color: COLORS.seatEco })
    }
  }
  // Upper deck business (2-2)
  const bizXs = [-1.15, -0.55, 0.55, 1.15]
  for (let z = 8; z <= 23.1; z += 1.5) {
    for (const x of bizXs) {
      seats.push({ position: [x, UPPER_DECK_FLOOR_Y, z], color: COLORS.seatBiz })
    }
  }
  return seats
}

export function Interior() {
  const seats = useMemo(buildSeats, [])
  const stairSteps = useMemo(() => {
    const count = 16
    return Array.from({ length: count }, (_, i) => ({
      y: MAIN_DECK_FLOOR_Y + ((i + 1) * STAIR_RISE) / count - 0.025,
      z: STAIR_BOTTOM_Z + ((i + 0.5) * STAIR_RUN) / count,
    }))
  }, [])
  const interiorWindowZs = useMemo(() => {
    const list: number[] = []
    for (let z = -17; z <= 27; z += 1.05) {
      if (Math.abs(z - BOARDING_DOOR_Z) < 1.0 || Math.abs(z - 7) < 1.0 || Math.abs(z + 7) < 1.0) {
        continue
      }
      list.push(z)
    }
    return list
  }, [])

  return (
    <group>
      {/* ---- Main deck structure ---- */}
      <mesh position={[0, MAIN_DECK_FLOOR_Y - 0.13, 6]}>
        <boxGeometry args={[6.1, 0.26, 48]} />
        <meshStandardMaterial color={COLORS.cabinFloor} roughness={0.8} />
      </mesh>
      <mesh position={[0, MAIN_DECK_FLOOR_Y - 0.13, -21]}>
        <boxGeometry args={[4.7, 0.26, 6]} />
        <meshStandardMaterial color={COLORS.cabinFloor} roughness={0.8} />
      </mesh>
      <mesh position={[0, MAIN_DECK_FLOOR_Y + 0.005, 6.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.9, 47.6]} />
        <meshStandardMaterial color={COLORS.carpet} roughness={0.95} />
      </mesh>
      <mesh position={[0, MAIN_DECK_FLOOR_Y + 0.005, -21]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, 5.9]} />
        <meshStandardMaterial color={COLORS.carpet} roughness={0.95} />
      </mesh>
      {[1.25, -1.25].map((x) => (
        <mesh
          key={x}
          position={[x, MAIN_DECK_FLOOR_Y + 0.01, 6.2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.62, 47.4]} />
          <meshStandardMaterial color="#5b6f92" roughness={0.95} />
        </mesh>
      ))}

      {/* Cabin wall shell: full-width section + tapered tail section */}
      <mesh position={[0, 6.15, 6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3.09, 3.09, 48, 36, 1, true]} />
        <meshStandardMaterial color={COLORS.cabinWall} roughness={0.9} side={BackSide} />
      </mesh>
      <mesh position={[0, 6.3, -21]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3.05, 2.35, 6, 32, 1, true]} />
        <meshStandardMaterial color={COLORS.cabinWall} roughness={0.9} side={BackSide} />
      </mesh>
      {/* Bulkheads */}
      <mesh position={[0, 6.15, 30.05]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[3.0, 24]} />
        <meshStandardMaterial color={COLORS.cabinWall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.5, -23.95]}>
        <circleGeometry args={[2.4, 24]} />
        <meshStandardMaterial color={COLORS.cabinWall} roughness={0.9} />
      </mesh>

      {/* Overhead bins */}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[side * 1.95, 7.0, -1]}
          rotation={[0, 0, side * 0.28]}
        >
          <boxGeometry args={[1.15, 0.5, 38]} />
          <meshStandardMaterial color={COLORS.bin} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 7.35, -2]}>
        <boxGeometry args={[1.7, 0.55, 40]} />
        <meshStandardMaterial color={COLORS.bin} roughness={0.7} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[side * 1.5, 7.0, 25]}
          rotation={[0, 0, side * 0.25]}
        >
          <boxGeometry args={[1.0, 0.45, 8]} />
          <meshStandardMaterial color={COLORS.bin} roughness={0.7} />
        </mesh>
      ))}

      {/* Flat ceiling panels (hide the upper-deck floor underside).
          The strip over the right aisle stops short of the stairwell. */}
      <mesh position={[-0.9, 7.72, 3]}>
        <boxGeometry args={[2.6, 0.06, 53]} />
        <meshStandardMaterial color="#eef0f3" roughness={0.9} />
      </mesh>
      <mesh position={[1.3, 7.72, -11.45]}>
        <boxGeometry args={[1.8, 0.06, 24.1]} />
        <meshStandardMaterial color="#eef0f3" roughness={0.9} />
      </mesh>
      <mesh position={[1.3, 7.72, 17.75]}>
        <boxGeometry args={[1.8, 0.06, 23.5]} />
        <meshStandardMaterial color="#eef0f3" roughness={0.9} />
      </mesh>

      {/* Ceiling light strips */}
      {[0.95, -0.95].map((x) => (
        <mesh key={x} position={[x, 7.62, -1]}>
          <boxGeometry args={[0.25, 0.04, 50]} />
          <meshStandardMaterial
            color="#fffdf4"
            emissive="#fff4d6"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}

      {/* Interior window glow strips along the sidewalls */}
      <Instances limit={interiorWindowZs.length * 2} frustumCulled={false}>
        <planeGeometry args={[0.3, 0.42]} />
        <meshStandardMaterial
          color="#dff0ff"
          emissive={COLORS.windowGlow}
          emissiveIntensity={0.75}
        />
        {interiorWindowZs.map((z) =>
          [1, -1].map((side) => (
            <Instance
              key={`${z}-${side}`}
              position={[side * 2.98, 6.55, z]}
              rotation={[0, (-side * Math.PI) / 2, 0]}
            />
          )),
        )}
      </Instances>

      {/* Class divider partitions (navy, like the cabin photo) */}
      {[16.55, -1.55].map((z) => (
        <group key={z}>
          {[1, -1].map((side) => (
            <mesh key={side} position={[side * 2.0, 5.95, z]}>
              <boxGeometry args={[1.1, 1.4, 0.07]} />
              <meshStandardMaterial color="#3b5a8f" roughness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, 5.95, z]}>
            <boxGeometry args={[1.66, 1.4, 0.07]} />
            <meshStandardMaterial color="#3b5a8f" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Galleys and lavatories */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[side * 2.25, 5.85, -0.7]}>
            <boxGeometry args={[1.4, 1.5, 1.3]} />
            <meshStandardMaterial color="#cfd4d9" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[side * 1.55, 5.95, -23.1]}>
            <boxGeometry args={[1.3, 1.7, 1.3]} />
            <meshStandardMaterial color="#dadfe3" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Boarding door interior frame + dark opening */}
      <group>
        {[BOARDING_DOOR_Z - 0.75, BOARDING_DOOR_Z + 0.75].map((z) => (
          <mesh key={z} position={[3.0, 6.1, z]}>
            <boxGeometry args={[0.14, 2.05, 0.16]} />
            <meshStandardMaterial color="#9aa3ad" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[3.0, 7.18, BOARDING_DOOR_Z]}>
          <boxGeometry args={[0.14, 0.18, 1.66]} />
          <meshStandardMaterial color="#9aa3ad" roughness={0.5} />
        </mesh>
        <mesh position={[0, 6.18, BOARDING_DOOR_Z]}>
          <cylinderGeometry
            args={[3.06, 3.06, 1.98, 8, 1, true, Math.PI / 2 - 0.155, 0.31]}
          />
          <meshStandardMaterial color="#151b24" roughness={0.9} side={BackSide} />
        </mesh>
      </group>

      {/* ---- Seats (instanced) ---- */}
      <Instances limit={seats.length} frustumCulled={false}>
        <boxGeometry args={[0.46, 0.12, 0.46]} />
        <meshStandardMaterial roughness={0.75} />
        {seats.map((s, i) => (
          <Instance
            key={i}
            position={[s.position[0], s.position[1] + 0.42, s.position[2]]}
            color={s.color}
          />
        ))}
      </Instances>
      <Instances limit={seats.length} frustumCulled={false}>
        <boxGeometry args={[0.46, 0.62, 0.11]} />
        <meshStandardMaterial roughness={0.75} />
        {seats.map((s, i) => (
          <Instance
            key={i}
            position={[s.position[0], s.position[1] + 0.76, s.position[2] + 0.24]}
            rotation={[-0.12, 0, 0]}
            color={s.color}
          />
        ))}
      </Instances>
      <Instances limit={seats.length} frustumCulled={false}>
        <boxGeometry args={[0.4, 0.36, 0.4]} />
        <meshStandardMaterial color={COLORS.seatFrame} roughness={0.8} />
        {seats.map((s, i) => (
          <Instance
            key={i}
            position={[s.position[0], s.position[1] + 0.18, s.position[2]]}
          />
        ))}
      </Instances>
      {/* Headrests (light covers like the cabin photo) */}
      <Instances limit={seats.length} frustumCulled={false}>
        <boxGeometry args={[0.36, 0.17, 0.1]} />
        <meshStandardMaterial color="#c9d2da" roughness={0.8} />
        {seats.map((s, i) => (
          <Instance
            key={i}
            position={[s.position[0], s.position[1] + 1.13, s.position[2] + 0.27]}
            rotation={[-0.12, 0, 0]}
          />
        ))}
      </Instances>
      {/* Seat-back IFE screens (face the row behind) */}
      <Instances limit={seats.length} frustumCulled={false}>
        <planeGeometry args={[0.28, 0.2]} />
        <meshStandardMaterial
          color="#10151c"
          emissive="#27425e"
          emissiveIntensity={0.5}
          roughness={0.4}
        />
        {seats.map((s, i) => (
          <Instance
            key={i}
            position={[s.position[0], s.position[1] + 0.88, s.position[2] + 0.31]}
            rotation={[-0.12, Math.PI, 0]}
          />
        ))}
      </Instances>

      {/* ---- Upper deck (floor narrows aft with the fairing) ---- */}
      <mesh position={[0, UPPER_DECK_FLOOR_Y - 0.1, 17.5]}>
        <boxGeometry args={[3.2, 0.2, 19]} />
        <meshStandardMaterial color={COLORS.cabinFloor} roughness={0.8} />
      </mesh>
      <mesh position={[0, UPPER_DECK_FLOOR_Y - 0.1, 6.75]}>
        <boxGeometry args={[2.7, 0.2, 2.5]} />
        <meshStandardMaterial color={COLORS.cabinFloor} roughness={0.8} />
      </mesh>
      <mesh
        position={[0, UPPER_DECK_FLOOR_Y + 0.005, 17.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[3.0, 18.7]} />
        <meshStandardMaterial color={COLORS.carpet} roughness={0.95} />
      </mesh>
      <mesh
        position={[0, UPPER_DECK_FLOOR_Y + 0.005, 6.7]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[2.5, 2.4]} />
        <meshStandardMaterial color={COLORS.carpet} roughness={0.95} />
      </mesh>
      <mesh position={[0, 8.95, 18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.55, 1.55, 19, 28, 1, true]} />
        <meshStandardMaterial color={COLORS.cabinWall} roughness={0.9} side={BackSide} />
      </mesh>
      {/* Aft taper lining + end cap (the hump fairing closes down behind here) */}
      <mesh position={[0, 8.85, 6.75]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.55, 1.02, 2.5, 24, 1, true]} />
        <meshStandardMaterial color={COLORS.cabinWall} roughness={0.9} side={BackSide} />
      </mesh>
      <mesh position={[0, 8.85, 5.55]}>
        <circleGeometry args={[1.05, 20]} />
        <meshStandardMaterial color={COLORS.cabinWall} roughness={0.9} />
      </mesh>
      {[0.6, -0.6].map((x) => (
        <mesh key={x} position={[x, 9.9, 16]}>
          <boxGeometry args={[0.14, 0.04, 19]} />
          <meshStandardMaterial
            color="#fffdf4"
            emissive="#fff4d6"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}

      {/* ---- Staircase (straight, to the upper deck) ---- */}
      {stairSteps.map((s) => (
        <mesh key={s.z} position={[STAIR_X, s.y, s.z]}>
          <boxGeometry args={[STAIR_WIDTH, 0.05, 0.32]} />
          <meshStandardMaterial color="#7c8694" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh
            position={[STAIR_X + (side * STAIR_WIDTH) / 2, STAIR_MID_Y - 0.4, STAIR_MID_Z]}
            rotation={[-STAIR_ANGLE, 0, 0]}
          >
            <boxGeometry args={[0.06, 0.2, STAIR_SLOPE_LEN]} />
            <meshStandardMaterial color="#566070" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh
            position={[STAIR_X + (side * STAIR_WIDTH) / 2, STAIR_MID_Y + 0.92, STAIR_MID_Z]}
            rotation={[-STAIR_ANGLE, 0, 0]}
          >
            <boxGeometry args={[0.05, 0.06, STAIR_SLOPE_LEN]} />
            <meshStandardMaterial color="#aeb6c0" roughness={0.35} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ---- Cockpit (744 layout, beige interior like the reference photo) ---- */}
      <group>
        <mesh position={[0, UPPER_DECK_FLOOR_Y - 0.1, 28.9]}>
          <boxGeometry args={[2.8, 0.2, 3.6]} />
          <meshStandardMaterial color={COLORS.cabinFloor} roughness={0.8} />
        </mesh>
        {/* Curved interior lining (BackSide: visible only from inside) */}
        <mesh position={[0, 8.5, 28.9]} scale={[1.42, 1.25, 2.2]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshStandardMaterial color="#e8e4da" roughness={0.9} side={BackSide} />
        </mesh>
        {/* Ceiling slab over the cockpit: blocks the sky sightline above the
            nose lining. Sized to stay buried inside the slimmer hump loft. */}
        <mesh position={[0, 9.9, 28.05]}>
          <boxGeometry args={[2.2, 0.08, 2.3]} />
          <meshStandardMaterial color="#e3e7eb" roughness={0.85} />
        </mesh>
        {/* Rear bulkhead with an open doorway (kept inside the loft skin) */}
        {[1, -1].map((side) => (
          <mesh key={side} position={[side * 0.925, 9.275, 27.1]}>
            <boxGeometry args={[0.95, 2.25, 0.1]} />
            <meshStandardMaterial color="#d7dbe0" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 10.225, 27.1]}>
          <boxGeometry args={[0.92, 0.35, 0.1]} />
          <meshStandardMaterial color="#d7dbe0" roughness={0.8} />
        </mesh>
        {/* Instrument panel (narrowed to stay inside the slim nose loft) */}
        <mesh position={[0, 9.0, 29.55]}>
          <boxGeometry args={[2.2, 1.0, 0.45]} />
          <meshStandardMaterial color={COLORS.cockpitPanel} roughness={0.6} />
        </mesh>
        {/* 744 display layout: PFD+ND per pilot, stacked EICAS in the middle */}
        {[-0.95, -0.58, 0.58, 0.95].map((x) => (
          <mesh key={x} position={[x, 9.08, 29.31]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.3, 0.26]} />
            <meshStandardMaterial
              color="#0a0e12"
              emissive={Math.abs(x) > 0.8 ? '#3a6ea8' : COLORS.screenBlue}
              emissiveIntensity={0.85}
            />
          </mesh>
        ))}
        {[9.2, 8.9].map((y) => (
          <mesh key={y} position={[0, y, 29.31]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.28, 0.24]} />
            <meshStandardMaterial
              color="#0a0e12"
              emissive={COLORS.screenGreen}
              emissiveIntensity={0.85}
            />
          </mesh>
        ))}
        {/* Glareshield + mode control panel */}
        <mesh position={[0, 9.55, 29.45]}>
          <boxGeometry args={[2.2, 0.16, 0.5]} />
          <meshStandardMaterial color="#15181c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 9.5, 29.2]} rotation={[0.25, Math.PI, 0]}>
          <planeGeometry args={[1.5, 0.1]} />
          <meshStandardMaterial
            color="#1c2126"
            emissive="#9fb7d8"
            emissiveIntensity={0.35}
          />
        </mesh>
        {/* Overhead panel */}
        <mesh position={[0, 9.95, 28.7]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[1.3, 0.1, 1.0]} />
          <meshStandardMaterial color="#cfc8b8" roughness={0.7} />
        </mesh>
        {[-0.4, 0, 0.4].map((x) => (
          <mesh key={x} position={[x, 9.88, 28.95]} rotation={[0.32 - Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.28, 0.6]} />
            <meshStandardMaterial color="#8d8675" roughness={0.6} />
          </mesh>
        ))}
        {/* Center pedestal + thrust levers */}
        <mesh position={[0, 8.45, 29.1]}>
          <boxGeometry args={[0.55, 0.6, 1.0]} />
          <meshStandardMaterial color={COLORS.cockpitPanel} roughness={0.6} />
        </mesh>
        {[-0.135, -0.045, 0.045, 0.135].map((x) => (
          <mesh key={x} position={[x, 8.85, 29.0]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.05, 0.22, 0.05]} />
            <meshStandardMaterial color="#d8dadd" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
        {/* Yokes + sheepskin crew seats (beige, like the photo) */}
        {[0.62, -0.62].map((x) => (
          <group key={x}>
            <mesh position={[x, 8.55, 28.75]} rotation={[-0.25, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.5, 8]} />
              <meshStandardMaterial color="#2c3036" roughness={0.5} />
            </mesh>
            <mesh position={[x, 8.85, 28.7]}>
              <torusGeometry args={[0.16, 0.03, 8, 18]} />
              <meshStandardMaterial color="#2c3036" roughness={0.5} />
            </mesh>
            <mesh position={[x, 8.55, 28.2]}>
              <boxGeometry args={[0.5, 0.14, 0.5]} />
              <meshStandardMaterial color="#d8d2c0" roughness={0.85} />
            </mesh>
            <mesh position={[x, 8.95, 28.45]}>
              <boxGeometry args={[0.5, 0.7, 0.12]} />
              <meshStandardMaterial color="#d8d2c0" roughness={0.85} />
            </mesh>
          </group>
        ))}
        {[-0.66, 0, 0.66].map((x, i) => (
          <mesh
            key={x}
            position={[x, 9.4, 29.95 - Math.abs(i - 1) * 0.12]}
            rotation={[-0.5, (i - 1) * 0.45, 0]}
          >
            <planeGeometry args={[0.62, 0.46]} />
            <meshStandardMaterial
              color="#cfe8ff"
              emissive={COLORS.windowGlow}
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* ---- Interior lighting (over the aisles, clear of the bins) ---- */}
      <pointLight position={[1.25, 7.5, 18]} intensity={35} distance={12} decay={2} color="#fff2dc" />
      <pointLight position={[-1.25, 7.5, 6]} intensity={35} distance={12} decay={2} color="#fff2dc" />
      <pointLight position={[1.25, 7.5, -8]} intensity={35} distance={12} decay={2} color="#fff2dc" />
      <pointLight position={[-1.25, 7.5, -19]} intensity={35} distance={12} decay={2} color="#fff2dc" />
      <pointLight position={[0, 9.6, 16]} intensity={25} distance={10} decay={2} color="#fff2dc" />
      <pointLight position={[0, 9.4, 29]} intensity={20} distance={6} decay={2} color="#cfe4ff" />

      {/* ---- Colliders ---- */}
      <RigidBody type="fixed" colliders={false}>
        {/* floors */}
        <CuboidCollider args={[3.05, 0.13, 24]} position={[0, MAIN_DECK_FLOOR_Y - 0.13, 6]} />
        <CuboidCollider args={[2.35, 0.13, 3]} position={[0, MAIN_DECK_FLOOR_Y - 0.13, -21]} />
        <CuboidCollider args={[1.6, 0.1, 9.5]} position={[0, UPPER_DECK_FLOOR_Y - 0.1, 17.5]} />
        <CuboidCollider args={[1.35, 0.1, 1.25]} position={[0, UPPER_DECK_FLOOR_Y - 0.1, 6.75]} />
        <CuboidCollider args={[1.4, 0.1, 1.8]} position={[0, UPPER_DECK_FLOOR_Y - 0.1, 28.8]} />
        {/* stairs */}
        <CuboidCollider
          args={[STAIR_WIDTH / 2 + 0.1, 0.09, STAIR_SLOPE_LEN / 2 + 0.2]}
          position={[STAIR_X, STAIR_MID_Y - 0.06, STAIR_MID_Z]}
          rotation={[-STAIR_ANGLE, 0, 0]}
        />
        {[1, -1].map((side) => (
          <CuboidCollider
            key={side}
            args={[0.05, 0.5, STAIR_SLOPE_LEN / 2]}
            position={[STAIR_X + side * (STAIR_WIDTH / 2 + 0.08), STAIR_MID_Y + 0.55, STAIR_MID_Z]}
            rotation={[-STAIR_ANGLE, 0, 0]}
          />
        ))}
        {/* seat blocks (split at the mid-cabin galley cross-aisle).
            Slimmer than the seats so the aisles stay comfortably walkable. */}
        {[2.32, -2.32].map((x) => (
          <group key={x}>
            <CuboidCollider args={[0.68, 0.55, 8.1]} position={[x, 5.65, -9.7]} />
            <CuboidCollider args={[0.68, 0.55, 7.75]} position={[x, 5.65, 8.75]} />
          </group>
        ))}
        {[2.08, -2.08].map((x) => (
          <CuboidCollider key={x} args={[0.42, 0.55, 2.5]} position={[x, 5.65, -20.7]} />
        ))}
        <CuboidCollider args={[0.88, 0.55, 8.1]} position={[0, 5.65, -9.7]} />
        <CuboidCollider args={[0.88, 0.55, 2.5]} position={[0, 5.65, -20.7]} />
        <CuboidCollider args={[0.88, 0.55, 7.75]} position={[0, 5.65, 8.75]} />
        <CuboidCollider args={[0.58, 0.5, 4.1]} position={[1.26, 5.6, 25]} />
        <CuboidCollider args={[0.58, 0.5, 4.1]} position={[-1.26, 5.6, 25]} />
        <CuboidCollider args={[0.5, 0.5, 8.0]} position={[0.9, 8.65, 15.5]} />
        <CuboidCollider args={[0.5, 0.5, 8.0]} position={[-0.9, 8.65, 15.5]} />
        {/* main deck side walls (gap at the boarding door, port side) */}
        <CuboidCollider args={[0.12, 1.25, 17.55]} position={[3.07, 6.45, -0.45]} />
        <CuboidCollider args={[0.12, 1.25, 5.55]} position={[3.07, 6.45, 24.45]} />
        <CuboidCollider args={[0.12, 1.25, 24]} position={[-3.07, 6.45, 6]} />
        {/* tapered tail walls */}
        {[1, -1].map((side) => (
          <CuboidCollider
            key={side}
            args={[0.12, 1.25, 2.95]}
            position={[side * 2.62, 6.45, -20.85]}
            rotation={[0, -side * 0.114, 0]}
          />
        ))}
        {/* end caps */}
        <CuboidCollider args={[3.0, 1.4, 0.12]} position={[0, 6.5, 30.1]} />
        <CuboidCollider args={[2.4, 1.3, 0.12]} position={[0, 6.5, -23.8]} />
        {/* upper deck walls */}
        <CuboidCollider args={[0.1, 1.05, 10.75]} position={[1.52, 9.2, 16.25]} />
        <CuboidCollider args={[0.1, 1.05, 10.75]} position={[-1.52, 9.2, 16.25]} />
        <CuboidCollider args={[1.12, 1.05, 0.1]} position={[-0.62, 9.2, 5.55]} />
        {/* cockpit */}
        <CuboidCollider args={[0.1, 1.0, 1.7]} position={[1.4, 9.1, 28.7]} />
        <CuboidCollider args={[0.1, 1.0, 1.7]} position={[-1.4, 9.1, 28.7]} />
        <CuboidCollider args={[1.1, 0.5, 0.25]} position={[0, 8.8, 29.55]} />
        {/* galleys / lavatories */}
        <CuboidCollider args={[0.7, 0.75, 0.65]} position={[2.25, 5.85, -0.7]} />
        <CuboidCollider args={[0.7, 0.75, 0.65]} position={[-2.25, 5.85, -0.7]} />
        <CuboidCollider args={[0.65, 0.85, 0.65]} position={[1.55, 5.95, -23.1]} />
        <CuboidCollider args={[0.65, 0.85, 0.65]} position={[-1.55, 5.95, -23.1]} />
      </RigidBody>
    </group>
  )
}
