import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { offersApi } from '../services/api'
import type { Offer } from '../types'

const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    alt: 'Compiladores con Juan Simancas',
    label: 'Monitoria destacada',
    title: 'Compiladores con Juan Simancas',
    time: 'Hoy — 7:00 PM',
  },
  {
    src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    alt: 'Estructuras de Datos con Jossy Rojas',
    label: 'Monitoria destacada',
    title: 'Estructuras de Datos con Jossy Rojas',
    time: 'Mañana — 5:00 PM',
  },
  {
    src: 'https://images.unsplash.com/photo-1555421689-3f034debb7a6?auto=format&fit=crop&w=900&q=80',
    alt: 'Bases de Datos con Moises Davila',
    label: 'Monitoria destacada',
    title: 'Bases de Datos con Moises Davila',
    time: 'Viernes — 6:30 PM',
  },
]

function StarRating({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value} de 5 estrellas`}>
      {[1,2,3,4,5].map(i => (
        <span key={i}>{i <= Math.round(value) ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

function formatPrice(tarifa: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(tarifa)
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function Home() {
  const [offers, setOffers] = useState<Offer[]>([])

  useEffect(() => {
    offersApi.list().then(r => setOffers(r.offers.slice(0, 6))).catch(() => {})
  }, [])

  return (
    <>
      {/* ──── Hero ────────────────────────────────────────────── */}
      <section className="hero container animate-fadeup">
        <div className="hero-content">
          <span className="hero-badge">
            🎓 Comunidad académica Unimagdalena
          </span>

          <h1 className="hero-title">
            Tutorías que <mark>impulsan</mark> tu carrera universitaria
          </h1>

          <p className="hero-desc">
            Conecta con monitores certificados, agenda sesiones en minutos y
            lleva control de tu progreso académico desde un solo lugar.
          </p>

          <div className="hero-cta">
            <Link to="/schedule">
              <button className="btn btn-primary btn-lg" id="hero-cta-search">
                🔍 Buscar tutor
              </button>
            </Link>
            <Link to="/register">
              <button className="btn btn-outline btn-lg" id="hero-cta-register">
                Crear cuenta gratis
              </button>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="value">+90</div>
              <div className="label">Tutores activos</div>
            </div>
            <div className="hero-stat">
              <div className="value">92%</div>
              <div className="label">Éxito académico</div>
            </div>
            <div className="hero-stat">
              <div className="value">&lt;2h</div>
              <div className="label">Respuesta promedio</div>
            </div>
          </div>
        </div>

        {/* carousel */}
        <div className="hero-carousel" aria-label="Monitorías destacadas">
          {HERO_IMAGES.map((slide, i) => (
            <div key={i} className="carousel-slide">
              <img src={slide.src} alt={slide.alt} />
              <div className="carousel-caption">
                <p>{slide.label}</p>
                <h3>{slide.title}</h3>
                <span>{slide.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──── Marketplace ─────────────────────────────────────── */}
      <section className="section container animate-fadeup delay-1" id="marketplace">
        <div className="section-header">
          <div>
            <h2 className="section-title">Marketplace de tutores</h2>
            <p className="section-sub">Explora las ofertas disponibles en tu programa</p>
          </div>
          <Link to="/schedule">
            <button className="btn btn-outline btn-sm" id="marketplace-see-all">Ver todos →</button>
          </Link>
        </div>

        {offers.length === 0 ? (
          <div className="grid-auto">
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ minHeight: 280 }}>
                <div style={{ height: 180, background: 'var(--color-primary-light)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-auto">
            {offers.map(offer => (
              <article key={offer.id} className="tutor-card">
                <div
                  className="tutor-card-img"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    background: `hsl(${(offer.id * 47) % 360},40%,88%)`,
                    color: `hsl(${(offer.id * 47) % 360},60%,35%)`,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '2rem',
                  }}
                >
                  {offer.tutor ? getInitials(offer.tutor.nombre) : '?'}
                </div>
                <div className="tutor-card-body">
                  <p className="tutor-card-name">{offer.tutor?.nombre ?? 'Tutor'}</p>
                  <p className="tutor-card-prog">{offer.tutor?.programa ?? ''}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    <span className="badge badge-primary">{offer.materia}</span>
                    {offer.nivel && <span className="badge badge-neutral">{offer.nivel}</span>}
                    <span className="badge badge-neutral">{offer.modalidad}</span>
                  </div>
                  {(offer.tutor?.calificacion_promedio ?? 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <StarRating value={offer.tutor!.calificacion_promedio} />
                      <span className="text-sm text-muted">({offer.tutor!.total_sesiones} sesiones)</span>
                    </div>
                  )}
                  <div className="tutor-card-row">
                    <span className="tutor-card-price">{formatPrice(offer.tarifa)}/h</span>
                    <Link to={`/schedule?offer=${offer.id}`}>
                      <button className="btn btn-outline btn-sm" id={`offer-book-${offer.id}`}>
                        Reservar
                      </button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ──── Cómo funciona ───────────────────────────────────── */}
      <section className="section container animate-fadeup delay-2" id="como-funciona">
        <div style={{ marginBottom: 24 }}>
          <h2 className="section-title">¿Cómo funciona Monitor-HUB?</h2>
          <p className="section-sub">Tres pasos para acceder al apoyo académico que necesitas</p>
        </div>

        <div className="steps">
          {[
            { n: '01', title: 'Busca tu tutor', desc: 'Filtra por materia, modalidad y disponibilidad para encontrar al monitor ideal.' },
            { n: '02', title: 'Agenda tu sesión', desc: 'Selecciona fecha, hora y modalidad. La confirmación llega en minutos.' },
            { n: '03', title: 'Aprende y avanza', desc: 'Asiste a tu tutoría, califica al monitor y registra tu progreso.' },
          ].map(step => (
            <article key={step.n} className="step-card">
              <div className="step-number">{step.n}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ──── CTA final ───────────────────────────────────────── */}
      <section className="section container animate-fadeup delay-3">
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, hsl(173,72%,40%) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 40px',
          textAlign: 'center',
          color: 'white',
          boxShadow: 'var(--shadow-xl)',
        }}>
          <h2 style={{ color: 'white', marginBottom: 10 }}>¿Listo para mejorar tus notas?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28, fontSize: '1.05rem' }}>
            Únete a la comunidad Monitor-HUB y accede a cientos de tutorías especializadas.
          </p>
          <Link to="/register">
            <button
              className="btn btn-lg"
              id="cta-register-btn"
              style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 700 }}
            >
              Comenzar gratis →
            </button>
          </Link>
        </div>
      </section>
    </>
  )
}
