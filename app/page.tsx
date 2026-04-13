'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Tab = 'battle' | 'cards' | 'towers'
type Screen = 'home' | 'battle'
type Side = 'player' | 'bot'
type CardType = 'unit' | 'spell'
type MovementMode = 'ground' | 'air' | 'static'
type AttackTarget = 'ground' | 'air-ground' | 'buildings'
type AttackPattern = 'single' | 'splash'
type RoleTone = 'tank' | 'damage' | 'support' | 'spell'
type UnitClass = 'troop' | 'building'

type Account = {
  name: string
  level: number
  gold: number
  gems: number
  trophies: number
}

type ArtDirection = {
  silhouette: string
  shape: string
  palette: string
  iconic: string
  animation: string
  feedback: string
  size: '1x1' | '1x2' | '2x2'
  tone: RoleTone
}

type Card = {
  id: string
  name: string
  role: string
  battleRole: string
  type: CardType
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  cost: number
  level: number
  progress: number
  progressMax: number
  hp?: number
  damage: number
  speed?: number
  range?: number
  cooldown?: number
  splashRadius?: number
  movement?: MovementMode
  attackTarget?: AttackTarget
  attackPattern?: AttackPattern
  unitClass?: UnitClass
  color: string
  accent: string
  summary: string
  art: ArtDirection
}

type Unit = {
  id: number
  cardId: string
  side: Side
  x: number
  y: number
  hp: number
  maxHp: number
  damage: number
  speed: number
  range: number
  cooldown: number
  attackTimer: number
  splashRadius: number
  movement: MovementMode
  attackTarget: AttackTarget
  attackPattern: AttackPattern
  unitClass: UnitClass
  color: string
  accent: string
  name: string
  role: string
  tone: RoleTone
  size: ArtDirection['size']
}

type Tower = {
  id: string
  side: Side
  x: number
  y: number
  hp: number
  maxHp: number
  damage: number
  range: number
  cooldown: number
  attackTimer: number
  kind: 'king' | 'archer'
}

type DragState = {
  cardIndex: number
  x: number
  y: number
}

type TargetRef =
  | { kind: 'unit'; id: number; x: number; y: number }
  | { kind: 'tower'; id: string; x: number; y: number }

type TowerBlueprint = {
  name: string
  role: string
  hp: number
  damage: number
  range: number
  cooldown: number
  architecture: string
  color: string
  animation: string
  feedback: string
}

const cols = 24
const rows = 24
const tileCount = cols * rows
const maxEnergy = 10
const battleDuration = 120

const cards: Card[] = [
  {
    id: 'runner',
    name: 'Cutlass Runner',
    role: 'Melee',
    battleRole: 'Duelista veloz',
    type: 'unit',
    rarity: 'Common',
    cost: 2,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 128,
    damage: 24,
    speed: 15,
    range: 5,
    cooldown: 0.72,
    movement: 'ground',
    attackTarget: 'ground',
    attackPattern: 'single',
    unitClass: 'troop',
    color: '#f7af45',
    accent: '#fff1bd',
    summary: 'Presion barata de cuerpo a cuerpo para forzar respuestas rapidas.',
    art: {
      silhouette: 'Small triangular pirate with oversized cutlass and forward-leaning sprint pose.',
      shape: 'Angular body, tiny waist, high visual momentum and clear 1x1 footprint.',
      palette: 'Warm saffron, cream cloth and toasted leather for instant damage-role recognition.',
      iconic: 'Big cutlass, striped scarf and hat spike that reads even at tiny scale.',
      animation: 'Idle bounce, fast lunge attack and quick recover to keep the unit feeling snappy.',
      feedback: 'White slash streak, bright hit flash and tiny spark burst on contact.',
      size: '1x1',
      tone: 'damage',
    },
  },
  {
    id: 'gunner',
    name: 'Coral Gunner',
    role: 'Rango',
    battleRole: 'Control a distancia',
    type: 'unit',
    rarity: 'Common',
    cost: 3,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 142,
    damage: 29,
    speed: 10,
    range: 15,
    cooldown: 1,
    movement: 'ground',
    attackTarget: 'air-ground',
    attackPattern: 'single',
    unitClass: 'troop',
    color: '#68d9ff',
    accent: '#eefcff',
    summary: 'Tirador de largo alcance que cubre aire y tierra.',
    art: {
      silhouette: 'Narrow body dominated by a long coral rifle and rounded sea-helmet.',
      shape: 'Tall vertical read with the weapon doing most of the recognition work.',
      palette: 'Cyan, sea blue and pearl white to code support fire and precision.',
      iconic: 'Rifle barrel, shoulder stock and coral sights.',
      animation: 'Light breathing in idle and a big recoil kick on each shot.',
      feedback: 'Cold muzzle flash, clear tracer line and crisp impact spark.',
      size: '1x2',
      tone: 'support',
    },
  },
  {
    id: 'bulwark',
    name: 'Ironhook Bulwark',
    role: 'Tanque melee',
    battleRole: 'Muro frontal',
    type: 'unit',
    rarity: 'Rare',
    cost: 4,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 290,
    damage: 28,
    speed: 8,
    range: 5,
    cooldown: 1.05,
    movement: 'ground',
    attackTarget: 'ground',
    attackPattern: 'single',
    unitClass: 'troop',
    color: '#8e5b45',
    accent: '#ffd9c2',
    summary: 'Tanque cuerpo a cuerpo que aguanta dano y frena pushes.',
    art: {
      silhouette: 'Broad shield mass, huge hook arm and very low center of gravity.',
      shape: 'Round volume with massive shoulders and grounded stance.',
      palette: 'Deep rust, steel gray and ember orange to scream tank instantly.',
      iconic: 'Hook shield, armor plates and bright chest buckle.',
      animation: 'Weighty idle sway, shoulder slam attack and slow but satisfying recoil.',
      feedback: 'Dust burst, hot hit flash and deep red damage blink when focused.',
      size: '2x2',
      tone: 'tank',
    },
  },
  {
    id: 'parrot',
    name: 'Bomb Parrot',
    role: 'Aereo en area',
    battleRole: 'Bombardero aereo',
    type: 'unit',
    rarity: 'Rare',
    cost: 3,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 118,
    damage: 34,
    speed: 13,
    range: 12,
    cooldown: 1.2,
    splashRadius: 10,
    movement: 'air',
    attackTarget: 'ground',
    attackPattern: 'splash',
    unitClass: 'troop',
    color: '#ff7070',
    accent: '#ffe2a3',
    summary: 'Unidad aerea con dano de area que castiga grupos.',
    art: {
      silhouette: 'Wing spread, round bomb belly and beak profile visible in one glance.',
      shape: 'Diamond-like airborne mass with strong top-heavy read.',
      palette: 'Crimson feathers, gold bomb glow and dark navy shadows.',
      iconic: 'Bomb satchel, giant beak and wingtip ribbons.',
      animation: 'Wing flap idle, bomb release dip and fast climb after each drop.',
      feedback: 'Falling ember, compact blast ring and smoke puff on splash impact.',
      size: '1x2',
      tone: 'damage',
    },
  },
  {
    id: 'cannon',
    name: 'Deck Cannon',
    role: 'Estructura',
    battleRole: 'Defensa estatica',
    type: 'unit',
    rarity: 'Rare',
    cost: 4,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 240,
    damage: 36,
    speed: 0,
    range: 16,
    cooldown: 1.15,
    movement: 'static',
    attackTarget: 'ground',
    attackPattern: 'single',
    unitClass: 'building',
    color: '#506477',
    accent: '#b4ddff',
    summary: 'Estructura defensiva estatica para controlar lineas terrestres.',
    art: {
      silhouette: 'Low wood platform, big cannon mouth and side wheels cropped into a chunky block.',
      shape: 'Wide static rectangle with a heavy front-loaded barrel.',
      palette: 'Gunmetal blue, pale cyan highlights and warm oak wood.',
      iconic: 'Huge barrel rim, rope wraps and recoil frame.',
      animation: 'Subtle fuse idle and dramatic kickback on fire.',
      feedback: 'Shell flash, smoke cone and visible recoil frame.',
      size: '2x2',
      tone: 'support',
    },
  },
  {
    id: 'brute',
    name: 'Anchor Brute',
    role: 'Tanque de asedio',
    battleRole: 'Cazatorres',
    type: 'unit',
    rarity: 'Epic',
    cost: 5,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 336,
    damage: 48,
    speed: 8,
    range: 5,
    cooldown: 1.15,
    movement: 'ground',
    attackTarget: 'buildings',
    attackPattern: 'single',
    unitClass: 'troop',
    color: '#ff8d60',
    accent: '#ffe2d1',
    summary: 'Condicion de victoria que ignora tropas y va a por estructuras.',
    art: {
      silhouette: 'Massive body with a giant anchor raised behind the back.',
      shape: 'Rounded tank core with a huge diagonal weapon shape cutting across it.',
      palette: 'Burnt orange, dark iron and rope tan for maximum siege readability.',
      iconic: 'Oversized anchor, iron bands and sailor straps.',
      animation: 'Heavy stomp loop and long overhead smash when in range.',
      feedback: 'Ground shake feel, dust ring and bright orange impact flash.',
      size: '2x2',
      tone: 'tank',
    },
  },
  {
    id: 'siren',
    name: 'Tide Siren',
    role: 'Rango en area',
    battleRole: 'Control en area',
    type: 'unit',
    rarity: 'Legendary',
    cost: 4,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 156,
    damage: 26,
    speed: 10,
    range: 14,
    cooldown: 0.9,
    splashRadius: 9,
    movement: 'ground',
    attackTarget: 'air-ground',
    attackPattern: 'splash',
    unitClass: 'troop',
    color: '#a599ff',
    accent: '#f2f4ff',
    summary: 'Maga de rango con splash para limpiar pushes cargados.',
    art: {
      silhouette: 'Floating hair mass, shell staff and long wave-shaped cape.',
      shape: 'Elegant S-curve with a tall magical read.',
      palette: 'Periwinkle, violet glow and pearl highlights.',
      iconic: 'Shell staff, flowing hair and tidal halo.',
      animation: 'Levitating idle, charge pulse and whip-like release on cast.',
      feedback: 'Ripple ring, violet splash and soft energy bloom on impact.',
      size: '1x2',
      tone: 'support',
    },
  },
  {
    id: 'powder',
    name: 'Powder Burst',
    role: 'Hechizo',
    battleRole: 'Hechizo de area',
    type: 'spell',
    rarity: 'Epic',
    cost: 3,
    level: 1,
    progress: 0,
    progressMax: 2,
    damage: 76,
    range: 16,
    splashRadius: 15,
    color: '#ff7aa6',
    accent: '#ffe6ef',
    summary: 'Explosion rapida de area para limpiar tropas agrupadas o rascar torre.',
    art: {
      silhouette: 'Circular burn marker with a central fuse spark.',
      shape: 'Round telegraph, uneven smoke ring and explosive center.',
      palette: 'Hot pink, orange powder and pale ash smoke.',
      iconic: 'Fuse spark, soot ring and blast bloom.',
      animation: 'Ground marker, falling spark and abrupt sphere explosion.',
      feedback: 'Strong flash, shock ring and black cinder particles.',
      size: '1x2',
      tone: 'spell',
    },
  },
]

const towerBlueprints: Record<Tower['kind'], TowerBlueprint> = {
  archer: {
    name: 'Torre Princesa',
    role: 'Defensa lateral',
    hp: 420,
    damage: 22,
    range: 18,
    cooldown: 1.1,
    architecture: 'Square stone base, open timber deck, exposed archer and bold roof silhouette.',
    color: 'Neutral stone with team-colored roof, banners and trim.',
    animation: 'Constant aim pose with a sharp bow recoil when firing.',
    feedback: 'Visible projectile path, small hit spark and stable health bar.',
  },
  king: {
    name: 'Torre del Rey',
    role: 'Nucleo central',
    hp: 900,
    damage: 28,
    range: 22,
    cooldown: 1.25,
    architecture: 'Taller stone keep with crowned top, heavier base and golden royal trims.',
    color: 'Stone gray and beige with stronger blue or red team accents.',
    animation: 'Dormant heavy idle, then more intense firing posture once active.',
    feedback: 'Brighter muzzle flash, clearer hit pop and stronger hierarchy.',
  },
}

const initialDeck = ['runner', 'gunner', 'bulwark', 'powder', 'parrot', 'cannon', 'brute', 'siren']
const initialOwned = cards.map((card) => card.id)
const botDeck = ['runner', 'gunner', 'bulwark', 'parrot', 'cannon', 'brute', 'siren', 'powder']

const rarityClass: Record<Card['rarity'], string> = {
  Common: 'rarity-common',
  Rare: 'rarity-rare',
  Epic: 'rarity-epic',
  Legendary: 'rarity-legendary',
}

function getCard(cardId: string) {
  return cards.find((card) => card.id === cardId)!
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function formatTime(value: number) {
  const total = Math.max(0, Math.ceil(value))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function makeTowers(): Tower[] {
  return [
    { id: 'bot-left', side: 'bot', x: 28, y: 22, hp: 420, maxHp: 420, damage: 22, range: 18, cooldown: 1.1, attackTimer: 0, kind: 'archer' },
    { id: 'bot-right', side: 'bot', x: 72, y: 22, hp: 420, maxHp: 420, damage: 22, range: 18, cooldown: 1.1, attackTimer: 0, kind: 'archer' },
    { id: 'bot-king', side: 'bot', x: 50, y: 9, hp: 900, maxHp: 900, damage: 28, range: 22, cooldown: 1.25, attackTimer: 0, kind: 'king' },
    { id: 'player-left', side: 'player', x: 28, y: 78, hp: 420, maxHp: 420, damage: 22, range: 18, cooldown: 1.1, attackTimer: 0, kind: 'archer' },
    { id: 'player-right', side: 'player', x: 72, y: 78, hp: 420, maxHp: 420, damage: 22, range: 18, cooldown: 1.1, attackTimer: 0, kind: 'archer' },
    { id: 'player-king', side: 'player', x: 50, y: 91, hp: 900, maxHp: 900, damage: 28, range: 22, cooldown: 1.25, attackTimer: 0, kind: 'king' },
  ]
}

function canHitTarget(attackTarget: AttackTarget, movement: MovementMode) {
  if (attackTarget === 'air-ground') return true
  if (attackTarget === 'ground') return movement !== 'air'
  return false
}

function getToneLabel(tone: RoleTone) {
  switch (tone) {
    case 'tank':
      return 'Tanque'
    case 'damage':
      return 'Daño'
    case 'support':
      return 'Soporte'
    case 'spell':
      return 'Hechizo'
  }
}

function getTargetLabel(target: AttackTarget | undefined) {
  if (!target) return 'Hechizo'
  switch (target) {
    case 'ground':
      return 'Tierra'
    case 'air-ground':
      return 'Aire y tierra'
    case 'buildings':
      return 'Solo estructuras'
  }
}

function getMovementLabel(movement: MovementMode | undefined) {
  if (!movement) return 'Instantaneo'
  switch (movement) {
    case 'ground':
      return 'Terrestre'
    case 'air':
      return 'Aereo'
    case 'static':
      return 'Estatico'
  }
}

function getPatternLabel(pattern: AttackPattern | undefined) {
  if (!pattern) return 'Impacto'
  return pattern === 'single' ? 'Objetivo unico' : 'Area'
}

function CardArt({ card, battle = false }: { card: Card; battle?: boolean }) {
  return (
    <div className={`card-portrait ${battle ? 'battle' : ''} art-${card.id}`}>
      <div className="art-sky" />
      <div className="art-glow" />
      <div className="art-shadow" />
      <div className="art-body" />
      <div className="art-head" />
      <div className="art-weapon" />
      <div className="art-trim" />
      <div className="art-effect" />
    </div>
  )
}

function TowerVisual({ tower, preview = false }: { tower: Tower | TowerBlueprint; preview?: boolean }) {
  const kind = 'kind' in tower ? tower.kind : tower.name.includes('King') ? 'king' : 'archer'
  const sideClass = preview ? `preview-${kind}` : 'side' in tower ? tower.side : 'player'

  return (
    <div className={`tower-node ${kind} ${sideClass} ${preview ? 'tower-preview' : ''}`}>
      <div className="tower-shadow" />
      <div className="tower-base" />
      <div className="tower-body">
        <div className="tower-roof" />
        <div className="tower-window" />
        <div className="tower-banner" />
        {kind === 'archer' ? <div className="tower-archer" /> : <div className="tower-crown" />}
      </div>
    </div>
  )
}

function sortByDistance<T extends { x: number; y: number }>(source: { x: number; y: number }, items: T[]) {
  return [...items].sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y))
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('battle')
  const [screen, setScreen] = useState<Screen>('home')
  const [account, setAccount] = useState<Account>({ name: 'Nuevo Pirata', level: 1, gold: 0, gems: 0, trophies: 0 })
  const [owned] = useState<string[]>(initialOwned)
  const [deck, setDeck] = useState<string[]>(initialDeck)
  const [selectedDeckSlot, setSelectedDeckSlot] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState(deck[0])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [towers, setTowers] = useState<Tower[]>(makeTowers())
  const [units, setUnits] = useState<Unit[]>([])
  const [playerEnergy, setPlayerEnergy] = useState(5)
  const [botEnergy, setBotEnergy] = useState(5)
  const [timeLeft, setTimeLeft] = useState(battleDuration)
  const [result, setResult] = useState<string | null>(null)

  const arenaRef = useRef<HTMLDivElement | null>(null)
  const unitIdRef = useRef(1)
  const unitsRef = useRef<Unit[]>([])
  const towersRef = useRef<Tower[]>(makeTowers())
  const botEnergyRef = useRef(5)
  const timeRef = useRef(battleDuration)
  const botThinkRef = useRef(0)

  useEffect(() => {
    const stored = window.localStorage.getItem('pirates-card-battle-account')
    if (stored) {
      setAccount(JSON.parse(stored) as Account)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('pirates-card-battle-account', JSON.stringify(account))
  }, [account])

  useEffect(() => {
    unitsRef.current = units
  }, [units])

  useEffect(() => {
    towersRef.current = towers
  }, [towers])

  useEffect(() => {
    botEnergyRef.current = botEnergy
  }, [botEnergy])

  useEffect(() => {
    timeRef.current = timeLeft
  }, [timeLeft])

  const visibleDeck = useMemo(() => deck.map((cardId) => getCard(cardId)), [deck])
  const battleHand = useMemo(() => deck.slice(0, 4).map((cardId) => getCard(cardId)), [deck])
  const ownedCards = useMemo(() => cards.filter((card) => owned.includes(card.id)), [owned])
  const selectedDetailCard = getCard(selectedCardId)
  const averageElixir = useMemo(() => (visibleDeck.reduce((sum, card) => sum + card.cost, 0) / visibleDeck.length).toFixed(1), [visibleDeck])

  const resetBattle = () => {
    setTowers(makeTowers())
    setUnits([])
    setPlayerEnergy(5)
    setBotEnergy(5)
    setTimeLeft(battleDuration)
    setResult(null)
    unitIdRef.current = 1
    botThinkRef.current = 0
  }

  const openBattle = () => {
    resetBattle()
    setScreen('battle')
  }

  const swapDeckCard = (cardId: string) => {
    setDeck((current) => current.map((value, index) => (index === selectedDeckSlot ? cardId : value)))
    setSelectedCardId(cardId)
  }

  const summon = (cardId: string, side: Side, x: number, y: number) => {
    const card = getCard(cardId)

    if (card.type === 'spell') {
      const radius = card.splashRadius ?? 14

      setUnits((current) =>
        current
          .map((unit) => {
            if (unit.side === side) return unit
            const distance = Math.hypot(unit.x - x, unit.y - y)
            return distance <= radius ? { ...unit, hp: unit.hp - card.damage } : unit
          })
          .filter((unit) => unit.hp > 0)
      )

      setTowers((current) =>
        current.map((tower) => {
          if (tower.side === side) return tower
          const distance = Math.hypot(tower.x - x, tower.y - y)
          return distance <= radius + 2 ? { ...tower, hp: Math.max(0, tower.hp - Math.round(card.damage * 0.65)) } : tower
        })
      )
      return
    }

    setUnits((current) => [
      ...current,
      {
        id: unitIdRef.current++,
        cardId: card.id,
        side,
        x,
        y,
        hp: card.hp ?? 100,
        maxHp: card.hp ?? 100,
        damage: card.damage,
        speed: card.speed ?? 0,
        range: card.range ?? 6,
        cooldown: card.cooldown ?? 1,
        attackTimer: 0,
        splashRadius: card.splashRadius ?? 0,
        movement: card.movement ?? 'ground',
        attackTarget: card.attackTarget ?? 'ground',
        attackPattern: card.attackPattern ?? 'single',
        unitClass: card.unitClass ?? 'troop',
        color: card.color,
        accent: card.accent,
        name: card.name,
        role: card.role,
        tone: card.art.tone,
        size: card.art.size,
      },
    ])
  }

  const deployDraggedCard = (cardIndex: number, tileIndex: number) => {
    const card = battleHand[cardIndex]
    if (!card || playerEnergy < card.cost || result) return

    const col = tileIndex % cols
    const row = Math.floor(tileIndex / cols)
    if (row < 12) return

    const x = (col + 0.5) * (100 / cols)
    const y = (row + 0.5) * (100 / rows)
    summon(card.id, 'player', x, y)
    setPlayerEnergy((current) => clamp(current - card.cost, 0, maxEnergy))
  }

  const onCardPointerDown = (cardIndex: number, event: React.PointerEvent<HTMLButtonElement>) => {
    const card = battleHand[cardIndex]
    if (!card || playerEnergy < card.cost || result) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({ cardIndex, x: event.clientX, y: event.clientY })
  }

  const onCardPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState) return
    setDragState((current) => (current ? { ...current, x: event.clientX, y: event.clientY } : null))
  }

  const onCardPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState) return
    const rect = arenaRef.current?.getBoundingClientRect()
    if (rect) {
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (inside) {
        const col = clamp(Math.floor(((event.clientX - rect.left) / rect.width) * cols), 0, cols - 1)
        const row = clamp(Math.floor(((event.clientY - rect.top) / rect.height) * rows), 0, rows - 1)
        deployDraggedCard(dragState.cardIndex, row * cols + col)
      }
    }
    setDragState(null)
  }

  const chooseTarget = (attacker: Unit, allUnits: Unit[], allTowers: Tower[]): TargetRef | null => {
    const enemyUnits = allUnits.filter((unit) => {
      if (unit.side === attacker.side) return false
      if (attacker.attackTarget === 'buildings') return unit.unitClass === 'building'
      return canHitTarget(attacker.attackTarget, unit.movement)
    })
    const enemyTowers = allTowers.filter((tower) => tower.side !== attacker.side && tower.hp > 0)

    const sortedUnits = sortByDistance(attacker, enemyUnits)
    const sortedTowers = sortByDistance(attacker, enemyTowers)

    if (attacker.attackTarget === 'buildings') {
      const buildingUnit = sortedUnits.find((unit) => unit.unitClass === 'building')
      if (buildingUnit) return { kind: 'unit', id: buildingUnit.id, x: buildingUnit.x, y: buildingUnit.y }
      const tower = sortedTowers[0]
      return tower ? { kind: 'tower', id: tower.id, x: tower.x, y: tower.y } : null
    }

    const troopTarget = sortedUnits.find((unit) => unit.unitClass === 'troop') ?? sortedUnits[0]
    if (troopTarget) return { kind: 'unit', id: troopTarget.id, x: troopTarget.x, y: troopTarget.y }

    const buildingTarget = sortedUnits.find((unit) => unit.unitClass === 'building')
    if (buildingTarget) return { kind: 'unit', id: buildingTarget.id, x: buildingTarget.x, y: buildingTarget.y }

    const tower = sortedTowers[0]
    return tower ? { kind: 'tower', id: tower.id, x: tower.x, y: tower.y } : null
  }

  const applySplashDamage = (
    attacker: Unit,
    target: TargetRef,
    allUnits: Unit[],
    unitDamage: Map<number, number>,
    towerDamage: Map<string, number>
  ) => {
    if (attacker.attackPattern !== 'splash' || attacker.splashRadius <= 0) return

    for (const enemy of allUnits) {
      if (enemy.side === attacker.side) continue
      if (enemy.id === (target.kind === 'unit' ? target.id : -1)) continue
      if (!canHitTarget(attacker.attackTarget === 'buildings' ? 'ground' : attacker.attackTarget, enemy.movement)) continue
      if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= attacker.splashRadius) {
        unitDamage.set(enemy.id, (unitDamage.get(enemy.id) ?? 0) + Math.round(attacker.damage * 0.65))
      }
    }

    if (target.kind === 'unit') {
      for (const tower of towersRef.current) {
        if (tower.side === attacker.side || tower.hp <= 0) continue
        if (Math.hypot(tower.x - target.x, tower.y - target.y) <= attacker.splashRadius) {
          towerDamage.set(tower.id, (towerDamage.get(tower.id) ?? 0) + Math.round(attacker.damage * 0.35))
        }
      }
    }
  }

  useEffect(() => {
    if (screen !== 'battle' || result) return

    const timer = window.setInterval(() => {
      const delta = 0.1
      setTimeLeft((current) => Math.max(0, current - delta))

      const regen = timeRef.current <= 30 ? 0.88 : 0.45
      setPlayerEnergy((current) => clamp(current + regen * delta, 0, maxEnergy))
      setBotEnergy((current) => clamp(current + regen * delta, 0, maxEnergy))

      setUnits((currentUnits) => {
        const updated = currentUnits.map((unit) => ({ ...unit, attackTimer: Math.max(0, unit.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()
        const towerDamage = new Map<string, number>()

        for (const unit of updated) {
          const target = chooseTarget(unit, updated, towersRef.current)
          if (!target) continue

          const distance = Math.hypot(target.x - unit.x, target.y - unit.y)

          if (distance <= unit.range) {
            if (unit.attackTimer <= 0) {
              if (target.kind === 'unit') {
                unitDamage.set(target.id, (unitDamage.get(target.id) ?? 0) + unit.damage)
              } else {
                towerDamage.set(target.id, (towerDamage.get(target.id) ?? 0) + unit.damage)
              }
              applySplashDamage(unit, target, updated, unitDamage, towerDamage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          if (unit.movement === 'static') continue

          const dx = target.x - unit.x
          const dy = target.y - unit.y
          const norm = Math.hypot(dx, dy) || 1
          unit.x = clamp(unit.x + (dx / norm) * unit.speed * delta, 6, 94)
          unit.y = clamp(unit.y + (dy / norm) * unit.speed * delta, 6, 94)
        }

        if (towerDamage.size > 0) {
          setTowers((current) =>
            current.map((tower) =>
              towerDamage.has(tower.id) ? { ...tower, hp: Math.max(0, tower.hp - (towerDamage.get(tower.id) ?? 0)) } : tower
            )
          )
        }

        return updated
          .map((unit) => (unitDamage.has(unit.id) ? { ...unit, hp: unit.hp - (unitDamage.get(unit.id) ?? 0) } : unit))
          .filter((unit) => unit.hp > 0)
      })

      setTowers((current) => {
        const updated = current.map((tower) => ({ ...tower, attackTimer: Math.max(0, tower.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()

        for (const tower of updated) {
          if (tower.hp <= 0 || tower.attackTimer > 0) continue

          const target = sortByDistance(
            tower,
            unitsRef.current.filter((unit) => unit.side !== tower.side)
          )[0]

          if (target && Math.hypot(target.x - tower.x, target.y - tower.y) <= tower.range) {
            unitDamage.set(target.id, (unitDamage.get(target.id) ?? 0) + tower.damage)
            tower.attackTimer = tower.cooldown
          }
        }

        if (unitDamage.size > 0) {
          setUnits((currentUnits) =>
            currentUnits
              .map((unit) => (unitDamage.has(unit.id) ? { ...unit, hp: unit.hp - (unitDamage.get(unit.id) ?? 0) } : unit))
              .filter((unit) => unit.hp > 0)
          )
        }

        return updated
      })

      botThinkRef.current += delta
      if (botThinkRef.current >= 2.2) {
        botThinkRef.current = 0
        const playable = botDeck.map(getCard).filter((card) => card.cost <= botEnergyRef.current)
        if (playable.length > 0) {
          const chosen = playable[Math.floor(Math.random() * playable.length)]
          const col = Math.floor(Math.random() * cols)
          const row = Math.floor(Math.random() * 8) + 1
          summon(chosen.id, 'bot', (col + 0.5) * (100 / cols), (row + 0.5) * (100 / rows))
          setBotEnergy((current) => clamp(current - chosen.cost, 0, maxEnergy))
        }
      }
    }, 100)

    return () => window.clearInterval(timer)
  }, [screen, result, battleHand])

  useEffect(() => {
    if (screen !== 'battle' || result) return

    const playerKing = towers.find((tower) => tower.id === 'player-king')?.hp ?? 0
    const botKing = towers.find((tower) => tower.id === 'bot-king')?.hp ?? 0

    if (playerKing <= 0) setResult('Derrota')
    else if (botKing <= 0) setResult('Victoria')
    else if (timeLeft <= 0) {
      const playerScore = towers.filter((tower) => tower.side === 'player').reduce((sum, tower) => sum + tower.hp, 0)
      const botScore = towers.filter((tower) => tower.side === 'bot').reduce((sum, tower) => sum + tower.hp, 0)
      setResult(playerScore >= botScore ? 'Victoria al tiempo' : 'Derrota al tiempo')
    }
  }, [screen, result, towers, timeLeft])

  if (screen === 'battle') {
    return (
      <main className="phone-shell battle-shell">
        <header className="battle-hud">
          <div className="hud-player enemy">
            <strong>Rival</strong>
            <span>Mazo mixto</span>
          </div>
          <div className="hud-center">
            <strong>{formatTime(timeLeft)}</strong>
            <span>{result ?? 'Combate'}</span>
          </div>
          <div className="hud-player">
            <strong>{account.name}</strong>
            <span>Arena pirata</span>
          </div>
        </header>

        <section className="battle-arena-card">
          <div className="king-bar enemy">
            <span>Torre del Rey rival</span>
            <div className="health-bar"><i style={{ width: `${((towers.find((tower) => tower.id === 'bot-king')?.hp ?? 0) / 900) * 100}%` }} /></div>
          </div>

          <div className="arena-board" ref={arenaRef}>
            <div className="arena-sun" />
            <div className="arena-river" />
            <div className="arena-deckline top" />
            <div className="arena-deckline bottom" />
            <div className="bridge left-bridge" />
            <div className="bridge right-bridge" />

            <div className="tile-grid">
              {Array.from({ length: tileCount }).map((_, index) => {
                const row = Math.floor(index / cols)
                const isPlayerZone = row >= 12
                return <div className={`tile ${isPlayerZone ? 'player-zone' : 'enemy-zone'}`} key={index} />
              })}
            </div>

            {towers.map((tower) => (
              <div className="battle-tower" key={tower.id} style={{ left: `${tower.x}%`, top: `${tower.y}%` }}>
                <TowerVisual tower={tower} />
                <div className="tower-hp"><i style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }} /></div>
              </div>
            ))}

            {units.map((unit) => {
              const unitCard = getCard(unit.cardId)

              return (
                <div className={`unit-node ${unit.side} tone-${unit.tone} size-${unit.size.replace('x', '-')} move-${unit.movement}`} key={unit.id} style={{ left: `${unit.x}%`, top: `${unit.y}%` }}>
                  <div className="unit-ring" />
                  <div className="unit-card-shell">
                    <CardArt card={unitCard} battle />
                  </div>
                  <div className="unit-label">{unit.name}</div>
                  <div className="unit-hp"><i style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} /></div>
                </div>
              )
            })}
          </div>

          <div className="king-bar player">
            <span>Torre del Rey</span>
            <div className="health-bar"><i style={{ width: `${((towers.find((tower) => tower.id === 'player-king')?.hp ?? 0) / 900) * 100}%` }} /></div>
          </div>
        </section>

        <section className="battle-bottom">
          <div className="elixir-panel">
            <span>Elixir</span>
            <strong>{playerEnergy.toFixed(1)} / 10</strong>
            <div className="elixir-bar"><i style={{ width: `${(playerEnergy / maxEnergy) * 100}%` }} /></div>
          </div>

          <div className="hand-grid">
            {battleHand.map((card, index) => (
              <button
                className={`hand-card ${rarityClass[card.rarity]} tone-${card.art.tone} ${playerEnergy < card.cost ? 'disabled' : ''}`}
                key={`${card.id}-${index}`}
                onPointerDown={(event) => onCardPointerDown(index, event)}
                onPointerMove={onCardPointerMove}
                onPointerUp={onCardPointerUp}
                type="button"
              >
                <div className="hand-cost">{card.cost}</div>
                <div className="card-frame">
                  <CardArt card={card} battle />
                </div>
                <strong>{card.name}</strong>
                <span className="hand-role">{card.battleRole}</span>
                <span className="hand-meta">{getPatternLabel(card.attackPattern)} · {getTargetLabel(card.attackTarget)}</span>
              </button>
            ))}
          </div>

          <button className="exit-battle" onClick={() => setScreen('home')} type="button">
            Salir
          </button>
        </section>

        {dragState ? (
          <div className="drag-ghost" style={{ left: dragState.x, top: dragState.y }}>
            <div className={`hand-card ghost ${rarityClass[battleHand[dragState.cardIndex].rarity]} tone-${battleHand[dragState.cardIndex].art.tone}`}>
              <div className="hand-cost">{battleHand[dragState.cardIndex].cost}</div>
              <div className="card-frame">
                <CardArt card={battleHand[dragState.cardIndex]} battle />
              </div>
              <strong>{battleHand[dragState.cardIndex].name}</strong>
            </div>
          </div>
        ) : null}
      </main>
    )
  }

  return (
    <main className="phone-shell">
      {tab === 'battle' ? (
        <section className="page-panel">
          <header className="home-header">
            <div className="profile-panel">
              <div className="profile-avatar"><div className="profile-silhouette" /></div>
              <div className="profile-level">{account.level}</div>
            </div>
            <div className="arena-panel">
              <strong>Pirates Card Battle</strong>
              <span>{account.trophies} trofeos</span>
            </div>
            <div className="resources-panel">
              <div><span>Oro</span><strong>{account.gold}</strong></div>
              <div><span>Gemas</span><strong>{account.gems}</strong></div>
            </div>
          </header>

          <div className="account-card">
            <span>Capitan</span>
            <input
              className="name-input"
              onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value || 'Nuevo Pirata' }))}
              value={account.name}
            />
          </div>

          <div className="section-block">
            <h2>Combate</h2>
            <div className="system-grid">
              <article className="system-chip">
                <strong>Melee</strong>
                <span>Runner y Bulwark</span>
              </article>
              <article className="system-chip">
                <strong>Rango</strong>
                <span>Gunner y Siren</span>
              </article>
              <article className="system-chip">
                <strong>Aereo</strong>
                <span>Bomb Parrot</span>
              </article>
              <article className="system-chip">
                <strong>Estructuras</strong>
                <span>Deck Cannon y Brute</span>
              </article>
            </div>
          </div>

          <div className="section-block">
            <h2>Mazo</h2>
            <div className="deck-strip">
              {visibleDeck.map((card, index) => (
                <article className={`deck-home-card ${rarityClass[card.rarity]} tone-${card.art.tone}`} key={`${card.id}-${index}`}>
                  <div className="card-frame">
                    <CardArt card={card} />
                  </div>
                  <span>{card.cost} elixir</span>
                </article>
              ))}
            </div>
            <div className="average-elixir">Coste medio: {averageElixir}</div>
          </div>

          <button className="battle-button" onClick={openBattle} type="button">Batalla</button>
          <div className="battle-subnote">Cartas de melee, rango, aire, estructuras y area.</div>
        </section>
      ) : tab === 'cards' ? (
        <section className="page-panel">
          <div className="section-block">
            <h2>Mazo</h2>
            <div className="deck-edit-grid">
              {visibleDeck.map((card, index) => (
                <button
                  className={`deck-edit-card ${selectedDeckSlot === index ? 'deck-edit-active' : ''} ${rarityClass[card.rarity]} tone-${card.art.tone}`}
                  key={`${card.id}-${index}`}
                  onClick={() => {
                    setSelectedDeckSlot(index)
                    setSelectedCardId(card.id)
                  }}
                  type="button"
                >
                  <div className="card-frame">
                    <CardArt card={card} />
                  </div>
                  <span>{card.cost}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="section-block">
            <h2>Carta</h2>
            <article className={`detail-card ${rarityClass[selectedDetailCard.rarity]} tone-${selectedDetailCard.art.tone}`}>
              <div className="detail-head">
                <div className="card-frame large-frame">
                  <CardArt card={selectedDetailCard} />
                </div>
                <div>
                  <strong>{selectedDetailCard.name}</strong>
                  <p>{selectedDetailCard.summary}</p>
                </div>
              </div>

              <div className="tag-row">
                <span className="tag">{selectedDetailCard.role}</span>
                <span className="tag">{selectedDetailCard.battleRole}</span>
                <span className="tag">{getMovementLabel(selectedDetailCard.movement)}</span>
                <span className="tag">{getTargetLabel(selectedDetailCard.attackTarget)}</span>
                <span className="tag">{getPatternLabel(selectedDetailCard.attackPattern)}</span>
                <span className="tag">{selectedDetailCard.art.size}</span>
              </div>

              <div className="stats-grid">
                <span>Daño: {selectedDetailCard.damage}</span>
                <span>Vida: {selectedDetailCard.hp ?? '-'}</span>
                <span>Velocidad: {selectedDetailCard.speed ?? '-'}</span>
                <span>Rango: {selectedDetailCard.range ?? '-'}</span>
                <span>Recarga: {selectedDetailCard.cooldown ?? '-'}</span>
                <span>Area: {selectedDetailCard.splashRadius ?? '-'}</span>
              </div>
            </article>
          </div>

          <div className="section-block">
            <h2>Coleccion</h2>
            <div className="entry-list">
              {ownedCards.map((card) => (
                <button
                  className={`store-entry ${rarityClass[card.rarity]} tone-${card.art.tone}`}
                  key={card.id}
                  onClick={() => {
                    setSelectedCardId(card.id)
                    swapDeckCard(card.id)
                  }}
                  type="button"
                >
                  <div className="mini-card-wrap">
                    <CardArt card={card} />
                  </div>
                  <div className="entry-copy">
                    <strong>{card.name}</strong>
                    <span>{card.battleRole}</span>
                    <div className="mini-progress"><i style={{ width: `${(card.progress / card.progressMax) * 100}%` }} /></div>
                  </div>
                  <b>{card.cost}</b>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="page-panel">
          <div className="section-block">
            <h2>Torres</h2>
            <div className="tower-blueprints">
              {Object.entries(towerBlueprints).map(([key, tower]) => (
                <article className={`tower-card tone-${key === 'king' ? 'tank' : 'support'}`} key={key}>
                  <div className="tower-preview-wrap">
                    <TowerVisual tower={tower} preview />
                  </div>
                  <div className="tower-copy">
                    <strong>{tower.name}</strong>
                    <span>{key === 'king' ? 'Torre central' : 'Torre lateral'}</span>
                    <div className="tower-stats">
                      <span>HP {tower.hp}</span>
                      <span>Daño {tower.damage}</span>
                      <span>Rango {tower.range}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <nav className="bottom-nav">
        <button className={tab === 'battle' ? 'active' : ''} onClick={() => setTab('battle')} type="button"><span className="nav-icon">ATK</span><strong>Batalla</strong></button>
        <button className={tab === 'cards' ? 'active' : ''} onClick={() => setTab('cards')} type="button"><span className="nav-icon">CRD</span><strong>Cartas</strong></button>
        <button className={tab === 'towers' ? 'active' : ''} onClick={() => setTab('towers')} type="button"><span className="nav-icon">TWR</span><strong>Torres</strong></button>
      </nav>
    </main>
  )
}
