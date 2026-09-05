// Clickable airframe part catalog with Japanese learning notes.
// anchor: where the floating highlight marker appears (aircraft coords).

export interface PartInfo {
  id: string
  name: string
  english: string
  description: string
  anchor: [number, number, number]
}

export const PART_CATALOG: PartInfo[] = [
  {
    id: 'radome',
    name: 'レドーム',
    english: 'Radome',
    description:
      '機首の先端カバー。内部には気象レーダーのアンテナが収められており、電波を通すためガラス繊維強化プラスチック製。分解モードでは中のレーダー皿が見える。',
    anchor: [0, 6.2, 34.8],
  },
  {
    id: 'cockpit',
    name: 'コックピット',
    english: 'Flight Deck',
    description:
      '747はアッパーデッキ前端に操縦室がある2階建て構造。-400型から計器がブラウン管/液晶化され、機関士なしの2名乗務になった。機内のアッパーデッキ前方から入れる。',
    anchor: [0, 9.6, 30.5],
  },
  {
    id: 'upper-deck',
    name: 'アッパーデッキ（こぶ）',
    english: 'Upper Deck Hump',
    description:
      '747の象徴である2階席のこぶ。元々は貨物型で機首扉を開くため操縦室を上に上げた名残り。-400型では後方へ延長され約23mある。',
    anchor: [0, 11.4, 15.5],
  },
  {
    id: 'wing',
    name: '主翼',
    english: 'Main Wing',
    description:
      '揚力を生み出す翼。全幅64.4m、後退角37.5度で音速近くの巡航(マッハ0.85)に対応。内部は巨大な燃料タンクで、約216,000Lの燃料を積める。',
    anchor: [18, 8.2, -4],
  },
  {
    id: 'winglet',
    name: 'ウィングレット',
    english: 'Winglet',
    description:
      '-400型で追加された翼端の小さな立て翼。翼端で発生する渦（誘導抗力）を抑え、燃費を約3%改善する。高さ約1.8m。',
    anchor: [31.8, 10.5, -14],
  },
  {
    id: 'slat',
    name: '前縁スラット',
    english: 'Leading Edge Slats',
    description:
      '主翼前縁から前方へせり出す高揚力装置。離着陸時に翼の反りを深くして低速でも失速しにくくする。747はクルーガーフラップ式を採用。',
    anchor: [14, 6.8, 3.5],
  },
  {
    id: 'flap',
    name: '後縁フラップ',
    english: 'Triple-Slotted Flaps',
    description:
      '主翼後縁から3段に展開する大型フラップ。翼面積と反りを増やして揚力を稼ぎ、着陸速度を約270km/hまで下げられる。747の名物装備のひとつ。',
    anchor: [10, 6.4, -10],
  },
  {
    id: 'aileron',
    name: 'エルロン（補助翼）',
    english: 'Aileron',
    description:
      '主翼外側後縁の動翼。左右逆向きに動いて機体をロール（横転）させる。高速時は外側エルロンを固定し、内側エルロンとスポイラーで操縦する。',
    anchor: [27, 8.6, -16],
  },
  {
    id: 'spoiler',
    name: 'スポイラー',
    english: 'Spoilers',
    description:
      '主翼上面に立ち上がる板。空中では揚力を減らして降下やロールを助け、接地後は一斉に立てて翼の揚力を消し、ブレーキを効かせる。',
    anchor: [12, 7.0, -7],
  },
  {
    id: 'engine',
    name: 'ジェットエンジン',
    english: 'Turbofan Engine (CF6-80C2)',
    description:
      '推力約26トンの大バイパス比ターボファンを4基搭載。ファン直径2.4m。吸い込む空気の8割以上はコアを通らずファンだけで加速され、推力の大半を生む。隣の分解展示で内部構造を学べる。',
    anchor: [11.7, 3.2, 4],
  },
  {
    id: 'pylon',
    name: 'パイロン',
    english: 'Engine Pylon',
    description:
      'エンジンを主翼に吊り下げる支柱。推力と振動を翼に伝えつつ、火災時はエンジンごと切り離せる構造になっている安全上の要。',
    anchor: [11.7, 5.6, 1],
  },
  {
    id: 'vstab',
    name: '垂直尾翼',
    english: 'Vertical Stabilizer',
    description:
      '機体の方向安定を保つ翼。地上から19.4m、ビル6階分の高さ。後縁のラダー（方向舵）で機首の向きを左右に操る。',
    anchor: [0, 16, -30],
  },
  {
    id: 'hstab',
    name: '水平尾翼',
    english: 'Horizontal Stabilizer',
    description:
      '機体の縦の安定を保つ小さな翼。後縁のエレベーター（昇降舵）で機首の上げ下げを操る。内部は燃料タンクにもなっており、重心調整に使われる。',
    anchor: [8, 7.2, -32],
  },
  {
    id: 'nose-gear',
    name: '前脚（ノーズギア）',
    english: 'Nose Landing Gear',
    description:
      '機首下の2輪式脚。地上での方向転換を担当し、最大70度まで切れる。離陸後は前方に引き込まれる。',
    anchor: [0, 1.8, 27.5],
  },
  {
    id: 'main-gear',
    name: '主脚（メインギア）',
    english: 'Main Landing Gear',
    description:
      '4本の脚に4輪ずつ、計16輪で約400トンの機体を支える。翼下2脚と胴体下2脚の組み合わせで、胴体側の脚は後輪操向もできる。タイヤ1本の直径は約1.2m。',
    anchor: [4, 1.8, -3.5],
  },
  {
    id: 'apu',
    name: 'APU（補助動力装置）',
    english: 'Auxiliary Power Unit',
    description:
      '尾部の小型ガスタービン。地上でエンジン停止中に電力と空調用の圧縮空気を供給し、メインエンジンの始動にも使う。尾端の排気口が目印。',
    anchor: [0, 7.5, -34.5],
  },
  {
    id: 'door',
    name: '乗降ドア',
    english: 'Passenger Door',
    description:
      'メインデッキ片側5枚＋アッパーデッキ1枚のプラグ式ドア。内側から外へ押し開く構造で、与圧中は内圧でドアが枠に押し付けられ開かない仕組み。非常時は脱出スライドが自動展開する。',
    anchor: [3.2, 6.6, 18],
  },
]

export const PART_MAP: Record<string, PartInfo> = Object.fromEntries(
  PART_CATALOG.map((part) => [part.id, part]),
)

// Engine exhibit module catalog (exploded turbofan, front to back)
export interface EngineModule {
  id: string
  name: string
  english: string
  description: string
  explodeOffset: number // additional z offset (local, +z = forward) when exploded
}

export const ENGINE_MODULES: EngineModule[] = [
  {
    id: 'inlet',
    name: '空気取入口',
    english: 'Inlet Cowl',
    description: '空気を整えて吸い込む入口。縁は防氷のため温風で温められる。',
    explodeOffset: 3.6,
  },
  {
    id: 'fan',
    name: 'ファン',
    english: 'Fan',
    description: '直径2.4mの大きな羽根車。推力の約8割はこのファンが生む。',
    explodeOffset: 2.4,
  },
  {
    id: 'lpc',
    name: '低圧圧縮機',
    english: 'LP Compressor',
    description: 'ファン直後で空気を一次圧縮してコアへ送り込む。',
    explodeOffset: 1.3,
  },
  {
    id: 'hpc',
    name: '高圧圧縮機',
    english: 'HP Compressor',
    description: '14段の羽根で空気を約30倍に圧縮。温度は500℃を超える。',
    explodeOffset: 0.5,
  },
  {
    id: 'combustor',
    name: '燃焼室',
    english: 'Combustor',
    description: '圧縮空気に燃料を吹き込み連続燃焼させる。約1400℃の高温部。',
    explodeOffset: -0.5,
  },
  {
    id: 'hpt',
    name: '高圧タービン',
    english: 'HP Turbine',
    description: '燃焼ガスで回り、同軸の高圧圧縮機を駆動する。最も過酷な部品。',
    explodeOffset: -1.4,
  },
  {
    id: 'lpt',
    name: '低圧タービン',
    english: 'LP Turbine',
    description: '残りのガスエネルギーで前方のファンを回す。ファンとは内側の軸で直結。',
    explodeOffset: -2.5,
  },
  {
    id: 'nozzle',
    name: '排気ノズル',
    english: 'Exhaust Nozzle',
    description: '使い終えたガスを後方へ噴き出す出口。コア排気は約600℃。',
    explodeOffset: -3.8,
  },
]
