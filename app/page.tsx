'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Side = 'player' | 'enemy'
type Lane = 0 | 1
type CardKind = 'unit' | 'spell'

type CardDefinition = {
  id: string
  name: string
  title: string
  type: CardKind
  cost: number
  health?: number
  damage?: number
  speed?: number
  range?: number
  cooldown?: number
  color: string
  accent: string
  description: string
}

type UnitState = {
  id: number
  cardId: string
  name: string
  side: Side
  lane: Lane
  x: number
  health: number
  maxHealth: number
  damage: number
  speed: number
  range: number
  cooldown: number
  attackTimer: number
  color: string
  accent: string
}

type TowerState = {
  id: string
  name: string
  side: Side
  lane: Lane | null
  x: number
  health: number
  maxHealth: number
  damage: number
  range: number
  cooldown: number
  attackTimer: number
}

type FloatingText = {
  id: number
  lane: Lane
  x: number
  y: number
  text: string
  color: string
  ttl: number
}

const GAME_DURATION = 150
const PLAYER_SPAWN_X = 16
const ENEMY_SPAWN_X = 84
const ENERGY_MAX = 10
const ENERGY_REGEN = 0.42
const DOUBLE_ENERGY_TIME = 45
const AI_DECISION_INTERVAL = 2.8

const cardDefinitions: CardDefinition[] = [
  { id: 'cutlass-raider', name: 'Corsario', title: 'Cutlass Raider', type: 'unit', cost: 3, health: 180, damage: 24, speed: 9, range: 4, cooldown: 0.75, color: '#ffbe5c', accent: '#fff1c8', description: 'Espadachin rapido para presion constante.' },
  { id: 'reef-musician', name: 'Musico', title: 'Reef Musician', type: 'unit', cost: 4, health: 150, damage: 35, speed: 7, range: 17, cooldown: 1, color: '#79e3ff', accent: '#e0fbff', description: 'Apoyo a distancia con ritmos de marea.' },
  { id: 'anchor-brute', name: 'Bruto', title: 'Anchor Brute', type: 'unit', cost: 5, health: 320, damage: 42, speed: 5, range: 5, cooldown: 1.2, color: '#ff8566', accent: '#ffe1d8', description: 'Tanque pesado para abrir paso.' },
  { id: 'storm-caller', name: 'Tormenta', title: 'Storm Caller', type: 'spell', cost: 4, damage: 95, color: '#77a8ff', accent: '#edf3ff', description: 'Descarga electrica que limpia una linea.' },
  { id: 'harpoon-hunter', name: 'Arponero', title: 'Harpoon Hunter', type: 'unit', cost: 2, health: 92, damage: 18, speed: 11, range: 11, cooldown: 0.85, color: '#8be38b', accent: '#efffe7', description: 'Unidad barata para rotacion y chip.' },
  { id: 'tide-sorcerer', name: 'Marea', title: 'Tide Sorcerer', type: 'unit', cost: 4, health: 140, damage: 28, speed: 7, range: 15, cooldown: 0.7, color: '#9a87ff', accent: '#f2eeff', description: 'Hechicero veloz con dano sostenido.' },
  { id: 'deck-guard', name: 'Guardia', title: 'Deck Guard', type: 'unit', cost: 3, health: 220, damage: 20, speed: 6, range: 4, cooldown: 0.8, color: '#ffd972', accent: '#fff7d1', description: 'Defensor equilibrado para aguantar pushes.' },
  { id: 'powder-burst', name: 'Polvora', title: 'Powder Burst', type: 'spell', cost: 3, damage: 68, color: '#ff7f98', accent: '#ffe5ec', description: 'Explosion rapida para rematar tropas.' },
]

const playerDeck = ['cutlass-raider', 'reef-musician', 'anchor-brute', 'storm-caller', 'harpoon-hunter', 'tide-sorcerer', 'deck-guard', 'powder-burst']
const enemyDeck = ['deck-guard', 'powder-burst', 'anchor-brute', 'harpoon-hunter', 'reef-musician', 'storm-caller', 'cutlass-raider', 'tide-sorcerer']

const cardById = Object.fromEntries(cardDefinitions.map((card) => [card.id, card])) as Record<string, CardDefinition>

function createInitialTowers(): TowerState[] {
  return [
    { id: 'player-port', name: 'Canon de Babor', side: 'player', lane: 0, x: 20, health: 420, maxHealth: 420, damage: 22, range: 24, cooldown: 1.15, attackTimer: 0 },
    { id: 'player-starboard', name: 'Canon de Estribor', side: 'player', lane: 1, x: 20, health: 420, maxHealth: 420, damage: 22, range: 24, cooldown: 1.15, attackTimer: 0 },
    { id: 'player-flagship', name: 'Flagship', side: 'player', lane: null, x: 8, health: 900, maxHealth: 900, damage: 30, range: 28, cooldown: 1.35, attackTimer: 0 },
    { id: 'enemy-port', name: 'Canon de Babor', side: 'enemy', lane: 0, x: 80, health: 420, maxHealth: 420, damage: 22, range: 24, cooldown: 1.15, attackTimer: 0 },
    { id: 'enemy-starboard', name: 'Canon de Estribor', side: 'enemy', lane: 1, x: 80, health: 420, maxHealth: 420, damage: 22, range: 24, cooldown: 1.15, attackTimer: 0 },
    { id: 'enemy-flagship', name: 'Flagship', side: 'enemy', lane: null, x: 92, health: 900, maxHealth: 900, damage: 30, range: 28, cooldown: 1.35, attackTimer: 0 },
  ]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatTime(timeLeft: number) {
  const total = Math.max(0, Math.ceil(timeLeft))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function healthPercent(current: number, max: number) {
  return `${clamp((current / max) * 100, 0, 100)}%`
}

export default function HomePage() {
  const [units, setUnits] = useState<UnitState[]>([])
  const [towers, setTowers] = useState<TowerState[]>(createInitialTowers)
  const [playerEnergy, setPlayerEnergy] = useState(6)
  const [enemyEnergy, setEnemyEnergy] = useState(6)
  const [selectedCardId, setSelectedCardId] = useState(playerDeck[0])
  const [selectedLane, setSelectedLane] = useState<Lane>(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [battleState, setBattleState] = useState<'running' | 'finished'>('running')
  const [winner, setWinner] = useState<string | null>(null)
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [battleLog, setBattleLog] = useState<string[]>(['La arena esta lista. Despliega cartas en una linea para romper el barco rival.'])

  const unitIdRef = useRef(1)
  const textIdRef = useRef(1)
  const aiDecisionRef = useRef(0)
  const unitsRef = useRef<UnitState[]>([])
  const towersRef = useRef<TowerState[]>(createInitialTowers())
  const enemyEnergyRef = useRef(6)
  const timeLeftRef = useRef(GAME_DURATION)

  const liveCards = useMemo(() => playerDeck.map((id) => cardById[id]), [])

  useEffect(() => {
    unitsRef.current = units
  }, [units])

  useEffect(() => {
    towersRef.current = towers
  }, [towers])

  useEffect(() => {
    enemyEnergyRef.current = enemyEnergy
  }, [enemyEnergy])

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  const addLog = (message: string) => {
    setBattleLog((current) => [message, ...current].slice(0, 6))
  }

  const addFloatingText = (lane: Lane, x: number, text: string, color: string) => {
    const id = textIdRef.current++
    setFloatingTexts((current) => [...current, { id, lane, x, y: lane === 0 ? 26 : 74, text, color, ttl: 0.9 }])
  }

  const summonCard = (cardId: string, side: Side, lane: Lane) => {
    const card = cardById[cardId]
    if (!card) return false

    if (card.type === 'spell') {
      setUnits((currentUnits) =>
        currentUnits
          .map((unit) => {
            if (unit.side === side || unit.lane !== lane) return unit
            addFloatingText(lane, unit.x, `-${card.damage}`, card.color)
            return { ...unit, health: unit.health - (card.damage ?? 0) }
          })
          .filter((unit) => unit.health > 0)
      )

      setTowers((currentTowers) =>
        currentTowers.map((tower) => {
          if (tower.side === side || (tower.lane !== lane && tower.lane !== null)) return tower
          const damage = Math.round((card.damage ?? 0) * (tower.lane === null ? 0.55 : 0.7))
          addFloatingText(lane, tower.x, `-${damage}`, card.color)
          return { ...tower, health: Math.max(0, tower.health - damage) }
        })
      )

      addLog(`${side === 'player' ? 'Tu tripulacion' : 'El rival'} lanzo ${card.title} en ${lane === 0 ? 'Babor' : 'Estribor'}.`)
      return true
    }

    const unit: UnitState = {
      id: unitIdRef.current++,
      cardId: card.id,
      name: card.title,
      side,
      lane,
      x: side === 'player' ? PLAYER_SPAWN_X : ENEMY_SPAWN_X,
      health: card.health ?? 100,
      maxHealth: card.health ?? 100,
      damage: card.damage ?? 10,
      speed: card.speed ?? 8,
      range: card.range ?? 5,
      cooldown: card.cooldown ?? 1,
      attackTimer: 0,
      color: card.color,
      accent: card.accent,
    }

    setUnits((current) => [...current, unit])
    addLog(`${side === 'player' ? 'Has jugado' : 'El enemigo invoco'} ${card.title} por ${lane === 0 ? 'Babor' : 'Estribor'}.`)
    return true
  }

  const deployPlayerCard = (lane: Lane) => {
    if (battleState !== 'running') return
    const card = cardById[selectedCardId]
    if (!card || playerEnergy < card.cost) return

    const success = summonCard(card.id, 'player', lane)
    if (success) {
      setPlayerEnergy((current) => clamp(current - card.cost, 0, ENERGY_MAX))
      setSelectedLane(lane)
    }
  }

  const restartBattle = () => {
    setUnits([])
    setTowers(createInitialTowers())
    setPlayerEnergy(6)
    setEnemyEnergy(6)
    setSelectedCardId(playerDeck[0])
    setSelectedLane(0)
    setTimeLeft(GAME_DURATION)
    setBattleState('running')
    setWinner(null)
    setFloatingTexts([])
    setBattleLog(['Nueva batalla. Tu tripulacion espera ordenes.'])
    unitIdRef.current = 1
    textIdRef.current = 1
    aiDecisionRef.current = 0
  }

  useEffect(() => {
    if (battleState !== 'running') return

    let previous = performance.now()
    let frameId = 0

    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now

      setTimeLeft((current) => Math.max(0, current - delta))
      setFloatingTexts((current) => current.map((item) => ({ ...item, ttl: item.ttl - delta, y: item.y - delta * 7 })).filter((item) => item.ttl > 0))

      const regenMultiplier = timeLeftRef.current <= DOUBLE_ENERGY_TIME ? 2 : 1
      setPlayerEnergy((current) => clamp(current + ENERGY_REGEN * regenMultiplier * delta, 0, ENERGY_MAX))
      setEnemyEnergy((current) => clamp(current + ENERGY_REGEN * regenMultiplier * delta, 0, ENERGY_MAX))
      aiDecisionRef.current += delta

      setUnits((currentUnits) => {
        const updatedUnits = currentUnits.map((unit) => ({ ...unit, attackTimer: Math.max(0, unit.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()
        const towerDamage = new Map<string, number>()

        for (const unit of updatedUnits) {
          if (unit.health <= 0) continue

          const direction = unit.side === 'player' ? 1 : -1
          const enemyUnits = updatedUnits.filter((other) => other.side !== unit.side && other.lane === unit.lane && other.health > 0)
          const enemyTowers = towersRef.current.filter((tower) => tower.side !== unit.side && (tower.lane === unit.lane || tower.lane === null) && tower.health > 0).sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))
          const nearestEnemyUnit = enemyUnits.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0]
          const nearestTower = enemyTowers[0]
          const unitDistance = nearestEnemyUnit ? Math.abs(nearestEnemyUnit.x - unit.x) : Number.POSITIVE_INFINITY
          const towerDistance = nearestTower ? Math.abs(nearestTower.x - unit.x) : Number.POSITIVE_INFINITY

          if (nearestEnemyUnit && unitDistance <= unit.range) {
            if (unit.attackTimer <= 0) {
              unitDamage.set(nearestEnemyUnit.id, (unitDamage.get(nearestEnemyUnit.id) ?? 0) + unit.damage)
              addFloatingText(unit.lane, nearestEnemyUnit.x, `-${unit.damage}`, unit.accent)
              unit.attackTimer = unit.cooldown
            }
          } else if (nearestTower && towerDistance <= unit.range) {
            if (unit.attackTimer <= 0) {
              towerDamage.set(nearestTower.id, (towerDamage.get(nearestTower.id) ?? 0) + unit.damage)
              addFloatingText(unit.lane, nearestTower.x, `-${unit.damage}`, unit.accent)
              unit.attackTimer = unit.cooldown
            }
          } else {
            unit.x = clamp(unit.x + unit.speed * delta * direction, 6, 94)
          }
        }

        if (towerDamage.size > 0) {
          setTowers((currentTowers) =>
            currentTowers.map((tower) => {
              const pendingDamage = towerDamage.get(tower.id)
              return pendingDamage ? { ...tower, health: Math.max(0, tower.health - pendingDamage) } : tower
            })
          )
        }

        return updatedUnits
          .map((unit) => {
            const pendingDamage = unitDamage.get(unit.id) ?? 0
            return pendingDamage > 0 ? { ...unit, health: unit.health - pendingDamage } : unit
          })
          .filter((unit) => unit.health > 0)
      })

      setTowers((currentTowers) => {
        const nextTowers = currentTowers.map((tower) => ({ ...tower, attackTimer: Math.max(0, tower.attackTimer - delta) }))
        const unitDamage = new Map<number, number>()

        for (const tower of nextTowers) {
          if (tower.health <= 0 || tower.attackTimer > 0) continue

          const targets = unitsRef.current
            .filter((unit) => unit.side !== tower.side && unit.health > 0 && (tower.lane === null || unit.lane === tower.lane))
            .sort((a, b) => Math.abs(a.x - tower.x) - Math.abs(b.x - tower.x))

          const target = targets[0]
          if (target && Math.abs(target.x - tower.x) <= tower.range) {
            unitDamage.set(target.id, (unitDamage.get(target.id) ?? 0) + tower.damage)
            addFloatingText(target.lane, target.x, `-${tower.damage}`, tower.side === 'player' ? '#ffe9b8' : '#ffd8d3')
            tower.attackTimer = tower.cooldown
          }
        }

        if (unitDamage.size > 0) {
          setUnits((currentUnits) =>
            currentUnits
              .map((unit) => {
                const pendingDamage = unitDamage.get(unit.id)
                return pendingDamage ? { ...unit, health: unit.health - pendingDamage } : unit
              })
              .filter((unit) => unit.health > 0)
          )
        }

        return nextTowers
      })

      if (aiDecisionRef.current >= AI_DECISION_INTERVAL) {
        aiDecisionRef.current = 0
        const playable = enemyDeck.map((id) => cardById[id]).filter((card) => card.cost <= enemyEnergyRef.current).sort((a, b) => a.cost - b.cost)
        if (playable.length > 0) {
          const topPressure = unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 0).length
          const bottomPressure = unitsRef.current.filter((unit) => unit.side === 'player' && unit.lane === 1).length
          const lane: Lane = topPressure > bottomPressure ? 0 : bottomPressure > topPressure ? 1 : Math.random() > 0.5 ? 1 : 0
          const chosenCard = playable[playable.length - 1]
          const success = summonCard(chosenCard.id, 'enemy', lane)
          if (success) setEnemyEnergy((current) => clamp(current - chosenCard.cost, 0, ENERGY_MAX))
        }
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [battleState])

  useEffect(() => {
    const playerFlagship = towers.find((tower) => tower.id === 'player-flagship')
    const enemyFlagship = towers.find((tower) => tower.id === 'enemy-flagship')
    if (battleState === 'finished' || !playerFlagship || !enemyFlagship) return

    if (playerFlagship.health <= 0 || enemyFlagship.health <= 0 || timeLeft <= 0) {
      const playerScore = towers.filter((tower) => tower.side === 'player').reduce((sum, tower) => sum + Math.max(0, tower.health), 0) + units.filter((unit) => unit.side === 'player').reduce((sum, unit) => sum + unit.health, 0)
      const enemyScore = towers.filter((tower) => tower.side === 'enemy').reduce((sum, tower) => sum + Math.max(0, tower.health), 0) + units.filter((unit) => unit.side === 'enemy').reduce((sum, unit) => sum + unit.health, 0)
      const result = enemyFlagship.health <= 0 ? 'Victoria pirata' : playerFlagship.health <= 0 ? 'Derrota' : playerScore >= enemyScore ? 'Victoria por puntos' : 'Derrota por puntos'
      setWinner(result)
      setBattleState('finished')
      addLog(`Fin de partida: ${result}.`)
    }
  }, [battleState, timeLeft, towers, units])

  const playerTowers = towers.filter((tower) => tower.side === 'player')
  const enemyTowers = towers.filter((tower) => tower.side === 'enemy')
  const crownScore = { player: enemyTowers.filter((tower) => tower.health <= 0).length, enemy: playerTowers.filter((tower) => tower.health <= 0).length }
  const regenLabel = timeLeft <= DOUBLE_ENERGY_TIME ? 'Doble energia' : 'Energia normal'

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Pirates Card Battle</p>
          <h1>Arena pirata en tiempo real con mazos, energia y asalto naval.</h1>
          <p className="lead">
            Este prototipo es una base original inspirada en el ritmo de un arena battler: despliegas cartas por linea, acumulas energia, defiendes tus canones y buscas hundir el flagship enemigo antes de que termine el tiempo.
          </p>
          <div className="hero-stats">
            <article><strong>8</strong><span>cartas en el mazo</span></article>
            <article><strong>2</strong><span>lineas de combate</span></article>
            <article><strong>150s</strong><span>duracion de partida</span></article>
          </div>
        </div>

        <div className="hero-side">
          <div className="info-card">
            <p className="eyebrow">Roadmap del MVP</p>
            <ul>
              <li>Combate en navegador con bot rival.</li>
              <li>Mazo editable y progresion.</li>
              <li>Matchmaking, backend y cuentas.</li>
              <li>Arte, audio y monetizacion original.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="battle-layout">
        <div className="arena-panel">
          <div className="arena-topbar">
            <div><span className="tiny-label">Estado</span><strong>{battleState === 'running' ? 'Batalla activa' : winner ?? 'Partida finalizada'}</strong></div>
            <div><span className="tiny-label">Tiempo</span><strong>{formatTime(timeLeft)}</strong></div>
            <div><span className="tiny-label">Ritmo</span><strong>{regenLabel}</strong></div>
          </div>

          <div className="scoreboard">
            <article className="score-card enemy"><span>Rival</span><strong>{crownScore.enemy}</strong><small>torres destruidas</small></article>
            <article className="score-card player"><span>Tu tripulacion</span><strong>{crownScore.player}</strong><small>torres destruidas</small></article>
          </div>

          <div className="arena">
            {[0, 1].map((laneNumber) => {
              const lane = laneNumber as Lane
              const laneName = lane === 0 ? 'Babor' : 'Estribor'
              const lanePlayerTowers = playerTowers.filter((tower) => tower.lane === lane)
              const laneEnemyTowers = enemyTowers.filter((tower) => tower.lane === lane)
              const lanePlayerUnits = units.filter((unit) => unit.side === 'player' && unit.lane === lane)
              const laneEnemyUnits = units.filter((unit) => unit.side === 'enemy' && unit.lane === lane)

              return (
                <button className={`lane ${selectedLane === lane ? 'lane-active' : ''}`} key={lane} onClick={() => deployPlayerCard(lane)} type="button">
                  <div className="lane-header">
                    <span>{laneName}</span>
                    <small>Click para desplegar la carta seleccionada</small>
                  </div>

                  <div className="lane-water">
                    <div className="lane-path" />
                    {lanePlayerTowers.map((tower) => (
                      <div className="tower-chip player" key={tower.id} style={{ left: `${tower.x}%` }}>
                        <span>{tower.name}</span>
                        <div className="hp-bar"><i style={{ width: healthPercent(tower.health, tower.maxHealth) }} /></div>
                      </div>
                    ))}
                    {laneEnemyTowers.map((tower) => (
                      <div className="tower-chip enemy" key={tower.id} style={{ left: `${tower.x}%` }}>
                        <span>{tower.name}</span>
                        <div className="hp-bar"><i style={{ width: healthPercent(tower.health, tower.maxHealth) }} /></div>
                      </div>
                    ))}
                    {lanePlayerUnits.map((unit) => (
                      <div className="unit-chip player" key={unit.id} style={{ left: `${unit.x}%`, background: unit.color, color: '#07121f' }}>
                        <b>{unit.name}</b>
                        <div className="hp-bar compact"><i style={{ width: healthPercent(unit.health, unit.maxHealth), background: unit.accent }} /></div>
                      </div>
                    ))}
                    {laneEnemyUnits.map((unit) => (
                      <div className="unit-chip enemy" key={unit.id} style={{ left: `${unit.x}%`, background: unit.color, color: '#07121f' }}>
                        <b>{unit.name}</b>
                        <div className="hp-bar compact"><i style={{ width: healthPercent(unit.health, unit.maxHealth), background: unit.accent }} /></div>
                      </div>
                    ))}
                    {floatingTexts.filter((text) => text.lane === lane).map((text) => (
                      <span className="floating-text" key={text.id} style={{ left: `${text.x}%`, top: `${text.y}%`, color: text.color, opacity: text.ttl }}>
                        {text.text}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}

            <div className="flagships">
              {playerTowers.filter((tower) => tower.lane === null).map((tower) => (
                <article className="flagship-card player" key={tower.id}>
                  <span>{tower.name}</span>
                  <strong>{tower.health}/{tower.maxHealth}</strong>
                  <div className="hp-bar"><i style={{ width: healthPercent(tower.health, tower.maxHealth) }} /></div>
                </article>
              ))}
              {enemyTowers.filter((tower) => tower.lane === null).map((tower) => (
                <article className="flagship-card enemy" key={tower.id}>
                  <span>{tower.name}</span>
                  <strong>{tower.health}/{tower.maxHealth}</strong>
                  <div className="hp-bar"><i style={{ width: healthPercent(tower.health, tower.maxHealth) }} /></div>
                </article>
              ))}
            </div>
          </div>

          <div className="arena-actions">
            <button className="secondary-button" onClick={restartBattle} type="button">Reiniciar partida</button>
            <p>Selecciona una carta debajo y pulsa una linea para invocarla. Si no tienes energia suficiente, espera a la recarga.</p>
          </div>
        </div>

        <aside className="sidebar">
          <section className="deck-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Deck</p>
                <h2>Mazo activo</h2>
              </div>
              <div className="energy-panel">
                <span>Energia</span>
                <strong>{playerEnergy.toFixed(1)} / 10</strong>
              </div>
            </div>
            <div className="energy-track"><i style={{ width: `${(playerEnergy / ENERGY_MAX) * 100}%` }} /></div>
            <div className="cards-grid">
              {liveCards.map((card) => {
                const playable = playerEnergy >= card.cost && battleState === 'running'
                return (
                  <button className={`deck-card ${selectedCardId === card.id ? 'deck-card-active' : ''} ${playable ? '' : 'deck-card-disabled'}`} key={card.id} onClick={() => setSelectedCardId(card.id)} type="button">
                    <div className="deck-card-top">
                      <span className="cost-orb">{card.cost}</span>
                      <span className="tag">{card.type === 'unit' ? 'Unidad' : 'Hechizo'}</span>
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="log-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Battle Log</p>
                <h2>Evento a evento</h2>
              </div>
            </div>
            <div className="log-list">
              {battleLog.map((entry, index) => <article key={`${entry}-${index}`}>{entry}</article>)}
            </div>
          </section>

          <section className="needs-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Siguiente fase</p>
                <h2>Lo que todavia hace falta</h2>
              </div>
            </div>
            <ul className="needs-list">
              <li>Backend real para cuentas, progreso, matchmaking y datos persistentes.</li>
              <li>Servidor autoritativo para PvP online y anti-cheat.</li>
              <li>Arte, UI polish, audio y efectos propios con identidad original.</li>
              <li>Balanceo serio de cartas, economia y progresion.</li>
              <li>Sistema de tutorial, recompensas, tienda y coleccion.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  )
}
