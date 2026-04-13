'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Screen = 'home' | 'practice'
type Lane = 0 | 1
type Side = 'player' | 'bot'
type CardType = 'unit' | 'spell'

type Card = {
  id: string
  name: string
  type: CardType
  cost: number
  hp?: number
  damage: number
  speed?: number
  range?: number
  cooldown?: number
  flavor: string
  rarity: 'Common' | 'Rare' | 'Epic'
  color: string
  price: number
}

type Unit = {
  id: number
  cardId: string
  side: Side
  lane: Lane
  x: number
  hp: number
  maxHp: number
  damage: number
  speed: number
  range: number
  cooldown: number
  attackTimer: number
  color: string
  name: string
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

const cards: Card[] = [
  {
    id: 'deckhand',
    name: 'Deckhand',
    type: 'unit',
    cost: 2,
    hp: 110,
    damage: 18,
    speed: 8,
    range: 5,
    cooldown: 0.9,
    flavor: 'Barato y rapido para rotar.',
    rarity: 'Common',
    color: '#ffd161',
    price: 0,
  },
  {
    id: 'gunner',
    name: 'Coral Gunner',
    type: 'unit',
    cost: 3,
    hp: 120,
    damage: 28,
    speed: 6,
    range: 18,
    cooldown: 1.1,
    flavor: 'Apoyo a distancia para limpiar linea.',
    rarity: 'Common',
    color: '#83d9ff',
    price: 0,
  },
  {
    id: 'brute',
    name: 'Anchor Brute',
    type: 'unit',
    cost: 5,
    hp: 300,
    damage: 36,
    speed: 4,
    range: 5,
    cooldown: 1.2,
    flavor: 'Tanque frontal para empujar.',
    rarity: 'Rare',
    color: '#ff9e6b',
    price: 220,
  },
  {
    id: 'singer',
    name: 'Tide Singer',
    type: 'unit',
    cost: 4,
    hp: 150,
    damage: 24,
    speed: 6,
    range: 16,
    cooldown: 0.8,
    flavor: 'Disparo constante con buen alcance.',
    rarity: 'Rare',
    color: '#9aa8ff',
    price: 180,
  },
  {
    id: 'bomb',
    name: 'Powder Burst',
    type: 'spell',
    cost: 3,
    damage: 72,
    flavor: 'Explota una linea y remata tropas.',
    rarity: 'Common',
    color: '#ff7f9f',
    price: 140,
  },
  {
    id: 'storm',
    name: 'Storm Call',
    type: 'spell',
    cost: 4,
    damage: 96,
    flavor: 'Golpe fuerte de area.',
    rarity: 'Epic',
    color: '#86a8ff',
    price: 320,
  },
  {
    id: 'guard',
    name: 'Harbor Guard',
    type: 'unit',
    cost: 3,
    hp: 220,
    damage: 21,
    speed: 5,
    range: 5,
    cooldown: 1,
    flavor: 'Defensa estable y barata.',
    rarity: 'Common',
    color: '#a6e38a',
    price: 120,
  },
  {
    id: 'captain',
    name: 'Wave Captain',
    type: 'unit',
    cost: 4,
    hp: 210,
    damage: 32,
    speed: 6,
    range: 8,
    cooldown: 0.95,
    flavor: 'Carta versatil para cerrar push.',
    rarity: 'Epic',
    color: '#caa6ff',
    price: 350,
  },
]

const initialOwned = ['deckhand', 'gunner', 'bomb', 'guard']
const initialDeck = ['deckhand', 'gunner', 'bomb', 'guard', 'deckhand', 'gunner', 'bomb', 'guard']
const botDeck = ['deckhand', 'guard', 'gunner', 'bomb', 'brute', 'singer', 'deckhand', 'bomb']

const MAX_ENERGY = 10
const MATCH_TIME = 120

function byId(id: string) {
  return cards.find((card) => card.id === id)!
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
    { id: 'p-top', side: 'player', lane: 0, x: 18, hp: 420, maxHp: 420, damage: 22, range: 22, cooldown: 1.1, attackTimer: 0, label: 'Tower' },
    { id: 'p-bottom', side: 'player', lane: 1, x: 18, hp: 420, maxHp: 420, damage: 22, range: 22, cooldown: 1.1, attackTimer: 0, label: 'Tower' },
    { id: 'p-king', side: 'player', lane: null, x: 7, hp: 900, maxHp: 900, damage: 28, range: 25, cooldown: 1.2, attackTimer: 0, label: 'Flagship' },
    { id: 'b-top', side: 'bot', lane: 0, x: 82, hp: 420, maxHp: 420, damage: 22, range: 22, cooldown: 1.1, attackTimer: 0, label: 'Tower' },
    { id: 'b-bottom', side: 'bot', lane: 1, x: 82, hp: 420, maxHp: 420, damage: 22, range: 22, cooldown: 1.1, attackTimer: 0, label: 'Tower' },
    { id: 'b-king', side: 'bot', lane: null, x: 93, hp: 900, maxHp: 900, damage: 28, range: 25, cooldown: 1.2, attackTimer: 0, label: 'Flagship' },
  ]
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [gold, setGold] = useState(500)
  const [owned, setOwned] = useState<string[]>(initialOwned)
  const [deck, setDeck] = useState<string[]>(initialDeck)
  const [selectedDeckSlot, setSelectedDeckSlot] = useState(0)
  const [selectedBattleCard, setSelectedBattleCard] = useState(0)
  const [playerEnergy, setPlayerEnergy] = useState(5)
  const [botEnergy, setBotEnergy] = useState(5)
  const [timeLeft, setTimeLeft] = useState(MATCH_TIME)
  const [units, setUnits] = useState<Unit[]>([])
  const [towers, setTowers] = useState<Tower[]>(makeTowers())
  const [winner, setWinner] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>(['Pulsa Practica para jugar contra el bot.'])
  const [shopIndex, setShopIndex] = useState(0)

  const unitIdRef = useRef(1)
  const botDecisionRef = useRef(0)
  const unitsRef = useRef<Unit[]>([])
  const towersRef = useRef<Tower[]>([])
  const botEnergyRef = useRef(5)
  const timeLeftRef = useRef(MATCH_TIME)

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
  const shopCards = useMemo(() => cards.filter((card) => !owned.includes(card.id)), [owned])
  const practiceHand = useMemo(() => deck.map((id) => byId(id)), [deck])
  const activeShopCard = shopCards[shopIndex] ?? null

  const pushLog = (message: string) => {
    setLog((current) => [message, ...current].slice(0, 6))
  }

  const resetPractice = () => {
    setUnits([])
    setTowers(makeTowers())
    setPlayerEnergy(5)
    setBotEnergy(5)
    setTimeLeft(MATCH_TIME)
    setWinner(null)
    setSelectedBattleCard(0)
    setLog(['Modo practica activo. Despliega tropas tocando una linea.'])
    unitIdRef.current = 1
    botDecisionRef.current = 0
  }

  const startPractice = () => {
    resetPractice()
    setScreen('practice')
  }

  const swapDeckCard = (cardId: string) => {
    setDeck((current) => current.map((value, index) => (index === selectedDeckSlot ? cardId : value)))
  }

  const buyCard = () => {
    if (!activeShopCard || gold < activeShopCard.price) return
    setGold((value) => value - activeShopCard.price)
    setOwned((current) => [...current, activeShopCard.id])
    pushLog(`Has comprado ${activeShopCard.name}.`)
    setShopIndex(0)
  }

  const summon = (cardId: string, side: Side, lane: Lane) => {
    const card = byId(cardId)

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

      pushLog(`${side === 'player' ? 'Has usado' : 'El bot ha usado'} ${card.name}.`)
      return
    }

    const unit: Unit = {
      id: unitIdRef.current++,
      cardId,
      side,
      lane,
      x: side === 'player' ? 14 : 86,
      hp: card.hp ?? 100,
      maxHp: card.hp ?? 100,
      damage: card.damage,
      speed: card.speed ?? 6,
      range: card.range ?? 5,
      cooldown: card.cooldown ?? 1,
      attackTimer: 0,
      color: card.color,
      name: card.name,
    }

    setUnits((current) => [...current, unit])
    pushLog(`${side === 'player' ? 'Has desplegado' : 'El bot despliega'} ${card.name} en ${lane === 0 ? 'la linea superior' : 'la linea inferior'}.`)
  }

  const deployPlayer = (lane: Lane) => {
    if (winner) return
    const card = practiceHand[selectedBattleCard]
    if (!card || playerEnergy < card.cost) return
    summon(card.id, 'player', lane)
    setPlayerEnergy((value) => clamp(value - card.cost, 0, MAX_ENERGY))
  }

  useEffect(() => {
    if (screen !== 'practice' || winner) return

    const timer = window.setInterval(() => {
      const delta = 0.1

      setTimeLeft((current) => Math.max(0, current - delta))

      const regen = timeLeftRef.current <= 30 ? 0.8 : 0.4
      setPlayerEnergy((current) => clamp(current + regen * delta, 0, MAX_ENERGY))
      setBotEnergy((current) => clamp(current + regen * delta, 0, MAX_ENERGY))

      setUnits((currentUnits) => {
        const updated = currentUnits.map((unit) => ({
          ...unit,
          attackTimer: Math.max(0, unit.attackTimer - delta),
        }))

        const unitDamage = new Map<number, number>()
        const towerDamage = new Map<string, number>()

        for (const unit of updated) {
          const direction = unit.side === 'player' ? 1 : -1
          const enemyUnits = updated
            .filter((enemy) => enemy.side !== unit.side && enemy.lane === unit.lane)
            .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))
          const enemyTowers = towersRef.current
            .filter((tower) => tower.side !== unit.side && (tower.lane === unit.lane || tower.lane === null) && tower.hp > 0)
            .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))

          const enemyUnit = enemyUnits[0]
          const enemyTower = enemyTowers[0]

          if (enemyUnit && Math.abs(enemyUnit.x - unit.x) <= unit.range) {
            if (unit.attackTimer <= 0) {
              unitDamage.set(enemyUnit.id, (unitDamage.get(enemyUnit.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          if (enemyTower && Math.abs(enemyTower.x - unit.x) <= unit.range) {
            if (unit.attackTimer <= 0) {
              towerDamage.set(enemyTower.id, (towerDamage.get(enemyTower.id) ?? 0) + unit.damage)
              unit.attackTimer = unit.cooldown
            }
            continue
          }

          unit.x = clamp(unit.x + unit.speed * delta * direction, 6, 94)
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
          .map((unit) =>
            unitDamage.has(unit.id) ? { ...unit, hp: unit.hp - (unitDamage.get(unit.id) ?? 0) } : unit
          )
          .filter((unit) => unit.hp > 0)
      })

      setTowers((currentTowers) => {
        const updated = currentTowers.map((tower) => ({
          ...tower,
          attackTimer: Math.max(0, tower.attackTimer - delta),
        }))

        const unitDamage = new Map<number, number>()

        for (const tower of updated) {
          if (tower.hp <= 0 || tower.attackTimer > 0) continue
          const target = unitsRef.current
            .filter((unit) => unit.side !== tower.side && (tower.lane === null || unit.lane === tower.lane))
            .sort((a, b) => Math.abs(a.x - tower.x) - Math.abs(b.x - tower.x))[0]

          if (target && Math.abs(target.x - tower.x) <= tower.range) {
            unitDamage.set(target.id, (unitDamage.get(target.id) ?? 0) + tower.damage)
            tower.attackTimer = tower.cooldown
          }
        }

        if (unitDamage.size > 0) {
          setUnits((current) =>
            current
              .map((unit) =>
                unitDamage.has(unit.id) ? { ...unit, hp: unit.hp - (unitDamage.get(unit.id) ?? 0) } : unit
              )
              .filter((unit) => unit.hp > 0)
          )
        }

        return updated
      })

      botDecisionRef.current += delta
      if (botDecisionRef.current >= 2.2) {
        botDecisionRef.current = 0
        const playable = botDeck.map(byId).filter((card) => card.cost <= botEnergyRef.current)
        if (playable.length > 0) {
          const lane: Lane =
            unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 0).length >
            unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 1).length
              ? 0
              : 1
          const chosen = playable[Math.floor(Math.random() * playable.length)]
          summon(chosen.id, 'bot', lane)
          setBotEnergy((current) => clamp(current - chosen.cost, 0, MAX_ENERGY))
        }
      }
    }, 100)

    return () => window.clearInterval(timer)
  }, [screen, winner, practiceHand, selectedBattleCard])

  useEffect(() => {
    if (screen !== 'practice' || winner) return

    const playerKing = towers.find((tower) => tower.id === 'p-king')?.hp ?? 0
    const botKing = towers.find((tower) => tower.id === 'b-king')?.hp ?? 0

    if (playerKing <= 0) {
      setWinner('Derrota')
      pushLog('El bot ha destruido tu flagship.')
      return
    }

    if (botKing <= 0) {
      setWinner('Victoria')
      pushLog('Has destruido el flagship rival.')
      setGold((value) => value + 60)
      return
    }

    if (timeLeft <= 0) {
      const playerTotal = towers.filter((tower) => tower.side === 'player').reduce((sum, tower) => sum + tower.hp, 0)
      const botTotal = towers.filter((tower) => tower.side === 'bot').reduce((sum, tower) => sum + tower.hp, 0)
      const result = playerTotal >= botTotal ? 'Victoria a tiempo' : 'Derrota a tiempo'
      setWinner(result)
      if (playerTotal >= botTotal) {
        setGold((value) => value + 40)
      }
      pushLog(`La practica ha terminado: ${result}.`)
    }
  }, [screen, towers, timeLeft, winner])

  const playerTop = towers.find((tower) => tower.id === 'p-top')
  const playerBottom = towers.find((tower) => tower.id === 'p-bottom')
  const playerKing = towers.find((tower) => tower.id === 'p-king')
  const botTop = towers.find((tower) => tower.id === 'b-top')
  const botBottom = towers.find((tower) => tower.id === 'b-bottom')
  const botKing = towers.find((tower) => tower.id === 'b-king')

  if (screen === 'practice') {
    return (
      <main className="battle-screen">
        <header className="battle-header">
          <button className="back-button" onClick={() => setScreen('home')} type="button">
            Volver
          </button>
          <div className="battle-meta">
            <div>
              <span>Modo</span>
              <strong>Practica</strong>
            </div>
            <div>
              <span>Tiempo</span>
              <strong>{formatTime(timeLeft)}</strong>
            </div>
            <div>
              <span>Resultado</span>
              <strong>{winner ?? 'En juego'}</strong>
            </div>
          </div>
        </header>

        <section className="arena-shell">
          <div className="arena-score">
            <article>
              <span>Tu energia</span>
              <strong>{playerEnergy.toFixed(1)}</strong>
            </article>
            <article>
              <span>Bot</span>
              <strong>{botEnergy.toFixed(1)}</strong>
            </article>
          </div>

          <div className="king-row">
            <div className="king-card player">
              <span>{playerKing?.label}</span>
              <strong>{playerKing?.hp}/{playerKing?.maxHp}</strong>
              <div className="hp"><i style={{ width: `${((playerKing?.hp ?? 0) / (playerKing?.maxHp ?? 1)) * 100}%` }} /></div>
            </div>
            <div className="king-card bot">
              <span>{botKing?.label}</span>
              <strong>{botKing?.hp}/{botKing?.maxHp}</strong>
              <div className="hp"><i style={{ width: `${((botKing?.hp ?? 0) / (botKing?.maxHp ?? 1)) * 100}%` }} /></div>
            </div>
          </div>

          {[0, 1].map((laneNumber) => {
            const lane = laneNumber as Lane
            const leftTower = lane === 0 ? playerTop : playerBottom
            const rightTower = lane === 0 ? botTop : botBottom
            const laneUnits = units.filter((unit) => unit.lane === lane)

            return (
              <button className="lane-strip" key={lane} onClick={() => deployPlayer(lane)} type="button">
                <div className="lane-top">
                  <span>{lane === 0 ? 'Linea superior' : 'Linea inferior'}</span>
                  <small>Haz click para tirar la carta seleccionada</small>
                </div>

                <div className="lane-field">
                  <div className="river" />

                  <div className="tower player" style={{ left: `${leftTower?.x ?? 18}%` }}>
                    <span>{leftTower?.label}</span>
                    <div className="hp"><i style={{ width: `${(((leftTower?.hp ?? 0) / (leftTower?.maxHp ?? 1)) * 100)}%` }} /></div>
                  </div>

                  <div className="tower bot" style={{ left: `${rightTower?.x ?? 82}%` }}>
                    <span>{rightTower?.label}</span>
                    <div className="hp"><i style={{ width: `${(((rightTower?.hp ?? 0) / (rightTower?.maxHp ?? 1)) * 100)}%` }} /></div>
                  </div>

                  {laneUnits.map((unit) => (
                    <div
                      className={`troop ${unit.side}`}
                      key={unit.id}
                      style={{ left: `${unit.x}%`, background: unit.color }}
                    >
                      <b>{unit.name}</b>
                      <div className="hp mini"><i style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </section>

        <section className="practice-bottom">
          <div className="hand-panel">
            <div className="section-title">
              <span>Mano de practica</span>
              <strong>Tu mazo actual</strong>
            </div>
            <div className="hand-grid">
              {practiceHand.map((card, index) => (
                <button
                  className={`battle-card ${selectedBattleCard === index ? 'battle-card-active' : ''} ${playerEnergy < card.cost ? 'battle-card-low' : ''}`}
                  key={`${card.id}-${index}`}
                  onClick={() => setSelectedBattleCard(index)}
                  type="button"
                >
                  <div className="battle-card-top">
                    <span className="cost">{card.cost}</span>
                    <span className="rarity">{card.rarity}</span>
                  </div>
                  <h3>{card.name}</h3>
                  <p>{card.flavor}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="log-panel practice-log">
            <div className="section-title">
              <span>Registro</span>
              <strong>Que esta pasando</strong>
            </div>
            <div className="log-list">
              {log.map((entry, index) => (
                <article key={`${entry}-${index}`}>{entry}</article>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="home-shell">
      <header className="top-banner">
        <div>
          <p className="game-tag">Pirates Card Battle</p>
          <h1>Arena naval de cartas con estructura tipo juego móvil competitivo.</h1>
          <p className="subtitle">
            Hemos rehecho la pantalla principal desde cero con una distribución parecida a la de un
            juego de arena: mazos a la izquierda, acceso a batalla al centro y tienda a la derecha.
          </p>
        </div>
        <div className="gold-box">
          <span>Oro</span>
          <strong>{gold}</strong>
        </div>
      </header>

      <section className="hub-layout">
        <aside className="panel deck-editor">
          <div className="section-title">
            <span>Editor de mazos</span>
            <strong>Tu mazo activo</strong>
          </div>

          <div className="deck-slots">
            {deck.map((cardId, index) => {
              const card = byId(cardId)
              return (
                <button
                  className={`slot-card ${selectedDeckSlot === index ? 'slot-card-active' : ''}`}
                  key={`${cardId}-${index}`}
                  onClick={() => setSelectedDeckSlot(index)}
                  type="button"
                >
                  <span className="slot-index">{index + 1}</span>
                  <div className="slot-card-body">
                    <strong>{card.name}</strong>
                    <small>{card.cost} elixir</small>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="collection-grid">
            {ownedCards.map((card) => (
              <button className="collection-card" key={card.id} onClick={() => swapDeckCard(card.id)} type="button">
                <div className="battle-card-top">
                  <span className="cost">{card.cost}</span>
                  <span className="rarity">{card.rarity}</span>
                </div>
                <h3>{card.name}</h3>
                <p>{card.flavor}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel center-stage">
          <div className="arena-preview">
            <div className="arena-preview-header">
              <span>Puerto Esmeralda</span>
              <strong>Batalla 1v1</strong>
            </div>
            <div className="preview-board">
              <div className="preview-lane">
                <i className="mini-tower left" />
                <i className="mini-boat mid" />
                <i className="mini-tower right" />
              </div>
              <div className="preview-lane">
                <i className="mini-tower left" />
                <i className="mini-boat mid" />
                <i className="mini-tower right" />
              </div>
            </div>
          </div>

          <div className="play-actions">
            <button className="big-play practice" onClick={startPractice} type="button">
              Practica
            </button>
            <button className="big-play multiplayer" type="button" disabled>
              Multijugador
              <small>Proximamente</small>
            </button>
          </div>

          <div className="feature-strip">
            <article>
              <strong>Multijugador</strong>
              <p>Lo dejaremos preparado, pero por ahora entra al modo práctica contra bot.</p>
            </article>
            <article>
              <strong>Tienda</strong>
              <p>Compra cartas originales con oro para ampliar tu colección.</p>
            </article>
            <article>
              <strong>Mazos</strong>
              <p>Puedes modificar tus 8 huecos del mazo desde la pantalla principal.</p>
            </article>
          </div>
        </section>

        <aside className="panel shop-panel">
          <div className="section-title">
            <span>Tienda</span>
            <strong>Ofertas del dia</strong>
          </div>

          {activeShopCard ? (
            <div className="shop-card-large">
              <div className="shop-art" style={{ background: activeShopCard.color }} />
              <h3>{activeShopCard.name}</h3>
              <p>{activeShopCard.flavor}</p>
              <div className="shop-meta">
                <span>{activeShopCard.rarity}</span>
                <strong>{activeShopCard.price} oro</strong>
              </div>
              <button className="buy-button" onClick={buyCard} type="button">
                Comprar
              </button>
            </div>
          ) : (
            <div className="shop-empty">
              <strong>Tienes todas las cartas de esta demo.</strong>
              <p>La siguiente fase será meter progreso, cofres y rotación diaria real.</p>
            </div>
          )}

          <div className="shop-list">
            {shopCards.map((card, index) => (
              <button
                className={`shop-row ${shopIndex === index ? 'shop-row-active' : ''}`}
                key={card.id}
                onClick={() => setShopIndex(index)}
                type="button"
              >
                <span>{card.name}</span>
                <strong>{card.price}</strong>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}
