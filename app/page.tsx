'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Screen = 'home' | 'deck' | 'shop' | 'battle'
type Side = 'player' | 'bot'
type Lane = 0 | 1
type CardType = 'unit' | 'spell'

type Card = {
  id: string
  name: string
  role: string
  type: CardType
  cost: number
  rarity: 'Common' | 'Rare' | 'Epic'
  color: string
  accent: string
  hp?: number
  damage: number
  speed?: number
  range?: number
  cooldown?: number
  price: number
}

type Unit = {
  id: number
  cardId: string
  name: string
  role: string
  side: Side
  lane: Lane | null
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
}

type Tower = {
  id: string
  side: Side
  lane: Lane | null
  x: number
  hp: number
  maxHp: number
  damage: number
  range: number
  cooldown: number
  attackTimer: number
  label: string
}

type DragState = {
  cardIndex: number
  x: number
  y: number
}

const cards: Card[] = [
  { id: 'skipper', name: 'Skipper', role: 'Espadachin veloz', type: 'unit', cost: 2, rarity: 'Common', color: '#ffcb63', accent: '#fff1c7', hp: 120, damage: 18, speed: 10, range: 5, cooldown: 0.8, price: 0 },
  { id: 'gunner', name: 'Coral Gunner', role: 'Tirador de apoyo', type: 'unit', cost: 3, rarity: 'Common', color: '#7ad8ff', accent: '#e7fbff', hp: 130, damage: 28, speed: 7, range: 18, cooldown: 1.05, price: 0 },
  { id: 'brute', name: 'Anchor Brute', role: 'Tanque frontal', type: 'unit', cost: 5, rarity: 'Rare', color: '#ff9368', accent: '#ffe4d7', hp: 310, damage: 40, speed: 4, range: 5, cooldown: 1.15, price: 220 },
  { id: 'siren', name: 'Tide Siren', role: 'Maga de rango', type: 'unit', cost: 4, rarity: 'Rare', color: '#9b9cff', accent: '#efefff', hp: 155, damage: 24, speed: 6, range: 17, cooldown: 0.8, price: 200 },
  { id: 'guard', name: 'Harbor Guard', role: 'Defensa estable', type: 'unit', cost: 3, rarity: 'Common', color: '#90e28b', accent: '#efffe7', hp: 220, damage: 21, speed: 5, range: 5, cooldown: 0.95, price: 150 },
  { id: 'captain', name: 'Wave Captain', role: 'Lider versatil', type: 'unit', cost: 4, rarity: 'Epic', color: '#d0a0ff', accent: '#f5eaff', hp: 220, damage: 32, speed: 7, range: 8, cooldown: 0.9, price: 340 },
  { id: 'powder', name: 'Powder Burst', role: 'Hechizo rapido', type: 'spell', cost: 3, rarity: 'Common', color: '#ff7ea6', accent: '#ffe6ef', damage: 72, price: 140 },
  { id: 'storm', name: 'Storm Call', role: 'Impacto pesado', type: 'spell', cost: 4, rarity: 'Epic', color: '#88abff', accent: '#eef3ff', damage: 98, price: 330 },
]

const initialOwned = ['skipper', 'gunner', 'guard', 'powder']
const initialDeck = ['skipper', 'gunner', 'guard', 'powder', 'skipper', 'gunner', 'guard', 'powder']
const botDeck = ['skipper', 'guard', 'gunner', 'powder', 'brute', 'siren', 'skipper', 'powder']
const maxEnergy = 10
const battleSeconds = 120

function getCard(cardId: string) {
  return cards.find((card) => card.id === cardId)!
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function makeTowers(): Tower[] {
  return [
    { id: 'player-left', side: 'player', lane: 0, x: 28, hp: 420, maxHp: 420, damage: 22, range: 24, cooldown: 1.1, attackTimer: 0, label: 'Archer Tower' },
    { id: 'player-right', side: 'player', lane: 1, x: 72, hp: 420, maxHp: 420, damage: 22, range: 24, cooldown: 1.1, attackTimer: 0, label: 'Archer Tower' },
    { id: 'player-king', side: 'player', lane: null, x: 50, hp: 900, maxHp: 900, damage: 28, range: 25, cooldown: 1.25, attackTimer: 0, label: 'King Tower' },
    { id: 'bot-left', side: 'bot', lane: 0, x: 28, hp: 420, maxHp: 420, damage: 22, range: 24, cooldown: 1.1, attackTimer: 0, label: 'Archer Tower' },
    { id: 'bot-right', side: 'bot', lane: 1, x: 72, hp: 420, maxHp: 420, damage: 22, range: 24, cooldown: 1.1, attackTimer: 0, label: 'Archer Tower' },
    { id: 'bot-king', side: 'bot', lane: null, x: 50, hp: 900, maxHp: 900, damage: 28, range: 25, cooldown: 1.25, attackTimer: 0, label: 'King Tower' },
  ]
}

function formatTime(value: number) {
  const total = Math.max(0, Math.ceil(value))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [gold, setGold] = useState(520)
  const [owned, setOwned] = useState<string[]>(initialOwned)
  const [deck, setDeck] = useState<string[]>(initialDeck)
  const [selectedDeckSlot, setSelectedDeckSlot] = useState(0)
  const [shopIndex, setShopIndex] = useState(0)
  const [units, setUnits] = useState<Unit[]>([])
  const [towers, setTowers] = useState<Tower[]>(makeTowers())
  const [playerEnergy, setPlayerEnergy] = useState(5)
  const [botEnergy, setBotEnergy] = useState(5)
  const [timeLeft, setTimeLeft] = useState(battleSeconds)
  const [battleResult, setBattleResult] = useState<string | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>(['Arrastra una carta de la mano y suéltala en tu lado del campo.'])
  const [dragState, setDragState] = useState<DragState | null>(null)

  const arenaRef = useRef<HTMLDivElement | null>(null)
  const unitIdRef = useRef(1)
  const unitsRef = useRef<Unit[]>([])
  const towersRef = useRef<Tower[]>(makeTowers())
  const botEnergyRef = useRef(5)
  const timeLeftRef = useRef(battleSeconds)
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
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  const ownedCards = useMemo(() => cards.filter((card) => owned.includes(card.id)), [owned])
  const buyableCards = useMemo(() => cards.filter((card) => !owned.includes(card.id)), [owned])
  const featuredShopCard = buyableCards[shopIndex] ?? null
  const handCards = useMemo(() => deck.slice(0, 4).map((cardId) => getCard(cardId)), [deck])

  const addLog = (message: string) => {
    setBattleLog((current) => [message, ...current].slice(0, 5))
  }

  const resetBattle = () => {
    setUnits([])
    setTowers(makeTowers())
    setPlayerEnergy(5)
    setBotEnergy(5)
    setTimeLeft(battleSeconds)
    setBattleResult(null)
    setBattleLog(['Arrastra una carta de la mano y suéltala en tu lado del campo.'])
    unitIdRef.current = 1
    botThinkRef.current = 0
  }

  const openBattle = () => {
    resetBattle()
    setScreen('battle')
  }

  const replaceDeckSlot = (cardId: string) => {
    setDeck((current) => current.map((value, index) => (index === selectedDeckSlot ? cardId : value)))
  }

  const buyCard = () => {
    if (!featuredShopCard || gold < featuredShopCard.price) return
    setGold((current) => current - featuredShopCard.price)
    setOwned((current) => [...current, featuredShopCard.id])
    setShopIndex(0)
  }

  const summonCard = (cardId: string, side: Side, lane: Lane) => {
    const card = getCard(cardId)

    if (card.type === 'spell') {
      setUnits((current) =>
        current
          .map((unit) => {
            if (unit.side === side) return unit
            if (unit.lane !== lane && unit.lane !== null) return unit
            return { ...unit, hp: unit.hp - card.damage }
          })
          .filter((unit) => unit.hp > 0)
      )

      setTowers((current) =>
        current.map((tower) => {
          if (tower.side === side || (tower.lane !== lane && tower.lane !== null)) return tower
          const dealt = Math.round(card.damage * (tower.lane === null ? 0.52 : 0.72))
          return { ...tower, hp: Math.max(0, tower.hp - dealt) }
        })
      )

      addLog(`${side === 'player' ? 'Has lanzado' : 'El bot ha lanzado'} ${card.name}.`)
      return
    }

    const unit: Unit = {
      id: unitIdRef.current++,
      cardId: card.id,
      name: card.name,
      role: card.role,
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
    }

    setUnits((current) => [...current, unit])
    addLog(`${side === 'player' ? 'Has desplegado' : 'El bot despliega'} ${card.name} en ${lane === 0 ? 'arriba' : 'abajo'}.`)
  }

  const deployDraggedCard = (cardIndex: number, lane: Lane) => {
    if (battleResult) return
    const card = handCards[cardIndex]
    if (!card || playerEnergy < card.cost) return
    summonCard(card.id, 'player', lane)
    setPlayerEnergy((current) => clamp(current - card.cost, 0, maxEnergy))
  }

  const onCardPointerDown = (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
    const card = handCards[index]
    if (!card || playerEnergy < card.cost || battleResult) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({ cardIndex: index, x: event.clientX, y: event.clientY })
  }

  const onCardPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState) return
    setDragState((current) => (current ? { ...current, x: event.clientX, y: event.clientY } : null))
  }

  const onCardPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState) return

    const arena = arenaRef.current
    if (arena) {
      const rect = arena.getBoundingClientRect()
      const insideArena =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (insideArena) {
        const relativeY = event.clientY - rect.top
        const lane = relativeY < rect.height / 2 ? 0 : 1
        deployDraggedCard(dragState.cardIndex, lane)
      }
    }

    setDragState(null)
  }

  useEffect(() => {
    if (screen !== 'battle' || battleResult) return

    const interval = window.setInterval(() => {
      const delta = 0.1
      setTimeLeft((current) => Math.max(0, current - delta))

      const regen = timeLeftRef.current <= 30 ? 0.82 : 0.42
      setPlayerEnergy((current) => clamp(current + regen * delta, 0, maxEnergy))
      setBotEnergy((current) => clamp(current + regen * delta, 0, maxEnergy))

      setUnits((currentUnits) => {
        const updated = currentUnits.map((unit) => ({ ...unit, attackTimer: Math.max(0, unit.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()
        const towerDamage = new Map<string, number>()

        for (const unit of updated) {
          const enemies = updated
            .filter((other) => other.side !== unit.side && (other.lane === unit.lane || other.lane === null))
            .sort((a, b) => Math.abs(a.y - unit.y) - Math.abs(b.y - unit.y))

          const enemyTowers = towersRef.current
            .filter((tower) => tower.side !== unit.side && (tower.lane === unit.lane || tower.lane === null) && tower.hp > 0)
            .sort((a, b) => {
              const ay = tower.side === 'player' ? 84 : 16
              const by = b.side === 'player' ? 84 : 16
              return Math.abs(ay - unit.y) - Math.abs(by - unit.y)
            })

          const targetUnit = enemies[0]
          const targetTower = enemyTowers[0]

          if (targetUnit && Math.abs(targetUnit.y - unit.y) <= unit.range) {
            if (unit.attackTimer <= 0) {
              unitDamage.set(targetUnit.id, (unitDamage.get(targetUnit.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          const towerY = targetTower ? (targetTower.side === 'player' ? 84 : 16) : 0
          if (targetTower && Math.abs(towerY - unit.y) <= unit.range) {
            if (unit.attackTimer <= 0) {
              towerDamage.set(targetTower.id, (towerDamage.get(targetTower.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          const direction = unit.side === 'player' ? -1 : 1
          unit.y = clamp(unit.y + unit.speed * delta * direction, 10, 90)
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

      setTowers((currentTowers) => {
        const updated = currentTowers.map((tower) => ({ ...tower, attackTimer: Math.max(0, tower.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()

        for (const tower of updated) {
          if (tower.hp <= 0 || tower.attackTimer > 0) continue
          const towerY = tower.side === 'player' ? 84 : 16
          const target = unitsRef.current
            .filter((unit) => unit.side !== tower.side && (tower.lane === null || unit.lane === tower.lane))
            .sort((a, b) => Math.abs(a.y - towerY) - Math.abs(b.y - towerY))[0]

          if (target && Math.abs(target.y - towerY) <= tower.range) {
            unitDamage.set(target.id, (unitDamage.get(target.id) ?? 0) + tower.damage)
            tower.attackTimer = tower.cooldown
          }
        }

        if (unitDamage.size > 0) {
          setUnits((current) =>
            current
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
          const pressureLeft = unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 0).length
          const pressureRight = unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 1).length
          const lane: Lane = pressureLeft > pressureRight ? 0 : 1
          const chosen = playable[Math.floor(Math.random() * playable.length)]
          summonCard(chosen.id, 'bot', lane)
          setBotEnergy((current) => clamp(current - chosen.cost, 0, maxEnergy))
        }
      }
    }, 100)

    return () => window.clearInterval(interval)
  }, [screen, battleResult, handCards])

  useEffect(() => {
    if (screen !== 'battle' || battleResult) return

    const playerKing = towers.find((tower) => tower.id === 'player-king')?.hp ?? 0
    const botKing = towers.find((tower) => tower.id === 'bot-king')?.hp ?? 0

    if (playerKing <= 0) {
      setBattleResult('Derrota')
      return
    }

    if (botKing <= 0) {
      setBattleResult('Victoria')
      setGold((current) => current + 60)
      return
    }

    if (timeLeft <= 0) {
      const playerTotal = towers.filter((tower) => tower.side === 'player').reduce((sum, tower) => sum + tower.hp, 0)
      const botTotal = towers.filter((tower) => tower.side === 'bot').reduce((sum, tower) => sum + tower.hp, 0)
      const result = playerTotal >= botTotal ? 'Victoria por puntos' : 'Derrota por puntos'
      setBattleResult(result)
      if (playerTotal >= botTotal) {
        setGold((current) => current + 40)
      }
    }
  }, [screen, battleResult, towers, timeLeft])

  const playerKing = towers.find((tower) => tower.id === 'player-king')
  const botKing = towers.find((tower) => tower.id === 'bot-king')

  if (screen === 'deck') {
    return (
      <main className="phone-shell">
        <header className="topbar">
          <button className="nav-back" onClick={() => setScreen('home')} type="button">Inicio</button>
          <div className="topbar-title"><span>Mazos</span><strong>Editor de mazos</strong></div>
          <div className="topbar-pill">8 cartas</div>
        </header>

        <section className="screen-card">
          <div className="deck-grid">
            {deck.map((cardId, index) => {
              const card = getCard(cardId)
              return (
                <button
                  className={`deck-slot ${selectedDeckSlot === index ? 'deck-slot-active' : ''}`}
                  key={`${cardId}-${index}`}
                  onClick={() => setSelectedDeckSlot(index)}
                  type="button"
                >
                  <span>{index + 1}</span>
                  <strong>{card.name}</strong>
                  <small>{card.cost} elixir</small>
                </button>
              )
            })}
          </div>

          <div className="subsection-title">Colección</div>
          <div className="collection-list">
            {ownedCards.map((card) => (
              <button className="collection-row" key={card.id} onClick={() => replaceDeckSlot(card.id)} type="button">
                <div className="character-medal" style={{ background: card.color }}>
                  <i />
                </div>
                <div className="collection-copy">
                  <strong>{card.name}</strong>
                  <span>{card.role}</span>
                </div>
                <div className="cost-chip">{card.cost}</div>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'shop') {
    return (
      <main className="phone-shell">
        <header className="topbar">
          <button className="nav-back" onClick={() => setScreen('home')} type="button">Inicio</button>
          <div className="topbar-title"><span>Tienda</span><strong>Ofertas</strong></div>
          <div className="topbar-pill gold-pill">{gold} oro</div>
        </header>

        <section className="screen-card">
          {featuredShopCard ? (
            <article className="shop-feature">
              <div className="shop-feature-art" style={{ background: `linear-gradient(180deg, ${featuredShopCard.color}, ${featuredShopCard.accent})` }}>
                <div className="character-large">
                  <i />
                </div>
              </div>
              <h2>{featuredShopCard.name}</h2>
              <p>{featuredShopCard.role}</p>
              <div className="shop-meta-row">
                <span>{featuredShopCard.rarity}</span>
                <strong>{featuredShopCard.price} oro</strong>
              </div>
              <button className="action-button green" onClick={buyCard} type="button">Comprar</button>
            </article>
          ) : (
            <article className="empty-state">
              <strong>Toda la tienda está comprada.</strong>
              <p>La siguiente fase será meter rotación diaria, cofres y progreso.</p>
            </article>
          )}

          <div className="subsection-title">Cartas disponibles</div>
          <div className="collection-list">
            {buyableCards.map((card, index) => (
              <button
                className={`collection-row ${shopIndex === index ? 'collection-row-active' : ''}`}
                key={card.id}
                onClick={() => setShopIndex(index)}
                type="button"
              >
                <div className="character-medal" style={{ background: card.color }}>
                  <i />
                </div>
                <div className="collection-copy">
                  <strong>{card.name}</strong>
                  <span>{card.role}</span>
                </div>
                <div className="price-chip">{card.price}</div>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'battle') {
    return (
      <main className="phone-shell battle-phone">
        <header className="battle-topbar">
          <button className="nav-back" onClick={() => setScreen('home')} type="button">Salir</button>
          <div className="battle-clock">{formatTime(timeLeft)}</div>
          <div className="battle-status">{battleResult ?? 'Práctica'}</div>
        </header>

        <section className="battlefield-card">
          <div className="king-health enemy">
            <span>{botKing?.label}</span>
            <div className="health-bar"><i style={{ width: `${((botKing?.hp ?? 0) / (botKing?.maxHp ?? 1)) * 100}%` }} /></div>
          </div>

          <div className="arena-board" ref={arenaRef}>
            <div className="lane-zone top-zone" />
            <div className="river-band">
              <div className="bridge left-bridge" />
              <div className="bridge right-bridge" />
            </div>
            <div className="lane-zone bottom-zone" />

            {towers.map((tower) => {
              const isEnemy = tower.side === 'bot'
              const isKing = tower.lane === null
              const topPosition = isKing ? (isEnemy ? 10 : 90) : isEnemy ? 24 : 76
              return (
                <div
                  className={`tower-node ${isEnemy ? 'enemy' : 'player'} ${isKing ? 'king-node' : ''}`}
                  key={tower.id}
                  style={{ left: `${tower.x}%`, top: `${topPosition}%` }}
                >
                  <div className="tower-roof" />
                  <div className="tower-body" />
                  <div className="tower-life">
                    <i style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }} />
                  </div>
                </div>
              )
            })}

            {units.map((unit) => (
              <div
                className={`unit-node ${unit.side}`}
                key={unit.id}
                style={{ left: `${unit.x}%`, top: `${unit.y}%` }}
              >
                <div className="unit-portrait" style={{ background: `linear-gradient(180deg, ${unit.color}, ${unit.accent})` }}>
                  <i />
                </div>
                <div className="unit-life">
                  <i style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} />
                </div>
              </div>
            ))}

            <div className="drop-hint left-drop">Carril izquierdo</div>
            <div className="drop-hint right-drop">Carril derecho</div>
          </div>

          <div className="king-health player">
            <span>{playerKing?.label}</span>
            <div className="health-bar"><i style={{ width: `${((playerKing?.hp ?? 0) / (playerKing?.maxHp ?? 1)) * 100}%` }} /></div>
          </div>
        </section>

        <section className="bottom-ui">
          <div className="energy-panel-mobile">
            <span>Elixir</span>
            <strong>{playerEnergy.toFixed(1)} / 10</strong>
            <div className="energy-bar"><i style={{ width: `${(playerEnergy / maxEnergy) * 100}%` }} /></div>
          </div>

          <div className="hand-row">
            {handCards.map((card, index) => (
              <button
                className={`hand-card ${playerEnergy < card.cost ? 'hand-card-disabled' : ''}`}
                key={`${card.id}-${index}`}
                onPointerDown={(event) => onCardPointerDown(index, event)}
                onPointerMove={onCardPointerMove}
                onPointerUp={onCardPointerUp}
                type="button"
              >
                <div className="hand-cost">{card.cost}</div>
                <div className="hand-art" style={{ background: `linear-gradient(180deg, ${card.color}, ${card.accent})` }}>
                  <i />
                </div>
                <strong>{card.name}</strong>
                <span>{card.role}</span>
              </button>
            ))}
          </div>

          <div className="battle-log">
            {battleLog.map((entry, index) => (
              <article key={`${entry}-${index}`}>{entry}</article>
            ))}
          </div>
        </section>

        {dragState ? (
          <div className="drag-ghost" style={{ left: dragState.x, top: dragState.y }}>
            <div className="hand-card ghost">
              <div className="hand-cost">{handCards[dragState.cardIndex]?.cost}</div>
              <div className="hand-art" style={{ background: `linear-gradient(180deg, ${handCards[dragState.cardIndex]?.color}, ${handCards[dragState.cardIndex]?.accent})` }}>
                <i />
              </div>
              <strong>{handCards[dragState.cardIndex]?.name}</strong>
            </div>
          </div>
        ) : null}
      </main>
    )
  }

  return (
    <main className="phone-shell">
      <header className="home-hero">
        <div className="hero-badge">Pirates Card Battle</div>
        <div className="hero-crowns">
          <div className="hero-tower blue" />
          <div className="hero-center-emblem" />
          <div className="hero-tower red" />
        </div>
        <h1>Arena vertical de cartas y torres.</h1>
        <p>Inicio separado del editor de mazos y la tienda, con modo práctica sencillo contra bot mientras llega el multijugador.</p>
      </header>

      <section className="home-menu">
        <button className="home-action battle" onClick={openBattle} type="button">
          <span>Batalla</span>
          <strong>Modo práctica</strong>
        </button>
        <button className="home-action deck" onClick={() => setScreen('deck')} type="button">
          <span>Mazos</span>
          <strong>Editor</strong>
        </button>
        <button className="home-action shop" onClick={() => setScreen('shop')} type="button">
          <span>Tienda</span>
          <strong>{gold} oro</strong>
        </button>
        <button className="home-action locked" type="button" disabled>
          <span>Multijugador</span>
          <strong>Próximamente</strong>
        </button>
      </section>

      <section className="home-preview-card">
        <div className="preview-phone-arena">
          <div className="preview-half enemy-half" />
          <div className="preview-river" />
          <div className="preview-half player-half" />
        </div>
        <div className="preview-copy">
          <strong>Partidas verticales tipo móvil</strong>
          <p>Campo de batalla central, torres con barras de vida y mano inferior de 4 cartas para arrastrar y soltar.</p>
        </div>
      </section>
    </main>
  )
}
