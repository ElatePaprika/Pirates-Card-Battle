'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Tab = 'shop' | 'battle' | 'cards'
type Screen = 'home' | 'battle'
type Side = 'player' | 'bot'
type Lane = 0 | 1
type CardType = 'unit' | 'spell'

type Card = {
  id: string
  name: string
  type: CardType
  role: string
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
  price: number
  stock: number
}

type Tower = {
  id: string
  side: Side
  lane: Lane | null
  x: number
  y: number
  hp: number
  maxHp: number
  damage: number
  range: number
  cooldown: number
  attackTimer: number
}

type Unit = {
  id: number
  side: Side
  lane: Lane
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
}

type ChestSlot = {
  id: number
  name: string
  state: 'locked' | 'unlocking' | 'ready'
  remaining?: string
}

type DragState = {
  cardIndex: number
  x: number
  y: number
}

const cards: Card[] = [
  { id: 'skipper', name: 'Skipper', type: 'unit', role: 'Espadachin veloz', rarity: 'Common', cost: 2, level: 8, progress: 18, progressMax: 50, hp: 120, damage: 18, speed: 10, range: 5, cooldown: 0.8, color: '#ffca63', accent: '#fff1c7', price: 40, stock: 20 },
  { id: 'gunner', name: 'Coral Gunner', type: 'unit', role: 'Tirador de apoyo', rarity: 'Common', cost: 3, level: 7, progress: 7, progressMax: 20, hp: 130, damage: 28, speed: 7, range: 18, cooldown: 1.05, color: '#80d9ff', accent: '#ecfbff', price: 60, stock: 10 },
  { id: 'guard', name: 'Harbor Guard', type: 'unit', role: 'Defensa estable', rarity: 'Rare', cost: 3, level: 6, progress: 3, progressMax: 10, hp: 220, damage: 21, speed: 5, range: 5, cooldown: 0.95, color: '#97e58e', accent: '#efffe9', price: 120, stock: 5 },
  { id: 'powder', name: 'Powder Burst', type: 'spell', role: 'Explosión rápida', rarity: 'Common', cost: 3, level: 8, progress: 24, progressMax: 50, damage: 72, color: '#ff7ea7', accent: '#ffe7ef', price: 80, stock: 15 },
  { id: 'brute', name: 'Anchor Brute', type: 'unit', role: 'Tanque frontal', rarity: 'Rare', cost: 5, level: 5, progress: 1, progressMax: 4, hp: 310, damage: 40, speed: 4, range: 5, cooldown: 1.15, color: '#ff9a72', accent: '#ffe3d5', price: 220, stock: 4 },
  { id: 'siren', name: 'Tide Siren', type: 'unit', role: 'Maga de rango', rarity: 'Epic', cost: 4, level: 4, progress: 0, progressMax: 4, hp: 155, damage: 24, speed: 6, range: 17, cooldown: 0.8, color: '#a4a4ff', accent: '#efefff', price: 350, stock: 2 },
  { id: 'captain', name: 'Wave Captain', type: 'unit', role: 'Líder versátil', rarity: 'Legendary', cost: 4, level: 3, progress: 0, progressMax: 2, hp: 220, damage: 32, speed: 7, range: 8, cooldown: 0.9, color: '#d4a4ff', accent: '#f5ebff', price: 500, stock: 1 },
  { id: 'storm', name: 'Storm Call', type: 'spell', role: 'Impacto pesado', rarity: 'Epic', cost: 4, level: 4, progress: 2, progressMax: 4, damage: 98, color: '#8daeff', accent: '#eef3ff', price: 360, stock: 2 },
]

const rarityClass: Record<Card['rarity'], string> = {
  Common: 'rarity-common',
  Rare: 'rarity-rare',
  Epic: 'rarity-epic',
  Legendary: 'rarity-legendary',
}

const initialDeck = ['skipper', 'gunner', 'guard', 'powder', 'skipper', 'gunner', 'guard', 'powder']
const initialOwned = ['skipper', 'gunner', 'guard', 'powder']
const chests: ChestSlot[] = [
  { id: 1, name: 'Silver Chest', state: 'ready' },
  { id: 2, name: 'Golden Chest', state: 'unlocking', remaining: '02:14:21' },
  { id: 3, name: 'Chest Slot', state: 'locked' },
  { id: 4, name: 'Chest Slot', state: 'locked' },
]
const botDeck = ['skipper', 'guard', 'gunner', 'powder', 'brute', 'siren', 'skipper', 'powder']
const maxEnergy = 10
const battleDuration = 120

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
    { id: 'player-left', side: 'player', lane: 0, x: 28, y: 76, hp: 420, maxHp: 420, damage: 22, range: 20, cooldown: 1.1, attackTimer: 0 },
    { id: 'player-right', side: 'player', lane: 1, x: 72, y: 76, hp: 420, maxHp: 420, damage: 22, range: 20, cooldown: 1.1, attackTimer: 0 },
    { id: 'player-king', side: 'player', lane: null, x: 50, y: 90, hp: 900, maxHp: 900, damage: 28, range: 22, cooldown: 1.25, attackTimer: 0 },
    { id: 'bot-left', side: 'bot', lane: 0, x: 28, y: 24, hp: 420, maxHp: 420, damage: 22, range: 20, cooldown: 1.1, attackTimer: 0 },
    { id: 'bot-right', side: 'bot', lane: 1, x: 72, y: 24, hp: 420, maxHp: 420, damage: 22, range: 20, cooldown: 1.1, attackTimer: 0 },
    { id: 'bot-king', side: 'bot', lane: null, x: 50, y: 10, hp: 900, maxHp: 900, damage: 28, range: 22, cooldown: 1.25, attackTimer: 0 },
  ]
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('battle')
  const [screen, setScreen] = useState<Screen>('home')
  const [gold, setGold] = useState(12450)
  const [gems] = useState(580)
  const [trophies] = useState(3012)
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
  const [battleLog, setBattleLog] = useState<string[]>(['Arrastra una carta sobre tu mitad del campo para desplegarla.'])

  const arenaRef = useRef<HTMLDivElement | null>(null)
  const unitIdRef = useRef(1)
  const unitsRef = useRef<Unit[]>([])
  const towersRef = useRef<Tower[]>(makeTowers())
  const botEnergyRef = useRef(5)
  const timeRef = useRef(battleDuration)
  const botThinkRef = useRef(0)

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

  const ownedCards = useMemo(() => cards.filter((card) => owned.includes(card.id)), [owned])
  const visibleDeck = useMemo(() => deck.map((cardId) => getCard(cardId)), [deck])
  const battleHand = useMemo(() => deck.slice(0, 4).map((cardId) => getCard(cardId)), [deck])
  const averageElixir = useMemo(() => {
    const total = visibleDeck.reduce((sum, card) => sum + card.cost, 0)
    return (total / visibleDeck.length).toFixed(1)
  }, [visibleDeck])
  const shopCards = useMemo(() => cards.filter((card) => !owned.includes(card.id)), [owned])
  const selectedShopCard = shopCards[shopSelection] ?? null

  const setHomeTab = (nextTab: Tab) => {
    setTab(nextTab)
    setScreen('home')
  }

  const pushLog = (message: string) => {
    setBattleLog((current) => [message, ...current].slice(0, 4))
  }

  const resetBattle = () => {
    setTowers(makeTowers())
    setUnits([])
    setPlayerEnergy(5)
    setBotEnergy(5)
    setTimeLeft(battleDuration)
    setResult(null)
    setBattleLog(['Arrastra una carta sobre tu mitad del campo para desplegarla.'])
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

  const buySelectedCard = () => {
    if (!selectedShopCard || gold < selectedShopCard.price) return
    setGold((current) => current - selectedShopCard.price)
    setOwned((current) => [...current, selectedShopCard.id])
    setShopSelection(0)
  }

  const summon = (cardId: string, side: Side, lane: Lane) => {
    const card = getCard(cardId)

    if (card.type === 'spell') {
      setUnits((current) =>
        current
          .map((unit) => {
            if (unit.side === side || unit.lane !== lane) return unit
            return { ...unit, hp: unit.hp - card.damage }
          })
          .filter((unit) => unit.hp > 0)
      )

      setTowers((current) =>
        current.map((tower) => {
          if (tower.side === side || (tower.lane !== lane && tower.lane !== null)) return tower
          const dealt = Math.round(card.damage * (tower.lane === null ? 0.5 : 0.7))
          return { ...tower, hp: Math.max(0, tower.hp - dealt) }
        })
      )

      pushLog(`${side === 'player' ? 'Has lanzado' : 'El rival ha lanzado'} ${card.name}.`)
      return
    }

    setUnits((current) => [
      ...current,
      {
        id: unitIdRef.current++,
        side,
        lane,
        x: lane === 0 ? 28 : 72,
        y: side === 'player' ? 82 : 18,
        hp: card.hp ?? 100,
        maxHp: card.hp ?? 100,
        damage: card.damage,
        speed: card.speed ?? 5,
        range: card.range ?? 5,
        cooldown: card.cooldown ?? 1,
        attackTimer: 0,
        color: card.color,
        accent: card.accent,
        name: card.name,
      },
    ])
  }

  const deployDraggedCard = (cardIndex: number, lane: Lane) => {
    const card = battleHand[cardIndex]
    if (!card || result || playerEnergy < card.cost) return
    summon(card.id, 'player', lane)
    setPlayerEnergy((current) => clamp(current - card.cost, 0, maxEnergy))
    pushLog(`Has desplegado ${card.name}.`)
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
        const relativeX = (event.clientX - rect.left) / rect.width
        const relativeY = (event.clientY - rect.top) / rect.height
        if (relativeY > 0.5) {
          deployDraggedCard(dragState.cardIndex, relativeX < 0.5 ? 0 : 1)
        }
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
            .filter((other) => other.side !== unit.side && other.lane === unit.lane)
            .sort((a, b) => Math.abs(a.y - unit.y) - Math.abs(b.y - unit.y))
          const enemyTowers = towersRef.current
            .filter((tower) => tower.side !== unit.side && (tower.lane === unit.lane || tower.lane === null) && tower.hp > 0)
            .sort((a, b) => Math.abs(a.y - unit.y) - Math.abs(b.y - unit.y))

          const targetUnit = enemyUnits[0]
          const targetTower = enemyTowers[0]

          if (targetUnit && Math.abs(targetUnit.y - unit.y) <= unit.range) {
            if (unit.attackTimer <= 0) {
              unitDamage.set(targetUnit.id, (unitDamage.get(targetUnit.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          if (targetTower && Math.abs(targetTower.y - unit.y) <= unit.range) {
            if (unit.attackTimer <= 0) {
              towerDamage.set(targetTower.id, (towerDamage.get(targetTower.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          const direction = unit.side === 'player' ? -1 : 1
          unit.y = clamp(unit.y + unit.speed * delta * direction, 8, 92)
        }

        if (towerDamage.size > 0) {
          setTowers((current) =>
            current.map((tower) =>
              towerDamage.has(tower.id)
                ? { ...tower, hp: Math.max(0, tower.hp - (towerDamage.get(tower.id) ?? 0)) }
                : tower
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
            .filter((unit) => unit.side !== tower.side && (tower.lane === null || unit.lane === tower.lane))
            .sort((a, b) => Math.abs(a.y - tower.y) - Math.abs(b.y - tower.y))[0]

          if (target && Math.abs(target.y - tower.y) <= tower.range) {
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
          const lane: Lane =
            unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 0).length >
            unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 1).length
              ? 0
              : 1
          summon(chosen.id, 'bot', lane)
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

    if (playerKing <= 0) {
      setResult('Derrota')
      return
    }

    if (botKing <= 0) {
      setResult('Victoria')
      return
    }

    if (timeLeft <= 0) {
      const playerTotal = towers.filter((tower) => tower.side === 'player').reduce((sum, tower) => sum + tower.hp, 0)
      const botTotal = towers.filter((tower) => tower.side === 'bot').reduce((sum, tower) => sum + tower.hp, 0)
      setResult(playerTotal >= botTotal ? 'Victoria a tiempo' : 'Derrota a tiempo')
    }
  }, [screen, result, timeLeft, towers])

  const playerKing = towers.find((tower) => tower.id === 'player-king')
  const botKing = towers.find((tower) => tower.id === 'bot-king')

  const homeContent =
    tab === 'shop' ? (
      <section className="page-panel shop-page">
        <div className="section-block">
          <h2>Ofertas especiales</h2>
          <div className="offer-card">
            <span>Oferta limitada</span>
            <strong>1200 gemas + 20000 oro</strong>
            <p>Disponible durante 08:21:14</p>
          </div>
        </div>

        <div className="section-block">
          <h2>Cofres</h2>
          <div className="chest-shop-grid">
            {['Silver', 'Gold', 'Magic', 'Giant'].map((name, index) => (
              <article className="shop-item" key={name}>
                <div className={`shop-icon chest chest-${index}`} />
                <strong>{name} Chest</strong>
                <button className="mini-buy" type="button">
                  {index < 2 ? '120 oro' : `${(index + 1) * 120} gemas`}
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="section-block">
          <h2>Cartas diarias</h2>
          <div className="cards-list">
            {shopCards.length > 0 ? (
              shopCards.map((card, index) => (
                <button
                  className={`collection-entry ${shopSelection === index ? 'collection-entry-active' : ''}`}
                  key={card.id}
                  onClick={() => setShopSelection(index)}
                  type="button"
                >
                  <div className={`card-portrait ${rarityClass[card.rarity]}`} style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }} />
                  <div className="entry-copy">
                    <strong>{card.name}</strong>
                    <span>{card.stock} disponibles</span>
                  </div>
                  <b>{card.price}</b>
                </button>
              ))
            ) : (
              <article className="empty-message">Toda la colección de esta demo está comprada.</article>
            )}
          </div>

          {selectedShopCard ? (
            <button className="buy-main" onClick={buySelectedCard} type="button">
              Comprar {selectedShopCard.name}
            </button>
          ) : null}
        </div>

        <div className="section-block">
          <h2>Recursos</h2>
          <div className="resource-card">
            <strong>5000 oro</strong>
            <span>300 gemas</span>
          </div>
        </div>
      </section>
    ) : tab === 'cards' ? (
      <section className="page-panel cards-page">
        <div className="section-block">
          <h2>Mazo activo</h2>
          <div className="active-deck-grid">
            {visibleDeck.map((card, index) => (
              <button
                className={`deck-card ${selectedDeckSlot === index ? 'deck-card-active' : ''} ${rarityClass[card.rarity]}`}
                key={`${card.id}-${index}`}
                onClick={() => {
                  setSelectedDeckSlot(index)
                  setSelectedCardId(card.id)
                }}
                type="button"
              >
                <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }} />
                <span>{card.level}</span>
              </button>
            ))}
          </div>
          <div className="average-elixir">Coste medio de elixir: {averageElixir}</div>
        </div>

        <div className="section-block">
          <h2>Detalle</h2>
          {(() => {
            const card = getCard(selectedCardId)
            return (
              <article className={`detail-card ${rarityClass[card.rarity]}`}>
                <div className="detail-head">
                  <div className="card-portrait large" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }} />
                  <div>
                    <strong>{card.name}</strong>
                    <p>{card.role}</p>
                  </div>
                </div>
                <div className="stats-grid">
                  <span>Daño: {card.damage}</span>
                  <span>Vida: {card.hp ?? '-'}</span>
                  <span>Velocidad: {card.speed ?? '-'}</span>
                  <span>Rango: {card.range ?? '-'}</span>
                </div>
              </article>
            )
          })()}
        </div>

        <div className="section-block">
          <h2>Colección</h2>
          <div className="cards-list">
            {ownedCards.map((card) => (
              <button
                className={`collection-entry ${rarityClass[card.rarity]}`}
                key={card.id}
                onClick={() => {
                  setSelectedCardId(card.id)
                  swapDeckCard(card.id)
                }}
                type="button"
              >
                <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }} />
                <div className="entry-copy">
                  <strong>{card.name}</strong>
                  <span>Nivel {card.level}</span>
                  <div className="mini-progress">
                    <i style={{ width: `${(card.progress / card.progressMax) * 100}%` }} />
                  </div>
                </div>
                <b>{card.cost}</b>
              </button>
            ))}
          </div>
        </div>
      </section>
    ) : (
      <section className="page-panel battle-home">
        <header className="home-header">
          <div className="profile-box">
            <div className="avatar" />
            <div className="level-ring">11</div>
          </div>
          <div className="arena-box">
            <strong>Arena Pirata</strong>
            <span>{trophies} trofeos</span>
          </div>
          <div className="currency-box">
            <div><span>Oro</span><strong>{gold}</strong></div>
            <div><span>Gemas</span><strong>{gems}</strong></div>
          </div>
        </header>

        <div className="section-block">
          <h2>Cofres</h2>
          <div className="chest-grid">
            {chests.map((chest) => (
              <article className={`chest-slot chest-state-${chest.state}`} key={chest.id}>
                <div className="chest-icon" />
                <strong>{chest.name}</strong>
                <span>{chest.remaining ?? (chest.state === 'ready' ? 'Listo' : 'Bloqueado')}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="section-block">
          <h2>Mazo activo</h2>
          <div className="active-deck-grid">
            {visibleDeck.map((card) => (
              <article className={`deck-card static ${rarityClass[card.rarity]}`} key={card.id}>
                <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }} />
                <span>{card.level}</span>
              </article>
            ))}
          </div>
          <div className="average-elixir">Coste medio de elixir: {averageElixir}</div>
        </div>

        <button className="battle-button" onClick={openBattle} type="button">
          Batalla
        </button>
      </section>
    )

  if (screen === 'battle') {
    return (
      <main className="phone-shell battle-shell">
        <header className="battle-hud">
          <div className="player-chip enemy-chip">
            <strong>Rival Bot</strong>
            <span>0</span>
          </div>
          <div className="battle-center-hud">
            <strong>{formatTime(timeLeft)}</strong>
            <span>{result ?? 'Práctica'}</span>
          </div>
          <div className="player-chip">
            <strong>Tú</strong>
            <span>0</span>
          </div>
        </header>

        <section className="battle-arena-card">
          <div className="king-hp enemy">
            <span>Torre del Rey rival</span>
            <div className="health-bar"><i style={{ width: `${((botKing?.hp ?? 0) / (botKing?.maxHp ?? 1)) * 100}%` }} /></div>
          </div>

          <div className="arena-board" ref={arenaRef}>
            <div className="enemy-ground" />
            <div className="river" />
            <div className="bridge bridge-left" />
            <div className="bridge bridge-right" />
            <div className="player-ground" />

            {towers.map((tower) => (
              <div className={`tower ${tower.side} ${tower.lane === null ? 'king' : 'archer'}`} key={tower.id} style={{ left: `${tower.x}%`, top: `${tower.y}%` }}>
                <div className="tower-top" />
                <div className="tower-base" />
                <div className="tower-hp"><i style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }} /></div>
              </div>
            ))}

            {units.map((unit) => (
              <div className={`unit ${unit.side}`} key={unit.id} style={{ left: `${unit.x}%`, top: `${unit.y}%` }}>
                <div className="unit-face" style={{ background: `linear-gradient(180deg, ${unit.color}, ${unit.accent})` }} />
                <div className="unit-hp"><i style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} /></div>
              </div>
            ))}

            <div className="deploy-note left">Carril izquierdo</div>
            <div className="deploy-note right">Carril derecho</div>
          </div>

          <div className="king-hp player">
            <span>Torre del Rey</span>
            <div className="health-bar"><i style={{ width: `${((playerKing?.hp ?? 0) / (playerKing?.maxHp ?? 1)) * 100}%` }} /></div>
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
                <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }} />
                <strong>{card.name}</strong>
              </button>
            ))}
          </div>

          <div className="battle-feed">
            {battleLog.map((entry, index) => (
              <article key={`${entry}-${index}`}>{entry}</article>
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
              <div className="card-portrait" style={{ background: `linear-gradient(180deg, ${battleHand[dragState.cardIndex].color}, ${battleHand[dragState.cardIndex].accent})` }} />
              <strong>{battleHand[dragState.cardIndex].name}</strong>
            </div>
          </div>
        ) : null}
      </main>
    )
  }

  return (
    <main className="phone-shell">
      {homeContent}
      <nav className="bottom-nav">
        <button className={tab === 'shop' ? 'active' : ''} onClick={() => setHomeTab('shop')} type="button">
          <span>🛒</span>
          <strong>Tienda</strong>
        </button>
        <button className={tab === 'battle' ? 'active' : ''} onClick={() => setHomeTab('battle')} type="button">
          <span>⚔</span>
          <strong>Batalla</strong>
        </button>
        <button className={tab === 'cards' ? 'active' : ''} onClick={() => setHomeTab('cards')} type="button">
          <span>🃏</span>
          <strong>Cartas</strong>
        </button>
      </nav>
    </main>
  )
}
