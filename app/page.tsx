'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Tab = 'shop' | 'battle' | 'cards'
type Screen = 'home' | 'battle'
type Side = 'player' | 'bot'
type CardType = 'unit' | 'spell'

type Account = {
  name: string
  level: number
  gold: number
  gems: number
  trophies: number
}

type Card = {
  id: string
  name: string
  role: string
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
  color: string
  accent: string
  priceGold: number
  priceGems: number
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
}

type DragState = {
  cardIndex: number
  x: number
  y: number
}

const cols = 24
const rows = 24
const tileCount = cols * rows
const maxEnergy = 10
const battleDuration = 120

const cards: Card[] = [
  { id: 'skipper', name: 'Skipper', role: 'Duelista rápido', type: 'unit', rarity: 'Common', cost: 2, level: 1, progress: 0, progressMax: 2, hp: 120, damage: 18, speed: 14, range: 5, cooldown: 0.75, color: '#f7c04f', accent: '#fff0c8', priceGold: 40, priceGems: 5 },
  { id: 'gunner', name: 'Coral Gunner', role: 'Tirador', type: 'unit', rarity: 'Common', cost: 3, level: 1, progress: 0, progressMax: 2, hp: 130, damage: 26, speed: 11, range: 13, cooldown: 1, color: '#73d7ff', accent: '#ecfcff', priceGold: 60, priceGems: 8 },
  { id: 'guard', name: 'Harbor Guard', role: 'Defensor', type: 'unit', rarity: 'Rare', cost: 3, level: 1, progress: 0, progressMax: 2, hp: 220, damage: 20, speed: 9, range: 5, cooldown: 0.95, color: '#8ce087', accent: '#efffe8', priceGold: 120, priceGems: 16 },
  { id: 'powder', name: 'Powder Burst', role: 'Explosión', type: 'spell', rarity: 'Common', cost: 3, level: 1, progress: 0, progressMax: 2, damage: 72, color: '#ff7da3', accent: '#ffe7ef', priceGold: 80, priceGems: 10 },
  { id: 'brute', name: 'Anchor Brute', role: 'Tanque', type: 'unit', rarity: 'Rare', cost: 5, level: 1, progress: 0, progressMax: 2, hp: 320, damage: 40, speed: 8, range: 5, cooldown: 1.1, color: '#ff9368', accent: '#ffe0d2', priceGold: 220, priceGems: 24 },
  { id: 'siren', name: 'Tide Siren', role: 'Maga de rango', type: 'unit', rarity: 'Epic', cost: 4, level: 1, progress: 0, progressMax: 2, hp: 150, damage: 24, speed: 10, range: 14, cooldown: 0.82, color: '#9b9fff', accent: '#f0f1ff', priceGold: 0, priceGems: 70 },
  { id: 'captain', name: 'Wave Captain', role: 'Líder', type: 'unit', rarity: 'Legendary', cost: 4, level: 1, progress: 0, progressMax: 2, hp: 230, damage: 30, speed: 11, range: 8, cooldown: 0.9, color: '#cfa2ff', accent: '#f7ecff', priceGold: 0, priceGems: 120 },
  { id: 'storm', name: 'Storm Call', role: 'Impacto pesado', type: 'spell', rarity: 'Epic', cost: 4, level: 1, progress: 0, progressMax: 2, damage: 98, color: '#89abff', accent: '#edf2ff', priceGold: 0, priceGems: 80 },
]

const initialDeck = ['skipper', 'gunner', 'guard', 'powder', 'skipper', 'gunner', 'guard', 'powder']
const initialOwned = ['skipper', 'gunner', 'guard', 'powder']
const botDeck = ['skipper', 'guard', 'gunner', 'powder', 'brute', 'siren', 'skipper', 'powder']

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

          const targetUnit = enemyUnits[0]
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

          const focus = targetUnit ?? targetTower
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

  const selectedDetailCard = getCard(selectedCardId)
  const selectedShopCost =
    selectedShopCard?.priceGold && selectedShopCard.priceGold > 0
      ? `${selectedShopCard.priceGold} oro`
      : `${selectedShopCard?.priceGems ?? 0} gemas`

  if (screen === 'battle') {
    return (
      <main className="phone-shell battle-shell">
        <header className="battle-hud">
          <div className="hud-player enemy">
            <strong>Rival</strong>
            <span>0</span>
          </div>
          <div className="hud-center">
            <strong>{formatTime(timeLeft)}</strong>
            <span>{result ?? 'Práctica'}</span>
          </div>
          <div className="hud-player">
            <strong>{account.name}</strong>
            <span>0</span>
          </div>
        </header>

        <section className="battle-arena-card">
          <div className="king-bar enemy">
            <span>Torre del Rey rival</span>
            <div className="health-bar"><i style={{ width: `${((towers.find((tower) => tower.id === 'bot-king')?.hp ?? 0) / 900) * 100}%` }} /></div>
          </div>

          <div className="arena-board" ref={arenaRef}>
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
                <div className="tower-body"><div className="tower-window" /></div>
                <div className="tower-hp"><i style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }} /></div>
              </div>
            ))}

            {units.map((unit) => (
              <div className={`unit-node ${unit.side}`} key={unit.id} style={{ left: `${unit.x}%`, top: `${unit.y}%` }}>
                <div className="unit-ring" />
                <div className="unit-card-portrait" style={{ background: `linear-gradient(180deg, ${unit.color}, ${unit.accent})` }}>
                  <div className="character-head" />
                  <div className="character-body" />
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
                className={`hand-card ${rarityClass[card.rarity]} ${playerEnergy < card.cost ? 'disabled' : ''}`}
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
                  </div>
                </div>
                <strong>{card.name}</strong>
              </button>
            ))}
          </div>

          <button className="exit-battle" onClick={() => setScreen('home')} type="button">
            Salir
          </button>
        </section>

        {dragState ? (
          <div className="drag-ghost" style={{ left: dragState.x, top: dragState.y }}>
            <div className={`hand-card ghost ${rarityClass[battleHand[dragState.cardIndex].rarity]}`}>
              <div className="hand-cost">{battleHand[dragState.cardIndex].cost}</div>
              <div className="card-frame">
                <div className="card-portrait battle" style={{ background: `linear-gradient(180deg, ${battleHand[dragState.cardIndex].color}, ${battleHand[dragState.cardIndex].accent})` }}>
                  <div className="character-head" />
                  <div className="character-body" />
                </div>
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
            <h2>Cofres</h2>
            <div className="chest-grid">
              {['Ready', 'Unlocking', 'Locked', 'Locked'].map((state, index) => (
                <article className={`chest-slot chest-${state.toLowerCase()}`} key={index}>
                  <div className="chest-visual"><div className="chest-lid" /><div className="chest-body" /></div>
                  <strong>{state === 'Ready' ? 'Silver Chest' : state === 'Unlocking' ? 'Gold Chest' : 'Chest Slot'}</strong>
                  <span>{state === 'Unlocking' ? '02:14:21' : state}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="section-block">
            <h2>Mazo activo</h2>
            <div className="deck-strip">
              {visibleDeck.map((card, index) => (
                <article className={`deck-home-card ${rarityClass[card.rarity]}`} key={`${card.id}-${index}`}>
                  <div className="card-frame">
                    <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }}>
                      <div className="character-head" />
                      <div className="character-body" />
                    </div>
                  </div>
                  <span>Nv {card.level}</span>
                </article>
              ))}
            </div>
            <div className="average-elixir">Coste medio de elixir: {averageElixir}</div>
          </div>

          <button className="battle-button" onClick={openBattle} type="button">Batalla</button>
          <div className="battle-subnote">El modo práctica no da premios.</div>
        </section>
      ) : tab === 'shop' ? (
        <section className="page-panel">
          <div className="section-block">
            <h2>Ofertas especiales</h2>
            <div className="offer-banner">
              <div className="offer-glow" />
              <strong>Pack fundador</strong>
              <span>Todo empieza en 0: no hay monedas, gemas ni trofeos al crear cuenta.</span>
            </div>
          </div>

          <div className="section-block">
            <h2>Cofres</h2>
            <div className="shop-grid">
              {['Silver', 'Gold', 'Magic', 'Giant'].map((name, index) => (
                <article className="shop-card" key={name}>
                  <div className={`shop-chest chest-tone-${index}`} />
                  <strong>{name} Chest</strong>
                  <button className="mini-buy" type="button">Bloqueado</button>
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
                  className={`deck-edit-card ${selectedDeckSlot === index ? 'deck-edit-active' : ''} ${rarityClass[card.rarity]}`}
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
            <article className={`detail-card ${rarityClass[selectedDetailCard.rarity]}`}>
              <div className="detail-head">
                <div className="card-frame">
                  <div className="card-portrait large" style={{ background: `linear-gradient(180deg, ${selectedDetailCard.color}, ${selectedDetailCard.accent})` }}>
                    <div className="character-head" />
                    <div className="character-body" />
                  </div>
                </div>
                <div>
                  <strong>{selectedDetailCard.name}</strong>
                  <p>{selectedDetailCard.role}</p>
                </div>
              </div>
              <div className="stats-grid">
                <span>Daño: {selectedDetailCard.damage}</span>
                <span>Vida: {selectedDetailCard.hp ?? '-'}</span>
                <span>Velocidad: {selectedDetailCard.speed ?? '-'}</span>
                <span>Rango: {selectedDetailCard.range ?? '-'}</span>
              </div>
            </article>
          </div>

          <div className="section-block">
            <h2>Colección</h2>
            <div className="entry-list">
              {ownedCards.map((card) => (
                <button
                  className={`store-entry ${rarityClass[card.rarity]}`}
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
                  </div>
                  <div className="entry-copy">
                    <strong>{card.name}</strong>
                    <span>Nivel {card.level}</span>
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
