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
type ProjectileKind = 'arrow' | 'cannonball' | 'fireball'
type ImpactKind = 'arrow-burst' | 'fireburst' | 'hit'

type Account = { name: string; level: number; gold: number; gems: number; trophies: number }
type ArtDirection = {
  silhouette: string
  palette: string
  animation: string
  iconic: string
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
  projectile?: ProjectileKind
  spawnCount?: number
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
  laneBias: number
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
  attackFx: ProjectileKind | 'melee'
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
type DragState = { cardIndex: number; x: number; y: number }
type Projectile = {
  id: number
  kind: ProjectileKind
  side: Side
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number
  duration: number
  arcHeight: number
  damage: number
  splashRadius: number
  towerScale: number
  effect: ImpactKind
}
type Impact = { id: number; kind: ImpactKind; x: number; y: number; radius: number; ttl: number }
type TargetRef = { kind: 'unit'; id: number; x: number; y: number } | { kind: 'tower'; id: string; x: number; y: number }
type BattleScore = { player: number; bot: number }
type TowerBlueprint = { name: string; role: string; hp: number; damage: number; range: number; cooldown: number }

const cols = 24
const rows = 24
const tileCount = cols * rows
const maxEnergy = 10
const battleDuration = 120

const cards: Card[] = [
  { id: 'knight', name: 'Caballero', role: 'Mini tanque', battleRole: 'Melee', type: 'unit', rarity: 'Common', cost: 2, level: 1, progress: 0, progressMax: 2, hp: 210, damage: 32, speed: 11, range: 5, cooldown: 0.95, movement: 'ground', attackTarget: 'ground', attackPattern: 'single', unitClass: 'troop', color: '#6b8fd8', accent: '#eff5ff', summary: 'Mini tanque barato para defender y acompanar pushes.', art: { silhouette: 'Casco ancho, espada corta y pecho blindado.', palette: 'Acero azul, plata y crema.', animation: 'Paso firme y corte frontal.', iconic: 'Espada recta y casco redondeado.', size: '1x1', tone: 'tank' } },
  { id: 'giant', name: 'Gigante', role: 'Tanque de asedio', battleRole: 'Solo torres', type: 'unit', rarity: 'Rare', cost: 5, level: 1, progress: 0, progressMax: 2, hp: 400, damage: 54, speed: 7, range: 5.5, cooldown: 1.2, movement: 'ground', attackTarget: 'buildings', attackPattern: 'single', unitClass: 'troop', color: '#c7854c', accent: '#ffe7ce', summary: 'Tanque pesado que empuja directo a las torres.', art: { silhouette: 'Masa enorme con brazos gigantes.', palette: 'Cuero tostado, piel calida y vendas.', animation: 'Pisadas lentas y punetazo vertical.', iconic: 'Punos grandes y cinturon ancho.', size: '2x2', tone: 'tank' } },
  { id: 'minipekka', name: 'Mini Peka', role: 'Asesino', battleRole: 'Mucho dano', type: 'unit', rarity: 'Rare', cost: 4, level: 1, progress: 0, progressMax: 2, hp: 180, damage: 66, speed: 10, range: 5, cooldown: 1.05, movement: 'ground', attackTarget: 'ground', attackPattern: 'single', unitClass: 'troop', color: '#6b5de5', accent: '#f4f1ff', summary: 'DPS alto para derretir tanques y castigar errores.', art: { silhouette: 'Yelmo triangular y espada pesada.', palette: 'Violeta metalico y blanco helado.', animation: 'Impulso corto y tajo fuerte.', iconic: 'Visor brillante y espada ancha.', size: '1x1', tone: 'damage' } },
  { id: 'archers', name: 'Arqueras', role: 'Doble apoyo', battleRole: 'Rango dual', type: 'unit', rarity: 'Rare', cost: 3, level: 1, progress: 0, progressMax: 2, hp: 132, damage: 26, speed: 10, range: 15, cooldown: 0.88, movement: 'ground', attackTarget: 'air-ground', attackPattern: 'single', unitClass: 'troop', projectile: 'arrow', spawnCount: 2, color: '#ff8fb9', accent: '#fff0f6', summary: 'Dos tropas independientes de apoyo a distancia.', art: { silhouette: 'Dos figuras ligeras con arcos altos.', palette: 'Rosa, crema y madera dorada.', animation: 'Tension de arco y disparo alternado.', iconic: 'Coletas y arcos gemelos.', size: '1x2', tone: 'support' } },
  { id: 'cannon', name: 'Canon', role: 'Estructura', battleRole: 'Defensa estatica', type: 'unit', rarity: 'Rare', cost: 4, level: 1, progress: 0, progressMax: 2, hp: 250, damage: 42, speed: 0, range: 16, cooldown: 1.15, movement: 'static', attackTarget: 'ground', attackPattern: 'single', unitClass: 'building', projectile: 'cannonball', color: '#627a8f', accent: '#dbf0ff', summary: 'Defensa solida para controlar empujes terrestres.', art: { silhouette: 'Base ancha con boca de canon frontal.', palette: 'Metal oscuro, roble y reflejos frios.', animation: 'Retroceso pesado al disparar.', iconic: 'Tubo ancho y carro robusto.', size: '2x2', tone: 'support' } },
  { id: 'minions', name: 'Esbirros', role: 'Escuadron aereo', battleRole: 'Aire rapido', type: 'unit', rarity: 'Common', cost: 3, level: 1, progress: 0, progressMax: 2, hp: 106, damage: 20, speed: 14, range: 5, cooldown: 0.7, movement: 'air', attackTarget: 'air-ground', attackPattern: 'single', unitClass: 'troop', spawnCount: 3, color: '#6277ff', accent: '#ebedff', summary: 'Tres unidades aereas rapidas para presion y defensa.', art: { silhouette: 'Tres demonios pequenos con alas marcadas.', palette: 'Indigo, lila y ojos claros.', animation: 'Aleteo nervioso y zarpazo corto.', iconic: 'Alas puntiagudas y garras.', size: '1x2', tone: 'damage' } },
  { id: 'arrows', name: 'Flechas', role: 'Hechizo', battleRole: 'Dano en area', type: 'spell', rarity: 'Common', cost: 3, level: 1, progress: 0, progressMax: 2, damage: 54, splashRadius: 13, color: '#efc56a', accent: '#fff5d5', summary: 'Lluvia rapida con recorrido visible y dano en area.', art: { silhouette: 'Volea diagonal con puntas brillantes.', palette: 'Dorado, roble y marfil.', animation: 'Caida rapida desde el cielo.', iconic: 'Haz de flechas y onda circular.', size: '1x2', tone: 'spell' } },
  { id: 'fireball', name: 'Bola de Fuego', role: 'Hechizo', battleRole: 'Area pesada', type: 'spell', rarity: 'Epic', cost: 4, level: 1, progress: 0, progressMax: 2, damage: 94, splashRadius: 15, color: '#ff8745', accent: '#ffe9ca', summary: 'Proyectil pesado con arco, impacto y explosion amplia.', art: { silhouette: 'Esfera ardiente con cola brillante.', palette: 'Naranja, rojo y amarillo caliente.', animation: 'Parabola con explosion intensa.', iconic: 'Nucleo incandescente y humo.', size: '1x2', tone: 'spell' } },
]

const towerBlueprints: Record<Tower['kind'], TowerBlueprint> = {
  archer: { name: 'Torre Princesa', role: 'Defensa lateral', hp: 420, damage: 28, range: 18, cooldown: 1.08 },
  king: { name: 'Torre del Rey', role: 'Nucleo central', hp: 900, damage: 34, range: 21, cooldown: 1.18 },
}

const initialDeck = ['knight', 'giant', 'minipekka', 'archers', 'cannon', 'minions', 'arrows', 'fireball']
const botDeck = ['knight', 'archers', 'cannon', 'minions', 'giant', 'fireball', 'arrows', 'minipekka']
const rarityClass: Record<Card['rarity'], string> = { Common: 'rarity-common', Rare: 'rarity-rare', Epic: 'rarity-epic', Legendary: 'rarity-legendary' }

const getCard = (cardId: string) => cards.find((card) => card.id === cardId)!
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
function formatTime(value: number) {
  const total = Math.max(0, Math.ceil(value))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
const sortByDistance = <T extends { x: number; y: number }>(source: { x: number; y: number }, items: T[]) => [...items].sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y))
function canHitTarget(attackTarget: AttackTarget, movement: MovementMode) {
  if (attackTarget === 'air-ground') return true
  if (attackTarget === 'ground') return movement !== 'air'
  return false
}
const getMovementLabel = (movement: MovementMode | undefined) => (!movement ? 'Instantaneo' : movement === 'air' ? 'Aereo' : movement === 'static' ? 'Estatico' : 'Terrestre')
const getTargetLabel = (target: AttackTarget | undefined) => (!target ? 'Area' : target === 'air-ground' ? 'Aire y tierra' : target === 'buildings' ? 'Solo estructuras' : 'Tierra')
const getPatternLabel = (pattern: AttackPattern | undefined) => (!pattern ? 'Impacto' : pattern === 'splash' ? 'Area' : 'Objetivo unico')
function makeTowers() {
  return [
    { id: 'bot-left', side: 'bot' as Side, x: 25, y: 24, hp: 420, maxHp: 420, damage: 28, range: 18, cooldown: 1.08, attackTimer: 0, kind: 'archer' as const },
    { id: 'bot-right', side: 'bot' as Side, x: 75, y: 24, hp: 420, maxHp: 420, damage: 28, range: 18, cooldown: 1.08, attackTimer: 0, kind: 'archer' as const },
    { id: 'bot-king', side: 'bot' as Side, x: 50, y: 10.5, hp: 900, maxHp: 900, damage: 34, range: 21, cooldown: 1.18, attackTimer: 0, kind: 'king' as const },
    { id: 'player-left', side: 'player' as Side, x: 25, y: 76, hp: 420, maxHp: 420, damage: 28, range: 18, cooldown: 1.08, attackTimer: 0, kind: 'archer' as const },
    { id: 'player-right', side: 'player' as Side, x: 75, y: 76, hp: 420, maxHp: 420, damage: 28, range: 18, cooldown: 1.08, attackTimer: 0, kind: 'archer' as const },
    { id: 'player-king', side: 'player' as Side, x: 50, y: 89.5, hp: 900, maxHp: 900, damage: 34, range: 21, cooldown: 1.18, attackTimer: 0, kind: 'king' as const },
  ]
}
function getProjectilePosition(projectile: Projectile) {
  const t = projectile.progress
  const x = projectile.fromX + (projectile.toX - projectile.fromX) * t
  const y = projectile.fromY + (projectile.toY - projectile.fromY) * t - Math.sin(Math.PI * t) * projectile.arcHeight
  const rotation = Math.atan2(projectile.toY - projectile.fromY, projectile.toX - projectile.fromX) * (180 / Math.PI)
  return { x, y, rotation }
}

function CardArt({ card, battle = false, tiny = false }: { card: Card; battle?: boolean; tiny?: boolean }) {
  return (
    <div className={`card-portrait art-${card.id} ${battle ? 'battle' : ''} ${tiny ? 'tiny' : ''}`}>
      <div className="portrait-backlight" />
      <div className="portrait-floor" />
      <div className="portrait-character">
        <span className="portrait-silhouette" />
        <span className="portrait-face" />
        <span className="portrait-gear" />
        <span className="portrait-weapon" />
        <span className="portrait-effect" />
      </div>
    </div>
  )
}
function CharacterVisual({ unit }: { unit: Unit }) {
  return (
    <div className={`battle-character char-${unit.cardId} side-${unit.side}`}>
      <div className="character-shadow" />
      <div className="character-ring" />
      <div className="character-core">
        <span className="body" />
        <span className="head" />
        <span className="helm" />
        <span className="arm arm-left" />
        <span className="arm arm-right" />
        <span className="legs" />
        <span className="weapon" />
        <span className="detail" />
        <span className="spark" />
      </div>
    </div>
  )
}
function TowerVisual({ tower, preview = false }: { tower: Tower | TowerBlueprint; preview?: boolean }) {
  const kind = 'kind' in tower ? tower.kind : tower.name.includes('Rey') ? 'king' : 'archer'
  const sideClass = preview ? 'player' : 'side' in tower ? tower.side : 'player'
  return (
    <div className={`tower-node ${kind} ${sideClass} ${preview ? 'preview' : ''}`}>
      <div className="tower-shadow" />
      <div className="tower-plinth" />
      <div className="tower-shell">
        <span className="tower-roof" />
        <span className="tower-rim" />
        <span className="tower-window" />
        <span className="tower-gate" />
        <span className="tower-flag" />
        <span className={kind === 'king' ? 'tower-crest' : 'tower-archer'} />
      </div>
    </div>
  )
}
function resolveProjectileImpacts(projectiles: Projectile[], currentUnits: Unit[], currentTowers: Tower[]) {
  let nextUnits = currentUnits
  let nextTowers = currentTowers
  let playerTowerDamage = 0
  let botTowerDamage = 0
  const impacts: Impact[] = []
  for (const projectile of projectiles) {
    impacts.push({ id: projectile.id, kind: projectile.effect, x: projectile.toX, y: projectile.toY, radius: projectile.splashRadius > 0 ? projectile.splashRadius : projectile.kind === 'arrow' ? 4.5 : 5.5, ttl: projectile.effect === 'fireburst' ? 0.6 : 0.38 })
    nextUnits = nextUnits.map((unit) => {
      if (unit.side === projectile.side) return unit
      const distance = Math.hypot(unit.x - projectile.toX, unit.y - projectile.toY)
      const hitRadius = projectile.splashRadius > 0 ? projectile.splashRadius : 4.2
      return distance <= hitRadius ? { ...unit, hp: unit.hp - projectile.damage } : unit
    }).filter((unit) => unit.hp > 0)
    nextTowers = nextTowers.map((tower) => {
      if (tower.side === projectile.side || tower.hp <= 0) return tower
      const distance = Math.hypot(tower.x - projectile.toX, tower.y - projectile.toY)
      const hitRadius = projectile.splashRadius > 0 ? projectile.splashRadius + 2 : 5
      if (distance > hitRadius) return tower
      const applied = Math.round(projectile.damage * projectile.towerScale)
      if (projectile.side === 'player') playerTowerDamage += applied
      else botTowerDamage += applied
      return { ...tower, hp: Math.max(0, tower.hp - applied) }
    })
  }
  return { nextUnits, nextTowers, impacts, playerTowerDamage, botTowerDamage }
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('battle')
  const [screen, setScreen] = useState<Screen>('home')
  const [account, setAccount] = useState<Account>({ name: 'Nuevo Pirata', level: 1, gold: 0, gems: 0, trophies: 0 })
  const [deck, setDeck] = useState<string[]>(initialDeck)
  const [battleQueue, setBattleQueue] = useState<string[]>(initialDeck)
  const [selectedDeckSlot, setSelectedDeckSlot] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState(initialDeck[0])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [towers, setTowers] = useState<Tower[]>(makeTowers())
  const [units, setUnits] = useState<Unit[]>([])
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [impacts, setImpacts] = useState<Impact[]>([])
  const [playerEnergy, setPlayerEnergy] = useState(5)
  const [botEnergy, setBotEnergy] = useState(5)
  const [timeLeft, setTimeLeft] = useState(battleDuration)
  const [result, setResult] = useState<string | null>(null)
  const [battleScore, setBattleScore] = useState<BattleScore>({ player: 0, bot: 0 })

  const arenaRef = useRef<HTMLDivElement | null>(null)
  const unitIdRef = useRef(1)
  const projectileIdRef = useRef(1)
  const impactIdRef = useRef(1)
  const unitsRef = useRef<Unit[]>([])
  const towersRef = useRef<Tower[]>(makeTowers())
  const projectilesRef = useRef<Projectile[]>([])
  const playerEnergyRef = useRef(5)
  const botEnergyRef = useRef(5)
  const timeRef = useRef(battleDuration)
  const botThinkRef = useRef(0)

  useEffect(() => {
    const stored = window.localStorage.getItem('pirates-card-battle-account')
    if (stored) setAccount(JSON.parse(stored) as Account)
  }, [])
  useEffect(() => { window.localStorage.setItem('pirates-card-battle-account', JSON.stringify(account)) }, [account])
  useEffect(() => { unitsRef.current = units }, [units])
  useEffect(() => { towersRef.current = towers }, [towers])
  useEffect(() => { projectilesRef.current = projectiles }, [projectiles])
  useEffect(() => { playerEnergyRef.current = playerEnergy }, [playerEnergy])
  useEffect(() => { botEnergyRef.current = botEnergy }, [botEnergy])
  useEffect(() => { timeRef.current = timeLeft }, [timeLeft])

  const visibleDeck = useMemo(() => deck.map((cardId) => getCard(cardId)), [deck])
  const battleHand = useMemo(() => battleQueue.slice(0, 4).map((cardId) => getCard(cardId)), [battleQueue])
  const nextCycleCard = useMemo(() => (battleQueue[4] ? getCard(battleQueue[4]) : getCard(battleQueue[0])), [battleQueue])
  const selectedDetailCard = getCard(selectedCardId)
  const averageElixir = useMemo(() => (visibleDeck.reduce((sum, card) => sum + card.cost, 0) / visibleDeck.length).toFixed(1), [visibleDeck])

  const resetBattle = () => {
    setTowers(makeTowers())
    setUnits([])
    setProjectiles([])
    setImpacts([])
    setBattleQueue(deck)
    setPlayerEnergy(5)
    setBotEnergy(5)
    setTimeLeft(battleDuration)
    setResult(null)
    setBattleScore({ player: 0, bot: 0 })
    unitIdRef.current = 1
    projectileIdRef.current = 1
    impactIdRef.current = 1
    botThinkRef.current = 0
  }
  const openBattle = () => { resetBattle(); setScreen('battle') }
  const cycleQueueAtIndex = (cardIndex: number) => setBattleQueue((current) => { const played = current[cardIndex]; const next = current.filter((_, index) => index !== cardIndex); return [...next, played] })
  const spawnImpact = (kind: ImpactKind, x: number, y: number, radius: number, ttl: number) => {
    setImpacts((current) => [...current, { id: impactIdRef.current++, kind, x, y, radius, ttl }])
  }

  const spawnProjectile = (kind: ProjectileKind, side: Side, fromX: number, fromY: number, toX: number, toY: number, damage: number, splashRadius = 0, towerScale = 1, effect: ImpactKind = 'hit') => {
    const distance = Math.hypot(toX - fromX, toY - fromY) || 1
    const duration = kind === 'fireball' ? clamp(distance / 40, 0.48, 0.8) : clamp(distance / 72, 0.16, 0.46)
    const arcHeight = kind === 'fireball' ? Math.max(8, distance * 0.2) : kind === 'arrow' ? Math.max(3, distance * 0.06) : Math.max(2, distance * 0.04)
    setProjectiles((current) => [...current, { id: projectileIdRef.current++, kind, side, fromX, fromY, toX, toY, progress: 0, duration, arcHeight, damage, splashRadius, towerScale, effect }])
  }

  const chooseTarget = (attacker: Unit, allUnits: Unit[], allTowers: Tower[]): TargetRef | null => {
    const enemyUnits = allUnits.filter((unit) => {
      if (unit.side === attacker.side) return false
      if (attacker.attackTarget === 'buildings') return unit.unitClass === 'building'
      return canHitTarget(attacker.attackTarget, unit.movement)
    })
    const enemyTowers = allTowers.filter((tower) => tower.side !== attacker.side && tower.hp > 0)
    if (attacker.attackTarget === 'buildings') {
      const building = sortByDistance(attacker, enemyUnits.filter((unit) => unit.unitClass === 'building'))[0]
      if (building) return { kind: 'unit', id: building.id, x: building.x, y: building.y }
      const tower = sortByDistance(attacker, enemyTowers)[0]
      return tower ? { kind: 'tower', id: tower.id, x: tower.x, y: tower.y } : null
    }
    const troop = sortByDistance(attacker, enemyUnits.filter((unit) => unit.unitClass === 'troop'))[0]
    if (troop) return { kind: 'unit', id: troop.id, x: troop.x, y: troop.y }
    const building = sortByDistance(attacker, enemyUnits.filter((unit) => unit.unitClass === 'building'))[0]
    if (building) return { kind: 'unit', id: building.id, x: building.x, y: building.y }
    const tower = sortByDistance(attacker, enemyTowers)[0]
    return tower ? { kind: 'tower', id: tower.id, x: tower.x, y: tower.y } : null
  }

  const summon = (cardId: string, side: Side, x: number, y: number) => {
    const card = getCard(cardId)
    if (card.type === 'spell') {
      if (card.id === 'fireball') {
        const fromY = side === 'player' ? 96 : 4
        spawnProjectile('fireball', side, x + (side === 'player' ? -10 : 10), fromY, x, y, card.damage, card.splashRadius ?? 14, 0.7, 'fireburst')
      } else if (card.id === 'arrows') {
        const offsets = [[0, 0], [-6, -4], [5, -5], [-3, 2], [4, 3], [2, 5]]
        offsets.forEach(([dx, dy], index) => {
          spawnProjectile('arrow', side, x + dx * 0.3, side === 'player' ? 98 - index * 1.5 : 2 + index * 1.5, x + dx, y + dy, index === 0 ? card.damage : 0, index === 0 ? card.splashRadius ?? 12 : 0, index === 0 ? 0.55 : 0, 'arrow-burst')
        })
      }
      return
    }

    const formation = (card.spawnCount ?? 1) === 2
      ? [{ dx: -2.7, dy: 0.5 }, { dx: 2.7, dy: -0.5 }]
      : (card.spawnCount ?? 1) === 3
        ? [{ dx: -3.1, dy: 0.8 }, { dx: 0, dy: -1.6 }, { dx: 3.1, dy: 0.8 }]
        : [{ dx: 0, dy: 0 }]

    const attackFx: Unit['attackFx'] = card.projectile ?? 'melee'

    setUnits((current) => [
      ...current,
      ...formation.map((offset, index) => ({
        id: unitIdRef.current + index,
        cardId: card.id,
        side,
        x: clamp(x + offset.dx, 7, 93),
        y: clamp(y + offset.dy, 7, 93),
        laneBias: offset.dx,
        hp: card.hp ?? 100,
        maxHp: card.hp ?? 100,
        damage: card.damage,
        speed: card.speed ?? 0,
        range: card.range ?? 6,
        cooldown: card.cooldown ?? 1,
        attackTimer: index * 0.12,
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
        attackFx,
      })),
    ])
    unitIdRef.current += formation.length
  }

  const deployDraggedCard = (cardIndex: number, tileIndex: number) => {
    const card = battleHand[cardIndex]
    if (!card || playerEnergyRef.current < card.cost || result) return
    const col = tileIndex % cols
    const row = Math.floor(tileIndex / cols)
    if (row < 12) return
    summon(card.id, 'player', (col + 0.5) * (100 / cols), (row + 0.5) * (100 / rows))
    setPlayerEnergy((current) => clamp(current - card.cost, 0, maxEnergy))
    cycleQueueAtIndex(cardIndex)
  }

  const onCardPointerDown = (cardIndex: number, event: React.PointerEvent<HTMLButtonElement>) => {
    const card = battleHand[cardIndex]
    if (!card || playerEnergyRef.current < card.cost || result) return
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
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
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
      const landedProjectiles: Projectile[] = []
      setTimeLeft((current) => Math.max(0, current - delta))
      setPlayerEnergy((current) => clamp(current + (timeRef.current <= 30 ? 0.9 : 0.46) * delta, 0, maxEnergy))
      setBotEnergy((current) => clamp(current + (timeRef.current <= 30 ? 0.9 : 0.46) * delta, 0, maxEnergy))
      setImpacts((current) => current.map((impact) => ({ ...impact, ttl: impact.ttl - delta })).filter((impact) => impact.ttl > 0))
      const nextProjectiles: Projectile[] = []
      for (const projectile of projectilesRef.current) {
        const nextProgress = projectile.progress + delta / projectile.duration
        if (nextProgress >= 1) landedProjectiles.push({ ...projectile, progress: 1 })
        else nextProjectiles.push({ ...projectile, progress: nextProgress })
      }
      setProjectiles(nextProjectiles)

      if (landedProjectiles.length > 0) {
        const resolved = resolveProjectileImpacts(landedProjectiles, unitsRef.current, towersRef.current)
        const generatedImpacts = resolved.impacts.map((impact) => ({ ...impact, id: impactIdRef.current++ }))
        setUnits(resolved.nextUnits)
        setTowers(resolved.nextTowers)
        if (generatedImpacts.length > 0) setImpacts((current) => [...current, ...generatedImpacts])
        if (resolved.playerTowerDamage || resolved.botTowerDamage) {
          setBattleScore((current) => ({ player: current.player + resolved.playerTowerDamage, bot: current.bot + resolved.botTowerDamage }))
        }
      }

      setUnits((currentUnits) => {
        const updated = currentUnits.map((unit) => ({ ...unit, attackTimer: Math.max(0, unit.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()
        const towerDamage = new Map<string, number>()
        let addedTowerDamagePlayer = 0
        let addedTowerDamageBot = 0

        for (const unit of updated) {
          const target = chooseTarget(unit, updated, towersRef.current)
          if (!target) continue
          const distance = Math.hypot(target.x - unit.x, target.y - unit.y)
          if (distance <= unit.range + (unit.attackFx === 'melee' ? 0.2 : 0)) {
            if (unit.attackTimer <= 0) {
              if (unit.attackFx === 'melee') {
                spawnImpact('hit', target.x, target.y, unit.attackPattern === 'splash' ? unit.splashRadius : 4, 0.24)
                if (target.kind === 'unit') unitDamage.set(target.id, (unitDamage.get(target.id) ?? 0) + unit.damage)
                else {
                  towerDamage.set(target.id, (towerDamage.get(target.id) ?? 0) + unit.damage)
                  if (unit.side === 'player') addedTowerDamagePlayer += unit.damage
                  else addedTowerDamageBot += unit.damage
                }
              } else {
                spawnProjectile(unit.attackFx, unit.side, unit.x, unit.y - (unit.movement === 'air' ? 6 : 2), target.x, target.y, unit.damage, unit.attackPattern === 'splash' ? unit.splashRadius : 0, target.kind === 'tower' ? 1 : 0.7, unit.attackFx === 'fireball' ? 'fireburst' : 'hit')
              }
              if (unit.attackPattern === 'splash' && unit.splashRadius > 0) {
                for (const enemy of updated) {
                  if (enemy.side === unit.side) continue
                  if (target.kind === 'unit' && enemy.id === target.id) continue
                  if (!canHitTarget(unit.attackTarget === 'buildings' ? 'ground' : unit.attackTarget, enemy.movement)) continue
                  if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= unit.splashRadius) unitDamage.set(enemy.id, (unitDamage.get(enemy.id) ?? 0) + Math.round(unit.damage * 0.6))
                }
              }
              unit.attackTimer = unit.cooldown
            }
            continue
          }
          if (unit.movement === 'static') continue
          const dx = target.x - unit.x + unit.laneBias * 0.06
          const dy = target.y - unit.y
          const norm = Math.hypot(dx, dy) || 1
          unit.x = clamp(unit.x + (dx / norm) * unit.speed * delta, 6, 94)
          unit.y = clamp(unit.y + (dy / norm) * unit.speed * delta, 6, 94)
        }

        if (towerDamage.size > 0) {
          setTowers((current) => current.map((tower) => towerDamage.has(tower.id) ? { ...tower, hp: Math.max(0, tower.hp - (towerDamage.get(tower.id) ?? 0)) } : tower))
          if (addedTowerDamagePlayer || addedTowerDamageBot) setBattleScore((current) => ({ player: current.player + addedTowerDamagePlayer, bot: current.bot + addedTowerDamageBot }))
        }

        return updated.map((unit) => unitDamage.has(unit.id) ? { ...unit, hp: unit.hp - (unitDamage.get(unit.id) ?? 0) } : unit).filter((unit) => unit.hp > 0)
      })

      setTowers((current) => {
        const updated = current.map((tower) => ({ ...tower, attackTimer: Math.max(0, tower.attackTimer - delta) }))
        for (const tower of updated) {
          if (tower.hp <= 0 || tower.attackTimer > 0) continue
          const target = sortByDistance(tower, unitsRef.current.filter((unit) => unit.side !== tower.side))[0]
          if (!target || Math.hypot(target.x - tower.x, target.y - tower.y) > tower.range) continue
          spawnProjectile('arrow', tower.side, tower.x, tower.y - 3, target.x, target.y, tower.damage, 0, 0.75, 'hit')
          tower.attackTimer = tower.cooldown
        }
        return updated
      })

      botThinkRef.current += delta
      if (botThinkRef.current >= 2.1) {
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
    const playerAlive = towers.filter((tower) => tower.side === 'player' && tower.hp > 0).length
    const botAlive = towers.filter((tower) => tower.side === 'bot' && tower.hp > 0).length
    if (playerAlive === 0) return void setResult('Derrota')
    if (botAlive === 0) return void setResult('Victoria')
    if (timeLeft <= 0) {
      if (battleScore.player > battleScore.bot) setResult('Victoria al tiempo')
      else if (battleScore.player < battleScore.bot) setResult('Derrota al tiempo')
      else setResult('Empate')
    }
  }, [battleScore, result, screen, timeLeft, towers])

  useEffect(() => {
    if (!result || screen !== 'battle') return
    const timeout = window.setTimeout(() => { resetBattle(); setScreen('home') }, 2200)
    return () => window.clearTimeout(timeout)
  }, [result, screen])

  if (screen === 'battle') {
    const enemyKing = towers.find((tower) => tower.id === 'bot-king')
    const playerKing = towers.find((tower) => tower.id === 'player-king')
    return (
      <main className="phone-shell battle-shell">
        <header className="battle-hud">
          <div className="hud-player enemy"><strong>Rival</strong><span>Dano a torres {battleScore.bot}</span></div>
          <div className="hud-center"><strong>{formatTime(timeLeft)}</strong><span>{result ?? 'Batalla en curso'}</span></div>
          <div className="hud-player"><strong>{account.name}</strong><span>Dano a torres {battleScore.player}</span></div>
        </header>

        <section className="battle-stage">
          <div className="king-bar enemy"><span>Torre del Rey rival</span><div className="health-bar"><i style={{ width: `${((enemyKing?.hp ?? 0) / (enemyKing?.maxHp ?? 1)) * 100}%` }} /></div></div>
          <div className="arena-board" ref={arenaRef}>
            <div className="arena-atmosphere" />
            <div className="arena-sun" />
            <div className="arena-cliff top" />
            <div className="arena-cliff bottom" />
            <div className="arena-river" />
            <div className="arena-foam" />
            <div className="bridge left-bridge" />
            <div className="bridge right-bridge" />
            <div className="tile-grid">
              {Array.from({ length: tileCount }).map((_, index) => {
                const row = Math.floor(index / cols)
                return <div className={`tile ${row >= 12 ? 'player-zone' : 'enemy-zone'}`} key={index} />
              })}
            </div>
            {towers.map((tower) => (
              <div className="battle-tower" key={tower.id} style={{ left: `${tower.x}%`, top: `${tower.y}%` }}>
                <TowerVisual tower={tower} />
                <div className="tower-hp-number">{tower.hp}</div>
                <div className="tower-hp"><i style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }} /></div>
              </div>
            ))}
            {projectiles.map((projectile) => {
              const position = getProjectilePosition(projectile)
              return <div className={`projectile projectile-${projectile.kind} ${projectile.side}`} key={projectile.id} style={{ left: `${position.x}%`, top: `${position.y}%`, transform: `translate(-50%, -50%) rotate(${position.rotation}deg)` }}><span className="projectile-core" /><span className="projectile-trail" /></div>
            })}
            {impacts.map((impact) => <div className={`impact impact-${impact.kind}`} key={impact.id} style={{ left: `${impact.x}%`, top: `${impact.y}%`, width: `${impact.radius * 2}px`, height: `${impact.radius * 2}px` }} />)}
            {units.map((unit) => (
              <div className={`unit-node ${unit.side} tone-${unit.tone} size-${unit.size.replace('x', '-')} move-${unit.movement}`} key={unit.id} style={{ left: `${unit.x}%`, top: `${unit.y}%` }}>
                <CharacterVisual unit={unit} />
                <div className="unit-label">{unit.name}</div>
                <div className="unit-hp-number">{unit.hp}</div>
                <div className="unit-hp"><i style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} /></div>
              </div>
            ))}
            {result ? <div className="result-overlay"><strong>{result}</strong><span>Volviendo al inicio...</span></div> : null}
          </div>
          <div className="king-bar player"><span>Torre del Rey</span><div className="health-bar"><i style={{ width: `${((playerKing?.hp ?? 0) / (playerKing?.maxHp ?? 1)) * 100}%` }} /></div></div>
        </section>

        <section className="battle-bottom">
          <aside className="next-card-panel">
            <span>Siguiente</span>
            <div className={`next-card ${rarityClass[nextCycleCard.rarity]} tone-${nextCycleCard.art.tone}`}>
              <div className="next-card-cost">{nextCycleCard.cost}</div>
              <CardArt card={nextCycleCard} tiny />
            </div>
          </aside>
          <div className="bottom-main">
            <div className="elixir-panel">
              <div><span>Elixir</span><strong>{playerEnergy.toFixed(1)} / 10</strong></div>
              <div className="elixir-pips">{Array.from({ length: 10 }).map((_, index) => <i className={playerEnergy >= index + 1 ? 'active' : playerEnergy > index ? 'partial' : ''} key={index} />)}</div>
              <div className="elixir-bar"><i style={{ width: `${(playerEnergy / maxEnergy) * 100}%` }} /></div>
            </div>
            <div className="hand-grid">
              {battleHand.map((card, index) => (
                <button className={`hand-card ${rarityClass[card.rarity]} tone-${card.art.tone} ${playerEnergy < card.cost ? 'disabled' : ''}`} key={`${card.id}-${index}`} onPointerDown={(event) => onCardPointerDown(index, event)} onPointerMove={onCardPointerMove} onPointerUp={onCardPointerUp} type="button">
                  <div className="hand-cost">{card.cost}</div>
                  <div className="card-frame"><CardArt card={card} battle /></div>
                  <strong>{card.name}</strong>
                  <span className="hand-role">{card.battleRole}</span>
                  <span className="hand-meta">{getPatternLabel(card.attackPattern)} · {getTargetLabel(card.attackTarget)}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {dragState ? <div className="drag-ghost" style={{ left: dragState.x, top: dragState.y }}><div className={`hand-card ghost ${rarityClass[battleHand[dragState.cardIndex].rarity]} tone-${battleHand[dragState.cardIndex].art.tone}`}><div className="hand-cost">{battleHand[dragState.cardIndex].cost}</div><div className="card-frame"><CardArt card={battleHand[dragState.cardIndex]} battle /></div><strong>{battleHand[dragState.cardIndex].name}</strong></div></div> : null}
      </main>
    )
  }

  return (
    <main className="phone-shell">
      {tab === 'battle' ? (
        <section className="page-panel">
          <header className="home-header">
            <div className="profile-panel"><div className="profile-avatar"><div className="profile-silhouette" /></div><div className="profile-level">{account.level}</div></div>
            <div className="arena-panel"><strong>Pirates Card Battle</strong><span>{account.trophies} trofeos</span></div>
            <div className="resources-panel"><div><span>Oro</span><strong>{account.gold}</strong></div><div><span>Gemas</span><strong>{account.gems}</strong></div></div>
          </header>
          <div className="account-card">
            <span>Capitan</span>
            <input className="name-input" onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value || 'Nuevo Pirata' }))} value={account.name} />
          </div>
          <div className="section-block">
            <h2>Combate</h2>
            <div className="system-grid">
              <article className="system-chip"><strong>Batalla Compacta</strong><span>Tiempo, elixir, siguiente ciclo y mano en la misma pantalla.</span></article>
              <article className="system-chip"><strong>Trayectorias</strong><span>Bola de fuego, flechas de torres, arqueras y hechizo con recorrido visible.</span></article>
              <article className="system-chip"><strong>Escuadras</strong><span>Arqueras en pareja y esbirros en trio como tropas independientes.</span></article>
              <article className="system-chip"><strong>Final de Partida</strong><span>Se decide por destruccion total o por dano a torres al terminar el tiempo.</span></article>
            </div>
          </div>
          <div className="section-block">
            <h2>Mazo</h2>
            <div className="deck-strip">
              {visibleDeck.map((card, index) => <article className={`deck-home-card ${rarityClass[card.rarity]} tone-${card.art.tone}`} key={`${card.id}-${index}`}><div className="card-frame"><CardArt card={card} /></div><span>{card.cost} elixir</span></article>)}
            </div>
            <div className="average-elixir">Coste medio: {averageElixir}</div>
          </div>
          <button className="battle-button" onClick={openBattle} type="button">Batalla</button>
          <div className="battle-subnote">Inspirado en la lectura de Clash Royale, pero con identidad pirata propia y una puesta en escena mucho mas marcada.</div>
        </section>
      ) : tab === 'cards' ? (
        <section className="page-panel">
          <div className="section-block"><h2>Mazo</h2><div className="deck-edit-grid">{visibleDeck.map((card, index) => <button className={`deck-edit-card ${selectedDeckSlot === index ? 'deck-edit-active' : ''} ${rarityClass[card.rarity]} tone-${card.art.tone}`} key={`${card.id}-${index}`} onClick={() => { setSelectedDeckSlot(index); setSelectedCardId(card.id) }} type="button"><div className="card-frame"><CardArt card={card} /></div><span>{card.cost}</span></button>)}</div></div>
          <div className="section-block">
            <h2>Carta</h2>
            <article className={`detail-card ${rarityClass[selectedDetailCard.rarity]} tone-${selectedDetailCard.art.tone}`}>
              <div className="detail-head"><div className="card-frame large-frame"><CardArt card={selectedDetailCard} /></div><div><strong>{selectedDetailCard.name}</strong><p>{selectedDetailCard.summary}</p></div></div>
              <div className="tag-row"><span className="tag">{selectedDetailCard.role}</span><span className="tag">{selectedDetailCard.battleRole}</span><span className="tag">{getMovementLabel(selectedDetailCard.movement)}</span><span className="tag">{getTargetLabel(selectedDetailCard.attackTarget)}</span><span className="tag">{getPatternLabel(selectedDetailCard.attackPattern)}</span><span className="tag">{selectedDetailCard.spawnCount ? `x${selectedDetailCard.spawnCount}` : selectedDetailCard.art.size}</span></div>
              <div className="stats-grid"><span>Dano: {selectedDetailCard.damage}</span><span>Vida: {selectedDetailCard.hp ?? '-'}</span><span>Velocidad: {selectedDetailCard.speed ?? '-'}</span><span>Rango: {selectedDetailCard.range ?? '-'}</span><span>Recarga: {selectedDetailCard.cooldown ?? '-'}</span><span>Area: {selectedDetailCard.splashRadius ?? '-'}</span></div>
            </article>
          </div>
          <div className="section-block"><h2>Coleccion</h2><div className="entry-list">{cards.map((card) => <button className={`store-entry ${rarityClass[card.rarity]} tone-${card.art.tone}`} key={card.id} onClick={() => { setSelectedCardId(card.id); setDeck((current) => current.map((value, index) => (index === selectedDeckSlot ? card.id : value))) }} type="button"><div className="mini-card-wrap"><CardArt card={card} /></div><div className="entry-copy"><strong>{card.name}</strong><span>{card.battleRole}</span><div className="mini-progress"><i style={{ width: `${(card.progress / card.progressMax) * 100}%` }} /></div></div><b>{card.cost}</b></button>)}</div></div>
        </section>
      ) : (
        <section className="page-panel"><div className="section-block"><h2>Torres</h2><div className="tower-blueprints">{Object.entries(towerBlueprints).map(([key, tower]) => <article className={`tower-card tone-${key === 'king' ? 'tank' : 'support'}`} key={key}><div className="tower-preview-wrap"><TowerVisual tower={tower} preview /></div><div className="tower-copy"><strong>{tower.name}</strong><span>{tower.role}</span><div className="tower-stats"><span>HP {tower.hp}</span><span>Dano {tower.damage}</span><span>Rango {tower.range}</span></div></div></article>)}</div></div></section>
      )}
      <nav className="bottom-nav">
        <button className={tab === 'battle' ? 'active' : ''} onClick={() => setTab('battle')} type="button"><span className="nav-icon">ATK</span><strong>Batalla</strong></button>
        <button className={tab === 'cards' ? 'active' : ''} onClick={() => setTab('cards')} type="button"><span className="nav-icon">CRD</span><strong>Cartas</strong></button>
        <button className={tab === 'towers' ? 'active' : ''} onClick={() => setTab('towers')} type="button"><span className="nav-icon">TWR</span><strong>Torres</strong></button>
      </nav>
    </main>
  )
}







