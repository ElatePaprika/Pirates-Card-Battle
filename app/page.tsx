const features = [
  {
    title: 'Batallas rapidas',
    text: 'Partidas directas con ritmo agil para enfrentar mazos rivales y subir en la clasificacion.',
  },
  {
    title: 'Coleccion de cartas',
    text: 'Construye tu deck con unidades, torres y estrategias pensadas para dominar el mar.',
  },
  {
    title: 'Progresion pirata',
    text: 'Consigue monedas, trofeos y mejoras para hacer crecer tu perfil capitan.',
  },
]

const roadmap = [
  'Autenticacion de jugadores y perfiles persistentes.',
  'Sistema de tienda para ampliar la coleccion.',
  'Ranking con mejores capitanes y recompensas.',
]

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Pirates Card Battle</p>
          <h1>Una base web estable para que tu proyecto se vea bien en Vercel.</h1>
          <p className="lead">
            Esta version publica presenta el juego como experiencia web mientras el codigo
            movil y del backend permanecen dentro del repositorio para seguir desarrollandolos.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#features">
              Ver caracteristicas
            </a>
            <a className="secondary-link" href="#status">
              Estado del proyecto
            </a>
          </div>
        </div>

        <div className="hero-card">
          <span className="hero-badge">Deck del Capitan</span>
          <div className="stat-grid">
            <article>
              <strong>3</strong>
              <span>Modulos base</span>
            </article>
            <article>
              <strong>Web</strong>
              <span>Lista para deploy</span>
            </article>
            <article>
              <strong>Next.js</strong>
              <span>Export estatico</span>
            </article>
          </div>
        </div>
      </section>

      <section className="panel" id="features">
        <div className="section-heading">
          <p className="eyebrow">Caracteristicas</p>
          <h2>Lo que ya define la fantasia del juego</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel status-panel" id="status">
        <div className="section-heading">
          <p className="eyebrow">Estado</p>
          <h2>Preparado para mostrarse correctamente en Vercel</h2>
        </div>

        <div className="status-layout">
          <article className="status-card">
            <h3>Que se corrigio</h3>
            <ul>
              <li>Se anadio una app web valida en la raiz para Next.js.</li>
              <li>Se excluyo la app movil interna del chequeo de TypeScript del deploy.</li>
              <li>Se simplifico la configuracion de Vercel para evitar rutas rotas.</li>
            </ul>
          </article>

          <article className="status-card">
            <h3>Siguiente roadmap</h3>
            <ul>
              {roadmap.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  )
}
