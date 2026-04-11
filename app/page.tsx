const highlights = [
  {
    title: 'Batallas 1v1 en tiempo real',
    text: 'Entra a la arena, tira tus cartas en el momento justo y rompe las torres rivales antes de que te derriben a ti.',
  },
  {
    title: 'Mazos de 8 cartas',
    text: 'Mezcla capitanes, unidades, habilidades y estructuras para montar combinaciones agresivas, de control o de contraataque.',
  },
  {
    title: 'Coleccion y tienda',
    text: 'Consigue nuevas cartas, mejora tu coleccion y refuerza tu estrategia con recompensas, monedas y compras dentro del juego.',
  },
]

const cards = [
  { name: 'Captain Rush', type: 'Ataque', cost: '4', rarity: 'Epica' },
  { name: 'Sea King Guard', type: 'Defensa', cost: '5', rarity: 'Legendaria' },
  { name: 'Gum Storm', type: 'Hechizo', cost: '3', rarity: 'Rara' },
  { name: 'Sniper Tower', type: 'Estructura', cost: '6', rarity: 'Comun' },
]

const pillars = [
  'Sube trofeos ganando duelos rapidos.',
  'Edita tu deck y ajusta tu estilo de juego.',
  'Crea salas privadas para jugar con amigos.',
  'Escala el ranking de los mejores piratas.',
]

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Pirates Card Battle</p>
          <h1>El choque de mazos pirata que lleva la energia de la arena al Grand Line.</h1>
          <p className="lead">
            Un juego competitivo inspirado en el ritmo de Clash Royale, con identidad anime y
            sabor de tripulaciones, poderes y combates navales. Construye tu mazo, domina la
            energia y aplasta las torres enemigas.
          </p>

          <div className="hero-actions">
            <a className="primary-link" href="#arena">
              Entrar a la arena
            </a>
            <a className="secondary-link" href="#deck">
              Ver el deck
            </a>
          </div>

          <div className="pill-row">
            <span>1v1</span>
            <span>Tiempo real</span>
            <span>Deck de 8</span>
            <span>Ranking</span>
          </div>
        </div>

        <div className="hero-showcase">
          <div className="battle-card battle-card-main">
            <p className="card-label">Arena Match</p>
            <div className="versus-row">
              <div>
                <strong>Player</strong>
                <span>1178 trofeos</span>
              </div>
              <b>VS</b>
              <div>
                <strong>Yonko Bot</strong>
                <span>1204 trofeos</span>
              </div>
            </div>
            <div className="tower-bar">
              <span className="tower blue" />
              <span className="tower blue" />
              <span className="tower red" />
              <span className="tower red" />
            </div>
            <p className="energy-copy">Energia lista. Juega una carta y lanza el push final.</p>
          </div>

          <div className="battle-card battle-card-side">
            <p className="card-label">Tienda</p>
            <strong>Oferta destacada</strong>
            <span>Sea King Guard</span>
            <em>600 monedas</em>
          </div>
        </div>
      </section>

      <section className="panel" id="arena">
        <div className="section-heading">
          <p className="eyebrow">La Experiencia</p>
          <h2>Todo lo que hace que cada partida se sienta intensa</h2>
        </div>

        <div className="feature-grid">
          {highlights.map((item) => (
            <article className="feature-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel deck-panel" id="deck">
        <div className="section-heading">
          <p className="eyebrow">Deck Builder</p>
          <h2>Ejemplo de cartas para montar una composicion ofensiva</h2>
        </div>

        <div className="cards-grid">
          {cards.map((card) => (
            <article className="game-card" key={card.name}>
              <div className="game-card-top">
                <span className="mana-cost">{card.cost}</span>
                <span className="rarity-pill">{card.rarity}</span>
              </div>
              <h3>{card.name}</h3>
              <p>{card.type}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel status-panel">
        <div className="section-heading">
          <p className="eyebrow">Core Loop</p>
          <h2>El juego gira alrededor de progresion, combate y coleccion</h2>
        </div>

        <div className="status-layout">
          <article className="status-card">
            <h3>Dentro de la partida</h3>
            <ul>
              <li>Gestiona la energia y no malgastes el tempo.</li>
              <li>Presiona una linea o responde al push rival.</li>
              <li>Protege tus torres mientras fuerzas el avance.</li>
            </ul>
          </article>

          <article className="status-card">
            <h3>Fuera de la partida</h3>
            <ul>
              {pillars.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  )
}
