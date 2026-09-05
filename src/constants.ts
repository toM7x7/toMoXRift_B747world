// Boeing 747-400 real-world dimensions (meters)
// Aircraft sits on the apron, nose pointing +Z, port side +X.

export const WORLD_TITLE = 'B747 Jumbo Experience'

// The whole aircraft (plus gate & dimension markers) is rendered at 1.25x
// so visitors can appreciate the details; placards still quote real-world
// dimensions. Furniture (kiosk, boards, exhibit) stays at human scale.
export const WORLD_SCALE = 1.25

// --- Overall airframe ---
export const AIRCRAFT_LENGTH = 70.6
export const WINGSPAN = 64.4
export const TAIL_HEIGHT = 19.4

export const FUSELAGE_RADIUS = 3.25
export const FUSELAGE_CENTER_Y = 6.15
export const NOSE_TIP_Z = AIRCRAFT_LENGTH / 2 // +35.3
export const TAIL_END_Z = -AIRCRAFT_LENGTH / 2 // -35.3

// Fuselage profile stations (z positions, aircraft coords)
export const NOSE_TAPER_START_Z = 23.5 // constant section begins aft of here
export const TAIL_TAPER_START_Z = -14.5 // gentle tail blend begins here (cone from -24)
export const TAIL_UPSWEEP = 2.6 // how much the tail cone lifts at the end

// Upper deck hump
export const HUMP_CENTER_Z = 15.5
export const HUMP_HALF_LENGTH = 14.8
export const HUMP_CENTER_Y = 8.9
export const HUMP_RADIUS_X = 2.35
export const HUMP_RADIUS_Y = 2.5

// --- Decks (interior) ---
export const MAIN_DECK_FLOOR_Y = 5.1
export const UPPER_DECK_FLOOR_Y = 8.15
export const MAIN_DECK_FRONT_Z = 30.0
export const MAIN_DECK_AFT_Z = -24.0 // rear pressure bulkhead
export const CABIN_FULL_WIDTH_AFT_Z = -18.0 // cabin narrows aft of here
export const CABIN_HALF_WIDTH = 3.0
export const UPPER_DECK_FRONT_Z = 27.0 // cockpit bulkhead
export const UPPER_DECK_AFT_Z = 5.5
export const UPPER_DECK_HALF_WIDTH = 1.6
export const COCKPIT_PANEL_Z = 30.2

// Interior stairs (straight staircase, 747-400 style, rear of upper deck)
export const STAIR_BOTTOM_Z = 1.0
export const STAIR_TOP_Z = 5.6
export const STAIR_X = 1.1
export const STAIR_WIDTH = 1.0

// Boarding door used by the gate bridge (port side, door L2)
export const BOARDING_DOOR_Z = 18.0
export const BOARDING_DOOR_GAP = 1.4 // opening width along z

// --- Wings ---
export const WING_ROOT_LE_Z = 9.5
export const WING_ROOT_CHORD = 15.5
export const WING_TIP_X = WINGSPAN / 2 // 32.2
export const WING_SWEEP_TAN = 0.72 // ~36deg leading edge sweep
export const WING_TIP_CHORD = 4.0
export const WING_ROOT_Y = 4.9
export const WING_DIHEDRAL_TAN = 0.122 // ~7deg
export const WING_THICKNESS = 0.85

// --- Engines (CF6-80C2 class nacelles) ---
export const NACELLE_RADIUS = 1.5
export const NACELLE_LENGTH = 4.4
export const FAN_DIAMETER = 2.36
export const ENGINE_INBOARD_X = 11.7
export const ENGINE_OUTBOARD_X = 21.3

// --- Empennage ---
export const HSTAB_SPAN = 22.2
export const HSTAB_ROOT_Z = -27.5
export const HSTAB_ROOT_CHORD = 9.0
export const HSTAB_TIP_CHORD = 2.6
export const HSTAB_SWEEP_TAN = 0.7
export const HSTAB_Y = 6.7
export const VSTAB_BASE_Y = 8.4
export const VSTAB_TIP_Y = TAIL_HEIGHT
export const VSTAB_ROOT_Z = -24.0
export const VSTAB_ROOT_CHORD = 11.5
export const VSTAB_TIP_CHORD = 3.6
export const VSTAB_SWEEP_TAN = 0.85

// --- Landing gear ---
export const NOSE_GEAR_Z = 27.5
export const WING_GEAR_X = 5.2
export const WING_GEAR_Z = -1.5
export const BODY_GEAR_X = 1.9
export const BODY_GEAR_Z = -5.5
export const MAIN_WHEEL_RADIUS = 0.62
export const NOSE_WHEEL_RADIUS = 0.56

// --- World layout ---
export const APRON_SIZE = 320
export const WORLD_SPAWN_POINT: [number, number, number] = [36, 0.2, 42]
export const WORLD_SPAWN_YAW = 140
export const DEV_SPAWN_POSITION: [number, number, number] = [36, 1.7, 42]
export const DEV_LOOK_TARGET: [number, number, number] = [0, 10, 6]

// Gate / boarding bridge (port side = +X)
export const GATE_TOWER_X = 13.5
export const GATE_TOWER_Z = 22.0
export const GATE_PLATFORM_Y = MAIN_DECK_FLOOR_Y

// Engine exhibit stand
export const EXHIBIT_POS: [number, number, number] = [26, 0, 12]
export const EXHIBIT_AXIS_Y = 2.1

// Observation kiosk (teleport + info board + exploded toggle)
export const KIOSK_POS: [number, number, number] = [24, 0, 26]

// Instance-state keys
export const STATE_SELECTED_PART = 'b747-selected-part'
export const STATE_EXPLODED = 'b747-exploded'
export const STATE_ENGINE_EXPLODED = 'b747-engine-exploded'

export const COLORS = {
  sky: 0x7ec3ee,
  skyBottom: 0xeef6fb,
  apron: '#8f9398',
  apronLine: '#e8c83c',
  apronRed: '#c4453a',
  fuselage: '#f4f6f8',
  belly: '#c0c7cf',
  cheatline: '#1c4f9c',
  wing: '#cfd5db',
  wingEdge: '#9aa3ad',
  controlSurface: '#aab3bd',
  slat: '#b8c0c9',
  engineCowl: '#dde2e7',
  engineLip: '#3a4754',
  pylon: '#b9c0c8',
  tire: '#23262a',
  strut: '#9aa0a8',
  metal: '#7f8893',
  cabinFloor: '#5b6470',
  carpet: '#46546b',
  seatEco: '#2f5fa3',
  seatBiz: '#7a2f3c',
  seatFirst: '#3d4a3a',
  seatFrame: '#33373d',
  bin: '#e9edf1',
  cabinWall: '#f0f2f4',
  windowGlow: '#bfe3ff',
  cockpitPanel: '#22262b',
  screenGreen: '#3adb76',
  screenBlue: '#58b6ff',
  gateSteel: '#5d6873',
  gateGlass: '#9fd2e8',
  gateFloor: '#4c545c',
  signNavy: '#11294d',
  signText: '#ffffff',
  highlight: '#ffb53a',
  boardBg: '#101c30',
  buttonIdle: '#1f3a66',
  buttonActive: '#2e9e5b',
  labelBg: '#0d1626',
} as const
