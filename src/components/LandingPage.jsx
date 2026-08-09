import { useNavigate } from 'react-router-dom';
import { getAllPosts } from '../lib/blog';
import './LandingPage.css';

const TOOLS = [
  {
    path: "/herramientas",
    icon: "📊",
    color: "blue",
    name: "Carga Financiera",
    desc: "Calcula tu capacidad de endeudamiento y ahorro mensual.",
  },
  {
    path: "/herramientas/credito",
    icon: "🏦",
    color: "green",
    name: "Crédito de Consumo",
    desc: "Compara tasas, CAE y simula cuotas entre dos bancos.",
  },
  {
    path: "/herramientas/tarjetas",
    icon: "💳",
    color: "amber",
    name: "Plan de Tarjetas",
    desc: "Avalancha o bola de nieve para eliminar tus deudas.",
  },
  {
    path: "/herramientas/inversiones",
    icon: "📈",
    color: "purple",
    name: "Simulador de Inversión",
    desc: "Proyecta el crecimiento de tu dinero con interés compuesto.",
  },
];

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LandingPage() {
  const navigate = useNavigate();

  // Los posts ya vienen ordenados de más nuevo a más viejo (ver src/lib/blog.js)
  const posts = getAllPosts();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="lp-page">

      {/* HERO */}
      <section className="lp-hero">
        <span className="lp-badge">💸 Herramienta Personal</span>
        <h1 className="lp-hero-title">
          Finanzas<br />
          <span>Personales</span>
        </h1>
        <p className="lp-hero-sub">
          Gestiona tu salud financiera, simula créditos y organiza tus tarjetas.
        </p>
        <div className="lp-hero-btns">
          <button className="lp-btn-primary" onClick={() => navigate('/herramientas')}>
            Ir a las herramientas
          </button>
          <button className="lp-btn-secondary" onClick={() => document.getElementById('blog').scrollIntoView({ behavior: 'smooth' })}>
            Ver artículos
          </button>
        </div>
      </section>

      {/* HERRAMIENTAS */}
      <section className="lp-section">
        <p className="lp-section-label">Herramientas disponibles</p>
        <div className="lp-tools-grid">
          {TOOLS.map(t => (
            <button key={t.path} className={`lp-tool-card lp-tool-${t.color}`} onClick={() => navigate(t.path)}>
              <span className="lp-tool-icon">{t.icon}</span>
              <p className="lp-tool-name">{t.name}</p>
              <p className="lp-tool-desc">{t.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* BLOG */}
      <section className="lp-section" id="blog">
        <div className="lp-blog-header">
          <p className="lp-section-label">Últimos artículos</p>
          <button className="lp-btn-secondary" onClick={() => navigate('/blog')}>
            Ver todos →
          </button>
        </div>
        <div className="lp-blog-grid">

          {/* Featured */}
          {featured && (
            <div
              className="lp-featured-card"
              onClick={() => navigate(`/blog/${featured.slug}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`lp-featured-img lp-img-${featured.tagColor}`}>
                <span className="lp-featured-tag">{featured.tag}</span>
              </div>
              <div className="lp-featured-body">
                <h2 className="lp-featured-title">{featured.title}</h2>
                <p className="lp-featured-excerpt">{featured.excerpt}</p>
                <div className="lp-article-meta">
                  <span>📅 {formatDate(featured.date)}</span>
                  <span>·</span>
                  <span>⏱ {featured.readTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Side articles */}
          <div className="lp-side-articles">
            {rest.map(post => (
              <div
                key={post.slug}
                className="lp-mini-card"
                onClick={() => navigate(`/blog/${post.slug}`)}
                style={{ cursor: 'pointer' }}
              >
                <span className={`lp-mini-dot lp-dot-${post.tagColor}`}>{post.tag[0]}</span>
                <div>
                  <p className="lp-mini-title">{post.title}</p>
                  <p className="lp-mini-meta">{formatDate(post.date)} · {post.readTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2 className="lp-cta-title">¿Listo para tomar control de tus finanzas?</h2>
        <p className="lp-cta-sub">Usa las herramientas gratuitas para entender tu situación financiera hoy.</p>
        <button className="lp-btn-primary" onClick={() => navigate('/herramientas')}>
          Comenzar ahora →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-logo">💸 Finanzas Personales</span>
          <div className="lp-footer-links">
            <button onClick={() => navigate('/herramientas')}>Herramientas</button>
            <button onClick={() => navigate('/blog')}>Blog</button>
          </div>
          <span className="lp-footer-copy">© {new Date().getFullYear()}</span>
        </div>
      </footer>

    </div>
  );
}
