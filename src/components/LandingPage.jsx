import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const ARTICLES = [
  {
    slug: "que-es-el-cae",
    tag: "Créditos",
    tagColor: "blue",
    title: "¿Qué es el CAE y por qué es lo único que deberías comparar al pedir un crédito?",
    excerpt: "El CAE incluye tasa, seguros y comisiones en un solo número. Te explicamos cómo usarlo para no pagar de más.",
    date: "12 jul 2026",
    readTime: "4 min",
    featured: true,
  },
  {
    slug: "avalancha-vs-bola-de-nieve",
    tag: "Tarjetas",
    tagColor: "green",
    title: "Avalancha vs bola de nieve: cuál te conviene para pagar tarjetas",
    excerpt: "Dos estrategias probadas para eliminar deudas. Te mostramos cuál ahorra más dinero y cuál genera más motivación.",
    date: "8 jul 2026",
    readTime: "3 min",
    featured: false,
  },
  {
    slug: "como-calcular-carga-financiera",
    tag: "Finanzas",
    tagColor: "amber",
    title: "Cómo calcular tu carga financiera y saber si puedes endeudarte",
    excerpt: "Antes de pedir cualquier crédito, necesitas saber cuánto de tu sueldo ya está comprometido.",
    date: "3 jul 2026",
    readTime: "5 min",
    featured: false,
  },
  {
    slug: "tramos-deuda-chile",
    tag: "Chile",
    tagColor: "blue",
    title: "Tramos de deuda en Chile: cuánto puedes comprometer de tu sueldo",
    excerpt: "Los bancos chilenos usan rangos específicos para evaluar si eres sujeto de crédito. Conócelos.",
    date: "28 jun 2026",
    readTime: "4 min",
    featured: false,
  },
];

const TOOLS = [
  {
    path: "/",
    icon: "📊",
    color: "blue",
    name: "Carga Financiera",
    desc: "Calcula tu capacidad de endeudamiento y ahorro mensual.",
  },
  {
    path: "/credito",
    icon: "🏦",
    color: "green",
    name: "Crédito de Consumo",
    desc: "Compara tasas, CAE y simula cuotas entre dos bancos.",
  },
  {
    path: "/tarjetas",
    icon: "💳",
    color: "amber",
    name: "Plan de Tarjetas",
    desc: "Avalancha o bola de nieve para eliminar tus deudas.",
  },
  {
    path: "/inversiones",
    icon: "📈",
    color: "purple",
    name: "Simulador de Inversión",
    desc: "Proyecta el crecimiento de tu dinero con interés compuesto.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const featured = ARTICLES.find(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured);

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
          <button className="lp-btn-primary" onClick={() => navigate('/')}>
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
        </div>
        <div className="lp-blog-grid">

          {/* Featured */}
          {featured && (
            <div className="lp-featured-card">
              <div className={`lp-featured-img lp-img-${featured.tagColor}`}>
                <span className="lp-featured-tag">{featured.tag}</span>
              </div>
              <div className="lp-featured-body">
                <h2 className="lp-featured-title">{featured.title}</h2>
                <p className="lp-featured-excerpt">{featured.excerpt}</p>
                <div className="lp-article-meta">
                  <span>📅 {featured.date}</span>
                  <span>·</span>
                  <span>⏱ {featured.readTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Side articles */}
          <div className="lp-side-articles">
            {rest.map(a => (
              <div key={a.slug} className="lp-mini-card">
                <span className={`lp-mini-dot lp-dot-${a.tagColor}`}>{a.tag[0]}</span>
                <div>
                  <p className="lp-mini-title">{a.title}</p>
                  <p className="lp-mini-meta">{a.date} · {a.readTime}</p>
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
        <button className="lp-btn-primary" onClick={() => navigate('/')}>
          Comenzar ahora →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-logo">💸 Finanzas Personales</span>
          <div className="lp-footer-links">
            <button onClick={() => navigate('/')}>Herramientas</button>
            <button onClick={() => document.getElementById('blog').scrollIntoView({ behavior: 'smooth' })}>Blog</button>
          </div>
          <span className="lp-footer-copy">© {new Date().getFullYear()}</span>
        </div>
      </footer>

    </div>
  );
}
