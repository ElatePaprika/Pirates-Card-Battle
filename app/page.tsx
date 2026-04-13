'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Tab = 'shop' | 'battle' | 'cards'
type Screen = 'home' | 'battle'
type Side = 'player' | 'bot'
type CardType = 'unit' | 'spell'
type TargetType = 'ground' | 'air-ground' | 'buildings'
type RoleTone = 'tank' | 'damage' | 'support' | 'spell'

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
  target: TargetType
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
  color: string
  accent: string
  priceGold: number
  priceGems: number
  summary: string
  art: ArtDirection
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

type Unit = {
  id: number
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
  color: string
  accent: string
  name: string
  role: string
  target: TargetType
  tone: RoleTone
  size: ArtDirection['size']
}

type DragState = {
  cardIndex: number
  x: number
  y: number
}

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
    id: 'skipper',
    name: 'Skipper',
    role: 'Duelista rápido',
    battleRole: 'Presión barata',
    type: 'unit',
    target: 'ground',
    rarity: 'Common',
    cost: 2,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 120,
    damage: 18,
    speed: 14,
    range: 5,
    cooldown: 0.75,
    color: '#f3b34d',
    accent: '#fff0c4',
    priceGold: 40,
    priceGems: 5,
    summary: 'Unidad ligera de presión instantánea para forzar respuestas y castigar líneas vacías.',
    art: {
      silhouette: 'Pequeño pirata inclinado hacia delante con sombrero ladeado y espada corta muy visible.',
      shape: 'Figura angulada con centro de masa frontal y lectura clara en 1x1 tile.',
      palette: 'Amarillo salino, crema y cuero tostado para transmitir velocidad y agresión ligera.',
      iconic: 'Sombrero triangular, espada corta y pañuelo de alto contraste.',
      animation: 'Idle con rebote sobre los talones; ataque en estocada rápida con recuperación corta.',
      feedback: 'Trazo breve al atacar y flash blanco corto al conectar.',
      size: '1x1',
      tone: 'damage',
    },
  },
  {
    id: 'gunner',
    name: 'Coral Gunner',
    role: 'Tirador',
    battleRole: 'Eliminación a distancia',
    type: 'unit',
    target: 'air-ground',
    rarity: 'Common',
    cost: 3,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 130,
    damage: 26,
    speed: 11,
    range: 13,
    cooldown: 1,
    color: '#66d7ff',
    accent: '#ecfcff',
    priceGold: 60,
    priceGems: 8,
    summary: 'DPS lineal con proyectil visible y muy buena lectura para controlar unidades aéreas o terrestres.',
    art: {
      silhouette: 'Perfil vertical fino dominado por un rifle coralino largo y casco redondo.',
      shape: 'Cuerpo delgado, hombros estrechos y arma que define toda la lectura.',
      palette: 'Azul agua, cian eléctrico y gris perla para código visual de soporte ofensivo.',
      iconic: 'Arma alargada de coral, visor redondo y mochila de munición compacta.',
      animation: 'Idle con respiración sutil; disparo con anticipación mínima y fuerte retroceso.',
      feedback: 'Proyectil brillante con chispa en impacto y destello frío en boca del arma.',
      size: '1x2',
      tone: 'support',
    },
  },
  {
    id: 'guard',
    name: 'Harbor Guard',
    role: 'Defensor',
    battleRole: 'Contención',
    type: 'unit',
    target: 'ground',
    rarity: 'Rare',
    cost: 3,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 220,
    damage: 20,
    speed: 9,
    range: 5,
    cooldown: 0.95,
    color: '#75c66f',
    accent: '#efffe8',
    priceGold: 120,
    priceGems: 16,
    summary: 'Bloque compacto de defensa con presencia frontal clara y lectura inmediata de unidad resistente.',
    art: {
      silhouette: 'Escudo hexagonal ancho y porra corta sobresaliendo por un lateral.',
      shape: 'Volumen medio, centro de masa bajo y postura cuadrada.',
      palette: 'Verde puerto, beige arena y metal apagado para un rol de defensa estable.',
      iconic: 'Escudo ancho, remaches visibles y casco corto de guardia.',
      animation: 'Idle casi inmóvil; ataque con pequeño paso al frente y golpe de escudo.',
      feedback: 'Impacto contundente con polvo bajo y tinte rojo rápido al recibir daño.',
      size: '1x2',
      tone: 'tank',
    },
  },
  {
    id: 'powder',
    name: 'Powder Burst',
    role: 'Explosión en área',
    battleRole: 'Limpieza de enjambre',
    type: 'spell',
    target: 'air-ground',
    rarity: 'Common',
    cost: 3,
    level: 1,
    progress: 0,
    progressMax: 2,
    damage: 72,
    range: 16,
    color: '#ff7da3',
    accent: '#ffe7ef',
    priceGold: 80,
    priceGems: 10,
    summary: 'Hechizo circular de respuesta rápida para romper acumulaciones y castigar apoyos agrupados.',
    art: {
      silhouette: 'Marcador circular de pólvora con mecha encendida y borde irregular.',
      shape: 'Forma redonda compacta con centro brillante y humo periférico.',
      palette: 'Rosa explosivo, naranja pólvora y humo crema para destacar sobre el tablero.',
      iconic: 'Mecha chispeante, anillo de combustión y nube corta de ceniza.',
      animation: 'Advertencia en suelo, chispa descendente e impacto esférico con expansión veloz.',
      feedback: 'Glow intenso, onda exterior y partículas negras con pequeño temblor visual.',
      size: '1x2',
      tone: 'spell',
    },
  },
  {
    id: 'brute',
    name: 'Anchor Brute',
    role: 'Tanque',
    battleRole: 'Win condition',
    type: 'unit',
    target: 'buildings',
    rarity: 'Rare',
    cost: 5,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 320,
    damage: 40,
    speed: 8,
    range: 5,
    cooldown: 1.1,
    color: '#ff8e63',
    accent: '#ffe0d2',
    priceGold: 220,
    priceGems: 24,
    summary: 'Tanque principal de silueta enorme y objetivo estructural prioritario para abrir la partida.',
    art: {
      silhouette: 'Masa corporal muy grande con ancla descomunal sobre el hombro.',
      shape: 'Volumétrico, redondeado y pesado, ocupando lectura de 2x2 tiles.',
      palette: 'Naranja quemado, hierro oscuro y cuerda arena para un tanque muy reconocible.',
      iconic: 'Ancla sobredimensionada, brazales metálicos y cinturones gruesos.',
      animation: 'Pasos lentos y pesados; ataque con elevación larga del ancla y golpe descendente.',
      feedback: 'Golpe con polvo radial, sacudida breve y flash cálido de alto peso.',
      size: '2x2',
      tone: 'tank',
    },
  },
  {
    id: 'siren',
    name: 'Tide Siren',
    role: 'Maga de rango',
    battleRole: 'Control de línea',
    type: 'unit',
    target: 'air-ground',
    rarity: 'Epic',
    cost: 4,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 150,
    damage: 24,
    speed: 10,
    range: 14,
    cooldown: 0.82,
    color: '#8f97ff',
    accent: '#f0f1ff',
    priceGold: 0,
    priceGems: 70,
    summary: 'Maga estilizada con proyectil acuático para control sostenido y lectura premium.',
    art: {
      silhouette: 'Figura curvada con báculo de caracola brillante y velo ondulante.',
      shape: 'Estilizada, flotante y de eje vertical largo, muy distinta al resto del mazo.',
      palette: 'Violeta marino, azul claro y blanco nacarado con glow suave.',
      iconic: 'Báculo con caracola luminosa, cabello flotante y aura marina tenue.',
      animation: 'Idle con levitación; ataque con compresión de agua y liberación elástica.',
      feedback: 'Splash pequeño, estela líquida y destello violeta-azulado al impactar.',
      size: '1x2',
      tone: 'support',
    },
  },
  {
    id: 'captain',
    name: 'Wave Captain',
    role: 'Líder híbrido',
    battleRole: 'Presión versátil',
    type: 'unit',
    target: 'ground',
    rarity: 'Legendary',
    cost: 4,
    level: 1,
    progress: 0,
    progressMax: 2,
    hp: 230,
    damage: 30,
    speed: 11,
    range: 8,
    cooldown: 0.9,
    color: '#c99cff',
    accent: '#f7ecff',
    priceGold: 0,
    priceGems: 120,
    summary: 'Unidad de prestigio con presencia de comandante, perfil híbrido y excelente legibilidad.',
    art: {
      silhouette: 'Capitán con sable curvo, hombreras amplias y capa corta muy marcada.',
      shape: 'Intermedia entre tanque y DPS, con torso ancho y arma elegante.',
      palette: 'Violeta real, dorado viejo y azul profundo para jerarquía visual.',
      iconic: 'Sable curvo, abrigo corto y emblema dorado en pecho u hombros.',
      animation: 'Idle con capa agitándose; ataque en corte barrido con estela de agua.',
      feedback: 'Arco luminoso sutil, chispas acuáticas y golpe de prioridad media.',
      size: '1x2',
      tone: 'damage',
    },
  },
  {
    id: 'storm',
    name: 'Storm Call',
    role: 'Impacto pesado',
    battleRole: 'Remate de alto valor',
    type: 'spell',
    target: 'air-ground',
    rarity: 'Epic',
    cost: 4,
    level: 1,
    progress: 0,
    progressMax: 2,
    damage: 98,
    range: 16,
    color: '#7f9dff',
    accent: '#edf2ff',
    priceGold: 0,
    priceGems: 80,
    summary: 'Hechizo de burst con telegraph muy claro para rematar pushes o cerrar daño sobre torre.',
    art: {
      silhouette: 'Nube compacta con rayo vertical concentrado en el centro de un círculo de aviso.',
      shape: 'Vertical y focalizada, con lectura de caída puntual y halo eléctrico.',
      palette: 'Azul tormenta, blanco eléctrico y lila frío con glow intenso.',
      iconic: 'Rayo central, anillo de electricidad y grieta luminosa residual.',
      animation: 'Suelo se oscurece, aparecen chispas y cae un rayo con flash de alta prioridad.',
      feedback: 'Distorsión ligera, residuo eléctrico breve y golpe más brillante que Powder Burst.',
      size: '1x2',
      tone: 'spell',
    },
  },
]

const towerBlueprints: Record<Tower['kind'], TowerBlueprint> = {
  archer: {
    name: 'Princess Tower',
    role: 'Defensa lateral',
    hp: 420,
    damage: 22,
    range: 18,
    cooldown: 1.1,
    architecture: 'Base cuadrada de piedra y madera con plataforma abierta y arquera visible.',
    color: 'Piedra gris/beige con banners y tejado azul o rojo según el equipo.',
    animation: 'Recoil ligero al disparar y arquera en pose activa constante.',
    feedback: 'Proyectil visible, impacto corto y barra de vida siempre legible.',
  },
  king: {
    name: 'King Tower',
    role: 'Núcleo central',
    hp: 900,
    damage: 28,
    range: 22,
    cooldown: 1.25,
    architecture: 'Estructura más alta, más ancha y rematada con corona y acentos dorados.',
    color: 'Piedra neutra reforzada con detalles reales azules o rojos.',
    animation: 'En reposo se siente pesada; al activarse intensifica el disparo y la presencia visual.',
    feedback: 'Impacto ligeramente mayor, brillo en corona y lectura jerárquica inmediata.',
  },
}

const initialDeck = ['skipper', 'gunner', 'guard', 'powder', 'brute', 'siren', 'captain', 'storm']
const initialOwned = ['skipper', 'gunner', 'guard', 'powder', 'brute', 'siren', 'captain', 'storm']
const botDeck = ['skipper', 'guard', 'gunner', 'powder', 'brute', 'siren', 'captain', 'storm']

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

function getTargetLabel(target: TargetType) {
  switch (target) {
    case 'ground':
      return 'Tierra'
    case 'air-ground':
      return 'Aire y tierra'
    case 'buildings':
      return 'Estructuras'
  }
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('battle')
  const [screen, setScreen] = useState<Screen>('home')
  const [account, setAccount] = useState<Account>({ name: 'New Pirate', level: 1, gold: 0, gems: 0, trophies: 0 })
  const [owned, setOwned] = useState<string[]>(initialOwned)
  const [deck, setDeck] = useState<string[]>(initialDeck)
  const [selectedDeckSlot, setSelectedDeckSlot] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState(deck[0])
  const [shopSelection, setShopSelection] = useState(0)
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
  const shopCards = useMemo(() => cards.filter((card) => !owned.includes(card.id)), [owned])
  const selectedShopCard = shopCards[shopSelection] ?? null
  const selectedDetailCard = getCard(selectedCardId)
  const averageElixir = useMemo(() => (visibleDeck.reduce((sum, card) => sum + card.cost, 0) / visibleDeck.length).toFixed(1), [visibleDeck])
  const selectedShopCost =
    selectedShopCard?.priceGold && selectedShopCard.priceGold > 0
      ? `${selectedShopCard.priceGold} oro`
      : `${selectedShopCard?.priceGems ?? 0} gemas`

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

  const buySelectedCard = () => {
    if (!selectedShopCard) return
    if (selectedShopCard.priceGold > 0 && account.gold < selectedShopCard.priceGold) return
    if (selectedShopCard.priceGems > 0 && account.gems < selectedShopCard.priceGems) return

    setAccount((current) => ({
      ...current,
      gold: current.gold - selectedShopCard.priceGold,
      gems: current.gems - selectedShopCard.priceGems,
    }))
    setOwned((current) => [...current, selectedShopCard.id])
    setShopSelection(0)
  }

  const swapDeckCard = (cardId: string) => {
    setDeck((current) => current.map((value, index) => (index === selectedDeckSlot ? cardId : value)))
    setSelectedCardId(cardId)
  }

  const summon = (cardId: string, side: Side, x: number, y: number) => {
    const card = getCard(cardId)

    if (card.type === 'spell') {
      setUnits((current) =>
        current
          .map((unit) => {
            if (unit.side === side) return unit
            const distance = Math.hypot(unit.x - x, unit.y - y)
            return distance <= 16 ? { ...unit, hp: unit.hp - card.damage } : unit
          })
          .filter((unit) => unit.hp > 0)
      )

      setTowers((current) =>
        current.map((tower) => {
          if (tower.side === side) return tower
          const distance = Math.hypot(tower.x - x, tower.y - y)
          return distance <= 18 ? { ...tower, hp: Math.max(0, tower.hp - Math.round(card.damage * 0.68)) } : tower
        })
      )
      return
    }

    setUnits((current) => [
      ...current,
      {
        id: unitIdRef.current++,
        side,
        x,
        y,
        hp: card.hp ?? 100,
        maxHp: card.hp ?? 100,
        damage: card.damage,
        speed: card.speed ?? 10,
        range: card.range ?? 6,
        cooldown: card.cooldown ?? 1,
        attackTimer: 0,
        color: card.color,
        accent: card.accent,
        name: card.name,
        role: card.role,
        target: card.target,
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

  useEffect(() => {
    if (screen !== 'battle' || result) return

    const timer = window.setInterval(() => {
      const delta = 0.1
      setTimeLeft((current) => Math.max(0, current - delta))

      const regen = timeRef.current <= 30 ? 0.82 : 0.42
      setPlayerEnergy((current) => clamp(current + regen * delta, 0, maxEnergy))
      setBotEnergy((current) => clamp(current + regen * delta, 0, maxEnergy))

      setUnits((currentUnits) => {
        const updated = currentUnits.map((unit) => ({ ...unit, attackTimer: Math.max(0, unit.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()
        const towerDamage = new Map<string, number>()

        for (const unit of updated) {
          const enemyUnits = updated
            .filter((other) => other.side !== unit.side)
            .sort((a, b) => Math.hypot(a.x - unit.x, a.y - unit.y) - Math.hypot(b.x - unit.x, b.y - unit.y))

          const enemyTowers = towersRef.current
            .filter((tower) => tower.side !== unit.side && tower.hp > 0)
            .sort((a, b) => Math.hypot(a.x - unit.x, a.y - unit.y) - Math.hypot(b.x - unit.x, b.y - unit.y))

          const targetUnit = unit.target === 'buildings' ? undefined : enemyUnits[0]
          const targetTower = enemyTowers[0]

          if (targetUnit && Math.hypot(targetUnit.x - unit.x, targetUnit.y - unit.y) <= unit.range) {
            if (unit.attackTimer <= 0) {
              unitDamage.set(targetUnit.id, (unitDamage.get(targetUnit.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          if (targetTower && Math.hypot(targetTower.x - unit.x, targetTower.y - unit.y) <= unit.range) {
            if (unit.attackTimer <= 0) {
              towerDamage.set(targetTower.id, (towerDamage.get(targetTower.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          const focus = targetTower ?? targetUnit
          if (focus) {
            const dx = focus.x - unit.x
            const dy = focus.y - unit.y
            const distance = Math.hypot(dx, dy) || 1
            unit.x = clamp(unit.x + (dx / distance) * unit.speed * delta, 6, 94)
            unit.y = clamp(unit.y + (dy / distance) * unit.speed * delta, 6, 94)
          } else {
            const direction = unit.side === 'player' ? -1 : 1
            unit.y = clamp(unit.y + unit.speed * delta * direction, 6, 94)
          }
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
          const target = unitsRef.current
            .filter((unit) => unit.side !== tower.side)
            .sort((a, b) => Math.hypot(a.x - tower.x, a.y - tower.y) - Math.hypot(b.x - tower.x, b.y - tower.y))[0]

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
      if (botThinkRef.current >= 2.3) {
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
      setResult(playerScore >= botScore ? 'Victoria a tiempo' : 'Derrota a tiempo')
    }
  }, [screen, result, towers, timeLeft])

  if (screen === 'battle') {
    return (
      <main className="phone-shell battle-shell">
        <header className="battle-hud">
          <div className="hud-player enemy">
            <strong>Rival</strong>
            <span>0 coronas</span>
          </div>
          <div className="hud-center">
            <strong>{formatTime(timeLeft)}</strong>
            <span>{result ?? 'Práctica'}</span>
          </div>
          <div className="hud-player">
            <strong>{account.name}</strong>
            <span>0 coronas</span>
          </div>
        </header>

        <section className="battle-arena-card">
          <div className="king-bar enemy">
            <span>Torre del Rey rival</span>
            <div className="health-bar"><i style={{ width: `${((towers.find((tower) => tower.id === 'bot-king')?.hp ?? 0) / 900) * 100}%` }} /></div>
          </div>

          <div className="arena-board" ref={arenaRef}>
            <div className="arena-atmosphere" />
            <div className="arena-half enemy-half" />
            <div className="arena-river" />
            <div className="arena-half player-half" />
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
              <div className={`tower-node ${tower.side} ${tower.kind}`} key={tower.id} style={{ left: `${tower.x}%`, top: `${tower.y}%` }}>
                <div className="tower-shadow" />
                <div className="tower-crown" />
                <div className="tower-body">
                  <div className="tower-window" />
                  {tower.kind === 'archer' ? <div className="tower-archer" /> : <div className="tower-emblem" />}
                </div>
                <div className="tower-hp"><i style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }} /></div>
              </div>
            ))}

            {units.map((unit) => (
              <div className={`unit-node ${unit.side} tone-${unit.tone} size-${unit.size.replace('x', '-')}`} key={unit.id} style={{ left: `${unit.x}%`, top: `${unit.y}%` }}>
                <div className="unit-ring" />
                <div className="unit-card-portrait" style={{ background: `linear-gradient(180deg, ${unit.color}, ${unit.accent})` }}>
                  <div className="character-head" />
                  <div className="character-body" />
                  <div className="character-gear" />
                </div>
                <div className="unit-hp"><i style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} /></div>
              </div>
            ))}
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
                  <div className="card-portrait battle" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }}>
                    <div className="character-head" />
                    <div className="character-body" />
                    <div className="character-gear" />
                  </div>
                </div>
                <strong>{card.name}</strong>
                <span className="hand-role">{card.battleRole}</span>
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
                <div className="card-portrait battle" style={{ background: `linear-gradient(180deg, ${battleHand[dragState.cardIndex].color}, ${battleHand[dragState.cardIndex].accent})` }}>
                  <div className="character-head" />
                  <div className="character-body" />
                  <div className="character-gear" />
                </div>
              </div>
              <strong>{battleHand[dragState.cardIndex].name}</strong>
              <span className="hand-role">{battleHand[dragState.cardIndex].battleRole}</span>
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
              <strong>Arena Inicial</strong>
              <span>{account.trophies} trofeos</span>
            </div>
            <div className="resources-panel">
              <div><span>Oro</span><strong>{account.gold}</strong></div>
              <div><span>Gemas</span><strong>{account.gems}</strong></div>
            </div>
          </header>

          <div className="account-card">
            <span>Cuenta</span>
            <input
              className="name-input"
              onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value || 'New Pirate' }))}
              value={account.name}
            />
          </div>

          <div className="section-block">
            <h2>Sistema visual</h2>
            <div className="system-grid">
              <article className="system-chip">
                <strong>Silueta</strong>
                <span>Reconocimiento en menos de 300 ms por forma y postura.</span>
              </article>
              <article className="system-chip">
                <strong>Color</strong>
                <span>Tanque oscuro, daño cálido, soporte frío y hechizo brillante.</span>
              </article>
              <article className="system-chip">
                <strong>Animación</strong>
                <span>Anticipación, impacto y recuperación en cada acción relevante.</span>
              </article>
              <article className="system-chip">
                <strong>Escala</strong>
                <span>Unidades entre 1x1 y 2x2 tiles con masa clara según su rol.</span>
              </article>
            </div>
          </div>

          <div className="section-block">
            <h2>Mazo activo</h2>
            <div className="deck-strip">
              {visibleDeck.map((card, index) => (
                <article className={`deck-home-card ${rarityClass[card.rarity]} tone-${card.art.tone}`} key={`${card.id}-${index}`}>
                  <div className="card-frame">
                    <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }}>
                      <div className="character-head" />
                      <div className="character-body" />
                      <div className="character-gear" />
                    </div>
                  </div>
                  <span>Nv {card.level}</span>
                </article>
              ))}
            </div>
            <div className="average-elixir">Coste medio de elixir: {averageElixir}</div>
          </div>

          <button className="battle-button" onClick={openBattle} type="button">Batalla</button>
          <div className="battle-subnote">El modo práctica sirve para probar lectura visual y ritmo de combate.</div>
        </section>
      ) : tab === 'shop' ? (
        <section className="page-panel">
          <div className="section-block">
            <h2>Ofertas especiales</h2>
            <div className="offer-banner">
              <div className="offer-glow" />
              <strong>Pack fundador</strong>
              <span>Las cartas ya nacen con identidad visual fuerte y diferenciación inmediata por rol.</span>
            </div>
          </div>

          <div className="section-block">
            <h2>Torres</h2>
            <div className="tower-blueprints">
              {Object.entries(towerBlueprints).map(([key, tower]) => (
                <article className={`tower-card tone-${key === 'king' ? 'tank' : 'support'}`} key={key}>
                  <div className={`tower-preview ${key}`}>
                    <div className="tower-shadow" />
                    <div className="tower-crown" />
                    <div className="tower-body">
                      <div className="tower-window" />
                      {key === 'archer' ? <div className="tower-archer" /> : <div className="tower-emblem" />}
                    </div>
                  </div>
                  <div className="tower-copy">
                    <strong>{tower.name}</strong>
                    <span>{tower.role}</span>
                    <p>{tower.architecture}</p>
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

          <div className="section-block">
            <h2>Cartas diarias</h2>
            <div className="entry-list">
              {shopCards.map((card, index) => (
                <button
                  className={`store-entry ${shopSelection === index ? 'store-entry-active' : ''}`}
                  key={card.id}
                  onClick={() => setShopSelection(index)}
                  type="button"
                >
                  <div className={`mini-card-art ${rarityClass[card.rarity]}`} style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }}>
                    <div className="character-head" />
                    <div className="character-body" />
                    <div className="character-gear" />
                  </div>
                  <div className="entry-copy">
                    <strong>{card.name}</strong>
                    <span>{card.rarity}</span>
                  </div>
                  <b>{card.priceGold > 0 ? `${card.priceGold} oro` : `${card.priceGems} gemas`}</b>
                </button>
              ))}
            </div>
            {selectedShopCard ? <button className="buy-main" onClick={buySelectedCard} type="button">Comprar {selectedShopCard.name} · {selectedShopCost}</button> : null}
          </div>
        </section>
      ) : (
        <section className="page-panel">
          <div className="section-block">
            <h2>Mazo activo</h2>
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
                    <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }}>
                      <div className="character-head" />
                      <div className="character-body" />
                      <div className="character-gear" />
                    </div>
                  </div>
                  <span>{card.level}</span>
                </button>
              ))}
            </div>
            <div className="average-elixir">Coste medio de elixir: {averageElixir}</div>
          </div>

          <div className="section-block">
            <h2>Detalle</h2>
            <article className={`detail-card ${rarityClass[selectedDetailCard.rarity]} tone-${selectedDetailCard.art.tone}`}>
              <div className="detail-head">
                <div className="card-frame">
                  <div className="card-portrait large" style={{ background: `linear-gradient(180deg, ${selectedDetailCard.color}, ${selectedDetailCard.accent})` }}>
                    <div className="character-head" />
                    <div className="character-body" />
                    <div className="character-gear" />
                  </div>
                </div>
                <div>
                  <strong>{selectedDetailCard.name}</strong>
                  <p>{selectedDetailCard.summary}</p>
                </div>
              </div>

              <div className="tag-row">
                <span className="tag">{selectedDetailCard.role}</span>
                <span className="tag">{selectedDetailCard.battleRole}</span>
                <span className="tag">{getToneLabel(selectedDetailCard.art.tone)}</span>
                <span className="tag">{getTargetLabel(selectedDetailCard.target)}</span>
                <span className="tag">{selectedDetailCard.art.size}</span>
              </div>

              <div className="stats-grid">
                <span>Daño: {selectedDetailCard.damage}</span>
                <span>Vida: {selectedDetailCard.hp ?? '-'}</span>
                <span>Velocidad: {selectedDetailCard.speed ?? '-'}</span>
                <span>Rango: {selectedDetailCard.range ?? '-'}</span>
                <span>Cooldown: {selectedDetailCard.cooldown ?? '-'}</span>
                <span>Coste: {selectedDetailCard.cost}</span>
              </div>

              <div className="lore-grid">
                <article>
                  <strong>Silueta y forma</strong>
                  <p>{selectedDetailCard.art.silhouette} {selectedDetailCard.art.shape}</p>
                </article>
                <article>
                  <strong>Color y lectura</strong>
                  <p>{selectedDetailCard.art.palette}</p>
                </article>
                <article>
                  <strong>Detalles y animación</strong>
                  <p>{selectedDetailCard.art.iconic} {selectedDetailCard.art.animation}</p>
                </article>
                <article>
                  <strong>Feedback visual</strong>
                  <p>{selectedDetailCard.art.feedback}</p>
                </article>
              </div>
            </article>
          </div>

          <div className="section-block">
            <h2>Colección</h2>
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
                  <div className="mini-card-art" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }}>
                    <div className="character-head" />
                    <div className="character-body" />
                    <div className="character-gear" />
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
      )}

      <nav className="bottom-nav">
        <button className={tab === 'shop' ? 'active' : ''} onClick={() => setTab('shop')} type="button"><span className="nav-icon">◈</span><strong>Tienda</strong></button>
        <button className={tab === 'battle' ? 'active' : ''} onClick={() => setTab('battle')} type="button"><span className="nav-icon">⚔</span><strong>Batalla</strong></button>
        <button className={tab === 'cards' ? 'active' : ''} onClick={() => setTab('cards')} type="button"><span className="nav-icon">▣</span><strong>Cartas</strong></button>
      </nav>
    </main>
  )
}
