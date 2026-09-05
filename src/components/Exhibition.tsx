import { Suspense, useEffect, useMemo } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody, TrimeshCollider } from '@react-three/rapier'
import { Interactable, useTeleport, useXRift } from '@xrift/world-components'
import { Mesh } from 'three'
import { JPText } from './JPText'

export type ExhibitionMode = 'compare' | 'sol' | 'astra' | 'flight'
export const EXHIBITION_SPAWN: [number, number, number] = [300, 0.25, 183]
export const EXHIBITION_LOOK: [number, number, number] = [300, 10, 0]
export const BAYS = [
  { id: 'claude', x: 0, title: 'Claude / Fable', note: '機体・搭乗ゲート 1.25倍 ／ 既存の操作・分解展示', color: '#ffbf7a' },
  { id: 'sol', x: 300, title: 'GPT-5.6 Sol', note: '元シーンの縮尺 ／ 空港・客室・貨物室・エンジン展示（色の変換補正あり）', color: '#80dfc3' },
  { id: 'astra', x: 600, title: 'GPT-6 Astra', note: '元シーンの縮尺 ／ 空港ミュージアム・車両・飛行デモ', color: '#a8bdff' },
] as const

function Asset({ path, animated = false }: { path: string; animated?: boolean }) {
  const { baseUrl } = useXRift()
  const gltf = useGLTF(`${baseUrl}${path}`)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const { actions } = useAnimations(gltf.animations, scene)
  useEffect(() => {
    if (animated) Object.values(actions).forEach((action) => action?.reset().play())
    return () => { Object.values(actions).forEach((action) => action?.stop()) }
  }, [actions, animated])
  return <primitive object={scene} dispose={null} />
}

function WalkableAsset({ path }: { path: string }) {
  const { baseUrl } = useXRift()
  const gltf = useGLTF(`${baseUrl}${path}`)
  const meshes = useMemo(() => {
    gltf.scene.updateMatrixWorld(true)
    const result: { vertices: Float32Array; indices: Uint32Array }[] = []
    gltf.scene.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld)
      const positions = geometry.getAttribute('position')
      result.push({
        vertices: Float32Array.from(positions.array),
        indices: geometry.index ? Uint32Array.from(geometry.index.array) : Uint32Array.from({ length: positions.count }, (_, i) => i),
      })
      geometry.dispose()
    })
    return result
  }, [gltf.scene])
  return <RigidBody type="fixed" colliders={false}>{meshes.map((mesh, i) => <TrimeshCollider key={i} args={[mesh.vertices, mesh.indices]} />)}</RigidBody>
}

export function ImportedExhibits({ mode, animated }: { mode: ExhibitionMode; animated: boolean }) {
  return <>
    {(mode === 'compare' || mode === 'sol') && <group position={[300, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <Suspense fallback={<JPText position={[0, 12, 0]} fontSize={1.5}>Sol 展示を読み込み中</JPText>}>
        <Asset path="sol-main.glb" animated={animated} />
        <WalkableAsset path="sol-collision.glb" />
        {mode === 'sol' && <Asset path="sol-background.glb" />}
      </Suspense>
    </group>}
    {(mode === 'compare' || mode === 'astra') && <group position={[600, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <Suspense fallback={<JPText position={[0, 12, 0]} fontSize={1.5}>Astra 展示を読み込み中</JPText>}>
        <Asset path="astra-main.glb" animated={animated} />
        <WalkableAsset path="astra-collision.glb" />
        {mode === 'astra' && <Asset path="astra-background.glb" />}
      </Suspense>
    </group>}
    {mode === 'flight' && <group position={[600, 0, 0]}>
      <Suspense fallback={null}><Asset path="astra-flight.glb" animated={animated} /></Suspense>
    </group>}
  </>
}

function Button({ id, label, x, onClick, active = false }: { id: string; label: string; x: number; onClick: () => void; active?: boolean }) {
  return <group position={[x, 1.25, 0.22]}>
    <Interactable id={id} onInteract={onClick} interactionText={label}>
      <mesh><boxGeometry args={[2.5, 0.65, 0.2]} /><meshStandardMaterial color={active ? '#327e6b' : '#244365'} /></mesh>
    </Interactable>
    <JPText position={[0, 0, 0.12]} fontSize={0.17} maxWidth={2.35} anchorX="center" anchorY="middle" color="#ffffff">{label}</JPText>
  </group>
}

export function ExhibitionNavigation({ mode, setMode, animated, setAnimated }: {
  mode: ExhibitionMode; setMode: (mode: ExhibitionMode) => void; animated: boolean; setAnimated: (value: boolean) => void
}) {
  const { teleport } = useTeleport()
  const changeMode = (next: ExhibitionMode, x: number) => {
    setMode(next)
    if (next === 'flight') setAnimated(true)
    teleport({ position: next === 'flight' ? [600, 90.3, 114.8] : [x + 20, 0.3, 165], yaw: 0 })
  }
  return <>
    {BAYS.map((bay) => <group key={bay.id} position={[bay.x + 20, 0.5, 155]} scale={0.6}>
      <mesh position={[0, 5, -0.35]}><boxGeometry args={[23, 10, 0.5]} /><meshStandardMaterial color="#111e30" roughness={0.8} /></mesh>
      <JPText position={[0, 8.1, 0]} fontSize={1.55} anchorX="center" color={bay.color}>{bay.title}</JPText>
      <JPText position={[0, 6, 0]} fontSize={0.48} maxWidth={21} textAlign="center" anchorX="center" color="#ffffff">{bay.note}</JPText>
      <JPText position={[0, 4.8, 0]} fontSize={0.34} maxWidth={21} textAlign="center" anchorX="center" color="#b2c6da">{mode === 'compare' ? '横並び比較：機体・内装・周辺設備を収録。遠景は原作全景で表示。' : mode === 'flight' ? 'Astra 飛行デモ：元シーンの地形と飛行アニメーション' : '原作全景：遠景を含む単独展示。照明・空はXRift共通環境。'}</JPText>
      <JPText position={[0, 3.8, 0]} fontSize={0.3} maxWidth={21} textAlign="center" anchorX="center" color="#b2c6da">制作条件が異なる作品比較です。Blender固有の操作・シェーダーは完全移植ではありません。</JPText>
      <group position={[0, 1.2, 0]}>
        {BAYS.map((target, i) => <Button key={target.id} id={`gallery-${bay.id}-${target.id}`} label={target.title} x={(i - 1) * 2.8} onClick={() => changeMode('compare', target.x)} />)}
      </group>
      {bay.id !== 'claude' && <group position={[0, -0.85, 0]}>
        <Button id={`gallery-${bay.id}-cabin`} label="1階客室へ" x={-2.8} onClick={() => { setMode('compare'); teleport({ position: bay.id === 'sol' ? [300, 5.6, 0] : [600, 5.6, 7.65], yaw: 0 }) }} />
        <Button id={`gallery-${bay.id}-upper`} label="2階客室へ" x={0} onClick={() => { setMode('compare'); teleport({ position: bay.id === 'sol' ? [300, 8.35, 12] : [600, 8.35, 13.78], yaw: 0 }) }} />
        <Button id={`gallery-${bay.id}-cockpit`} label="操縦席へ" x={2.8} onClick={() => { setMode('compare'); teleport({ position: bay.id === 'sol' ? [300, 8.35, 27] : [599.98, 8.35, 26.95], yaw: 0 }) }} />
      </group>}
      <Button id={`gallery-${bay.id}-compare`} label="横並び比較" x={-8.4} active={mode === 'compare'} onClick={() => changeMode('compare', bay.x)} />
      <Button id={`gallery-${bay.id}-sol-full`} label="Sol 原作全景" x={-5.6} active={mode === 'sol'} onClick={() => changeMode('sol', 300)} />
      <Button id={`gallery-${bay.id}-astra-full`} label="Astra 原作全景" x={-2.8} active={mode === 'astra'} onClick={() => changeMode('astra', 600)} />
      <Button id={`gallery-${bay.id}-flight`} label="Astra 飛行デモ" x={0} active={mode === 'flight'} onClick={() => changeMode('flight', 600)} />
      <Button id={`gallery-${bay.id}-animation`} label={animated ? '動きを停止' : '動きを再生'} x={2.8} active={animated} onClick={() => setAnimated(!animated)} />
      <Button id={`gallery-${bay.id}-near`} label="機体を近くで見る" x={5.6} onClick={() => { setMode('compare'); teleport({ position: [bay.x + 35, 0.3, 50], yaw: 35 }) }} />
      <Button id={`gallery-${bay.id}-overview`} label="全体を見渡す" x={8.4} onClick={() => { setMode('compare'); teleport({ position: [300, 35.3, 240], yaw: 0 }) }} />
    </group>)}
    {mode === 'flight' && <group position={[600, 90, 120]}>
      <mesh position={[0, -0.15, 0]}><boxGeometry args={[20, 0.3, 12]} /><meshStandardMaterial color="#34475a" /></mesh>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[10, 0.15, 6]} position={[0, -0.15, 0]} /></RigidBody>
      <group position={[0, 0, -3]}>
        <Button id="flight-return" label="横並び比較へ戻る" x={-2} onClick={() => changeMode('compare', 600)} />
        <Button id="flight-play" label={animated ? '飛行を停止' : '飛行を再生'} x={2} active={animated} onClick={() => setAnimated(!animated)} />
      </group>
      <JPText position={[0, 3, -3]} fontSize={0.4} anchorX="center">Astra 飛行デモ ／ 鑑賞デッキ</JPText>
    </group>}
    {[{ x: 300, start: 110 }, { x: 600, start: 60 }].map(({ x, start }) => <group key={x}>
      <mesh position={[x + 20, -0.1, (start + 156) / 2]} receiveShadow><boxGeometry args={[12, 0.2, 156 - start]} /><meshStandardMaterial color="#34475a" /></mesh>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[6, 0.1, (156 - start) / 2]} position={[x + 20, -0.1, (start + 156) / 2]} /></RigidBody>
    </group>)}
    {/* Interior return buttons sit at the same safe aisle coordinates as the arrival points. */}
    {mode === 'compare' && [{ x: 300, y: 5.6, z: 0 }, { x: 300, y: 8.35, z: 12 }, { x: 300, y: 8.35, z: 27 }, { x: 600, y: 5.6, z: 7.65 }, { x: 600, y: 8.35, z: 13.78 }, { x: 599.98, y: 8.35, z: 26.95 }].map(({ x, y, z }, i) => <group key={i} position={[x + 0.7, y + 0.5, z]} rotation={[0, -Math.PI / 2, 0]} scale={0.4}>
      <Button id={`gallery-interior-return-${i}`} label="見学通路へ戻る" x={0} onClick={() => changeMode('compare', x < 450 ? 300 : 600)} />
    </group>)}
    {/* A shared, visible promenade gives every teleport a matching floor. */}
    <mesh position={[300, -0.12, 169]} receiveShadow><boxGeometry args={[660, 0.2, 28]} /><meshStandardMaterial color="#34475a" /></mesh>
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[330, 0.1, 14]} position={[300, -0.12, 169]} /></RigidBody>
    <mesh position={[300, 34.85, 240]}><boxGeometry args={[24, 0.3, 10]} /><meshStandardMaterial color="#34475a" /></mesh>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[12, 0.15, 5]} position={[300, 34.85, 240]} />
      {[-12, 12].map((x) => <CuboidCollider key={x} args={[0.1, 0.6, 5]} position={[300 + x, 35.6, 240]} />)}
      {[-5, 5].map((z) => <CuboidCollider key={z} args={[12, 0.6, 0.1]} position={[300, 35.6, 240 + z]} />)}
    </RigidBody>
    {[-12, 12].map((x) => <mesh key={x} position={[300 + x, 35.6, 240]}><boxGeometry args={[0.2, 1.2, 10]} /><meshStandardMaterial color="#638399" transparent opacity={0.35} /></mesh>)}
    {[-5, 5].map((z) => <mesh key={z} position={[300, 35.6, 240 + z]}><boxGeometry args={[24, 1.2, 0.2]} /><meshStandardMaterial color="#638399" transparent opacity={0.35} /></mesh>)}
    <group position={[300, 35, 237]}><Button id="gallery-overview-return" label="見学通路へ戻る" x={0} onClick={() => changeMode('compare', 300)} /></group>
  </>
}
