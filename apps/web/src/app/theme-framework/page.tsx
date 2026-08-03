'use client';

import { useState } from 'react';

import { MagneticButton } from '../../components/theme-framework/motion/MagneticButton';
import { TfReveal, TfStagger } from '../../components/theme-framework/motion/TfReveal';
import { Accordion } from '../../components/theme-framework/organisms/Accordion';
import { CommandPalette } from '../../components/theme-framework/organisms/CommandPalette';
import { Drawer } from '../../components/theme-framework/organisms/Drawer';
import { Dropdown } from '../../components/theme-framework/organisms/Dropdown';
import { Footer } from '../../components/theme-framework/organisms/Footer';
import { Modal } from '../../components/theme-framework/organisms/Modal';
import { Navbar } from '../../components/theme-framework/organisms/Navbar';
import { Tabs } from '../../components/theme-framework/organisms/Tabs';
import { ToastProvider, useToast } from '../../components/theme-framework/organisms/ToastProvider';
import { Tooltip } from '../../components/theme-framework/organisms/Tooltip';

const COLOR_SWATCHES = [
  { label: 'Fondo', varName: '--tf-bg' },
  { label: 'Superficie', varName: '--tf-surface' },
  { label: 'Borde', varName: '--tf-border' },
  { label: 'Texto', varName: '--tf-text' },
  { label: 'Texto muted', varName: '--tf-text-muted' },
  { label: 'Acento', varName: '--tf-accent' },
];

const TYPE_SCALE = [
  { label: 'Display', className: 'tf-display', sample: 'Diseño sin límites' },
  { label: 'H1', className: 'tf-h1', sample: 'Construye con claridad' },
  { label: 'H2', className: 'tf-h2', sample: 'Cada detalle cuenta' },
  { label: 'H3', className: 'tf-h3', sample: 'Jerarquía sin esfuerzo' },
  {
    label: 'Body XL',
    className: 'tf-body-xl',
    sample: 'Un sistema pensado para escalar con cualquier marca.',
  },
  {
    label: 'Body',
    className: 'tf-body',
    sample: 'Texto de cuerpo estándar, legible y balanceado.',
  },
  { label: 'Small', className: 'tf-small', sample: 'Texto secundario o de apoyo.' },
  { label: 'Caption', className: 'tf-caption', sample: 'Etiqueta o metadato' },
];

const FEATURE_CARDS = [
  {
    title: 'Tokens configurables',
    body: 'Cada color, espacio y radio vive en una variable CSS. Cambiar de marca es cuestión de redefinir valores, no de tocar componentes.',
  },
  {
    title: 'Motion consistente',
    body: 'Duraciones y curvas de aceleración comparten una sola personalidad: elegante, medida, nunca exagerada.',
  },
  {
    title: 'Modo oscuro real',
    body: 'Los mismos componentes, los mismos nombres de clase — solo cambian los roles semánticos detrás de escena.',
  },
];

const FAQ_ITEMS = [
  {
    id: 'q1',
    question: '¿Puedo usar esto en cualquier vertical?',
    answer:
      'Sí. El sistema separa tokens (color, tipografía, espaciado) de los componentes, así que adaptar la marca es cuestión de redefinir variables CSS.',
  },
  {
    id: 'q2',
    question: '¿Necesito Tailwind para usarlo?',
    answer:
      'No. Todo está escrito en CSS plano con custom properties, por lo que es compatible con cualquier stack de frontend.',
  },
  {
    id: 'q3',
    question: '¿Cómo funciona el modo oscuro?',
    answer:
      'Un atributo `data-theme` en el contenedor raíz remapea los roles semánticos (fondo, texto, bordes) sin duplicar componentes.',
  },
  {
    id: 'q4',
    question: '¿Incluye accesibilidad?',
    answer:
      'Los componentes interactivos usan roles ARIA, manejo de foco visible y respetan `prefers-reduced-motion`.',
  },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '$0',
    features: ['Tokens base', 'Componentes esenciales', 'Modo claro/oscuro'],
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    features: ['Todo en Starter', 'Motion system completo', 'Componentes avanzados'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Todo en Pro', 'Soporte dedicado', 'Tokens por marca múltiple'],
    featured: false,
  },
];

const TESTIMONIALS = [
  {
    quote: 'Cambiamos de vertical tres veces sin tocar un solo componente.',
    author: 'Equipo de Producto',
  },
  {
    quote: 'El sistema de motion se siente coherente en cada pantalla.',
    author: 'Diseño de Interacción',
  },
];

const TIMELINE_STEPS = [
  {
    title: 'Definición de tokens',
    body: 'Color, tipografía y espaciado quedan fijados como variables.',
  },
  {
    title: 'Construcción de átomos',
    body: 'Botones, inputs y badges consumen únicamente esos tokens.',
  },
  {
    title: 'Composición de organismos',
    body: 'Navbar, tarjetas y overlays se ensamblan a partir de los átomos.',
  },
  { title: 'Aplicación de marca', body: 'Solo queda ajustar valores — la estructura no cambia.' },
];

const COMMANDS = [
  { id: 'c1', label: 'Ir a Componentes', hint: 'G C' },
  { id: 'c2', label: 'Ir a Tokens', hint: 'G T' },
  { id: 'c3', label: 'Cambiar tema', hint: '⌘ D' },
  { id: 'c4', label: 'Buscar en documentación', hint: '⌘ K' },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <TfReveal className="tf-container" delayMs={0}>
      <p
        className="tf-caption"
        style={{ color: 'var(--tf-accent-strong)', marginBottom: 'var(--tf-space-3)' }}
      >
        {eyebrow}
      </p>
      <h2 className="tf-h2" style={{ maxWidth: '20ch' }}>
        {title}
      </h2>
      {description && (
        <p className="tf-body-xl" style={{ marginTop: 'var(--tf-space-4)', maxWidth: '60ch' }}>
          {description}
        </p>
      )}
    </TfReveal>
  );
}

function ToastDemoButton() {
  const pushToast = useToast();
  return (
    <button
      type="button"
      className="tf-btn tf-btn-outline"
      onClick={() => pushToast('Cambios guardados correctamente.')}
    >
      Mostrar toast
    </button>
  );
}

function ThemeFrameworkContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <Navbar />

      {/* HERO */}
      <header className="tf-hero tf-container">
        <span className="tf-badge">Sistema de diseño</span>
        <TfReveal variant="blur">
          <h1 className="tf-display" style={{ maxWidth: '18ch', margin: '0 auto' }}>
            Continuum
          </h1>
        </TfReveal>
        <TfReveal delayMs={120}>
          <p className="tf-body-xl" style={{ maxWidth: '48ch', margin: '0 auto' }}>
            Un framework de theming minimalista y premium, construido con tokens configurables —
            para que cambiar de marca sea cuestión de variables, no de código.
          </p>
        </TfReveal>
        <div className="tf-hero-actions">
          <MagneticButton onClick={() => setModalOpen(true)}>Ver componente modal</MagneticButton>
          <button
            type="button"
            className="tf-btn tf-btn-outline"
            onClick={() => setCommandOpen(true)}
          >
            Abrir paleta ⌘K
          </button>
        </div>
      </header>

      {/* BREADCRUMBS */}
      <div className="tf-container">
        <nav className="tf-breadcrumbs" aria-label="breadcrumbs">
          <a href="#">Inicio</a>
          <span aria-hidden="true">/</span>
          <a href="#">Sistema de diseño</a>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--tf-text)' }}>Showcase</span>
        </nav>
      </div>

      {/* COLOR TOKENS */}
      <section className="tf-section">
        <SectionHeading
          eyebrow="Tokens"
          title="Color con roles semánticos"
          description="Los componentes nunca leen la escala de color directamente — consumen roles (fondo, texto, borde, acento) que cambian juntos con el tema."
        />
        <div className="tf-container" style={{ marginTop: 'var(--tf-space-10)' }}>
          <div className="tf-grid">
            {COLOR_SWATCHES.map((swatch) => (
              <div key={swatch.varName} style={{ gridColumn: 'span 2' }}>
                <div
                  className="tf-card"
                  style={{
                    height: 96,
                    background: `var(${swatch.varName})`,
                    padding: 0,
                    marginBottom: 'var(--tf-space-2)',
                  }}
                />
                <p className="tf-small">{swatch.label}</p>
                <p
                  className="tf-caption"
                  style={{ fontFamily: 'var(--tf-font-mono)', textTransform: 'none' }}
                >
                  {swatch.varName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TYPE SCALE */}
      <section className="tf-section" style={{ background: 'var(--tf-bg-subtle)' }}>
        <SectionHeading
          eyebrow="Tipografía"
          title="Una escala completa, siempre responsiva"
          description="Cada nivel usa clamp() para escalar suavemente entre móvil y escritorio, sin saltos ni media queries manuales."
        />
        <div
          className="tf-container"
          style={{
            marginTop: 'var(--tf-space-10)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--tf-space-6)',
          }}
        >
          {TYPE_SCALE.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--tf-space-6)',
                borderBottom: '1px solid var(--tf-border)',
                paddingBottom: 'var(--tf-space-6)',
              }}
            >
              <span className="tf-caption" style={{ width: 90, flexShrink: 0 }}>
                {item.label}
              </span>
              <p className={item.className} style={{ margin: 0 }}>
                {item.sample}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BUTTONS */}
      <section className="tf-section">
        <SectionHeading eyebrow="Átomos" title="Botones para cada intención" />
        <div
          className="tf-container"
          style={{
            marginTop: 'var(--tf-space-10)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--tf-space-4)',
          }}
        >
          <button className="tf-btn tf-btn-primary">Primario</button>
          <button className="tf-btn tf-btn-secondary">Secundario</button>
          <button className="tf-btn tf-btn-outline">Outline</button>
          <button className="tf-btn tf-btn-ghost">Ghost</button>
          <button className="tf-btn tf-btn-icon" aria-label="Icono">
            ★
          </button>
          <button className="tf-btn tf-btn-primary tf-btn-loading">Cargando</button>
          <button className="tf-btn tf-btn-primary" disabled>
            Deshabilitado
          </button>
          <Tooltip label="Esto es un tooltip">
            <button className="tf-btn tf-btn-outline">Hover para tooltip</button>
          </Tooltip>
          <Dropdown
            label="Elegir opción"
            options={[
              { id: '1', label: 'Opción A' },
              { id: '2', label: 'Opción B' },
              { id: '3', label: 'Opción C' },
            ]}
          />
        </div>
      </section>

      {/* CARDS */}
      <section className="tf-section" style={{ background: 'var(--tf-bg-subtle)' }}>
        <SectionHeading
          eyebrow="Moléculas"
          title="Tarjetas modulares"
          description="Feature, glass y stat comparten la misma base — solo cambia el contenido y el énfasis visual."
        />
        <div className="tf-container" style={{ marginTop: 'var(--tf-space-10)' }}>
          <TfStagger className="tf-grid" variant="up">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="tf-card tf-card-feature tf-card-hoverable"
                style={{ gridColumn: 'span 4' }}
              >
                <div className="tf-card-feature-icon">◆</div>
                <h3 className="tf-h3" style={{ fontSize: '1.25rem' }}>
                  {card.title}
                </h3>
                <p className="tf-small" style={{ color: 'var(--tf-text-muted)' }}>
                  {card.body}
                </p>
              </div>
            ))}
          </TfStagger>

          <div className="tf-grid" style={{ marginTop: 'var(--tf-space-6)' }}>
            <div className="tf-card-glass" style={{ gridColumn: 'span 4' }}>
              <p className="tf-caption">Glass</p>
              <p className="tf-h3" style={{ fontSize: '1.5rem', marginTop: 'var(--tf-space-2)' }}>
                Superficie translúcida
              </p>
            </div>
            <div className="tf-card tf-card-stat" style={{ gridColumn: 'span 4' }}>
              <p className="tf-caption">Métrica</p>
              <p className="tf-card-stat-value">128%</p>
              <p className="tf-small" style={{ color: 'var(--tf-text-muted)' }}>
                Crecimiento interanual
              </p>
            </div>
            <div className="tf-card tf-card-team" style={{ gridColumn: 'span 4' }}>
              <div className="tf-card-team-avatar" />
              <p className="tf-small" style={{ fontWeight: 600 }}>
                Miembro del equipo
              </p>
              <p className="tf-caption">Rol / Departamento</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="tf-section">
        <div className="tf-container tf-grid">
          {TESTIMONIALS.map((testimonial) => (
            <TfReveal
              key={testimonial.author}
              className="tf-testimonial"
              style={{ gridColumn: 'span 6' } as React.CSSProperties}
            >
              <p className="tf-testimonial-quote">“{testimonial.quote}”</p>
              <div className="tf-testimonial-author">
                <div className="tf-avatar" />
                <span className="tf-small">{testimonial.author}</span>
              </div>
            </TfReveal>
          ))}
        </div>
      </section>

      {/* TABS + ACCORDION */}
      <section className="tf-section" style={{ background: 'var(--tf-bg-subtle)' }}>
        <SectionHeading eyebrow="Organismos" title="Tabs, acordeón y preguntas frecuentes" />
        <div className="tf-container" style={{ marginTop: 'var(--tf-space-10)' }}>
          <div className="tf-grid">
            <div style={{ gridColumn: 'span 6' }}>
              <Tabs
                tabs={[
                  {
                    id: 't1',
                    label: 'Resumen',
                    content: <p className="tf-body">Contenido general del panel seleccionado.</p>,
                  },
                  {
                    id: 't2',
                    label: 'Detalles',
                    content: <p className="tf-body">Información adicional y specs técnicas.</p>,
                  },
                  {
                    id: 't3',
                    label: 'Historial',
                    content: <p className="tf-body">Registro de cambios recientes.</p>,
                  },
                ]}
              />
            </div>
            <div style={{ gridColumn: 'span 6' }}>
              <Accordion items={FAQ_ITEMS} />
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="tf-section">
        <SectionHeading eyebrow="Proceso" title="De tokens a producto terminado" />
        <div className="tf-container" style={{ marginTop: 'var(--tf-space-10)', maxWidth: 640 }}>
          <div className="tf-timeline">
            {TIMELINE_STEPS.map((step) => (
              <TfReveal key={step.title} variant="left" className="tf-timeline-item">
                <p className="tf-small" style={{ fontWeight: 600 }}>
                  {step.title}
                </p>
                <p className="tf-small" style={{ color: 'var(--tf-text-muted)' }}>
                  {step.body}
                </p>
              </TfReveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="tf-section" style={{ background: 'var(--tf-bg-subtle)' }}>
        <SectionHeading eyebrow="Pricing" title="Un componente, tres niveles" />
        <div className="tf-container tf-grid" style={{ marginTop: 'var(--tf-space-10)' }}>
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`tf-card tf-pricing-card ${tier.featured ? 'tf-pricing-card--featured' : ''}`}
              style={{ gridColumn: 'span 4' }}
            >
              <div>
                <p className="tf-caption">{tier.name}</p>
                <div className="tf-pricing-price">
                  <span className="tf-pricing-price-value">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="tf-small">/mes</span>}
                </div>
              </div>
              <ul className="tf-pricing-features">
                {tier.features.map((feature) => (
                  <li key={feature}>— {feature}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`tf-btn ${tier.featured ? 'tf-btn-primary' : 'tf-btn-outline'}`}
              >
                Elegir {tier.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SKELETON */}
      <section className="tf-section">
        <SectionHeading
          eyebrow="Motion"
          title="Estados de carga y overlays"
          description="Skeleton shimmer, modal, drawer, toast y paleta de comandos comparten las mismas curvas de animación."
        />
        <div
          className="tf-container"
          style={{
            marginTop: 'var(--tf-space-10)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--tf-space-4)',
            alignItems: 'center',
          }}
        >
          <div className="tf-skeleton" style={{ width: 220, height: 24 }} />
          <div className="tf-skeleton" style={{ width: 140, height: 24 }} />
          <div className="tf-skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
          <button
            type="button"
            className="tf-btn tf-btn-outline"
            onClick={() => setModalOpen(true)}
          >
            Abrir modal
          </button>
          <button
            type="button"
            className="tf-btn tf-btn-outline"
            onClick={() => setDrawerOpen(true)}
          >
            Abrir drawer
          </button>
          <ToastDemoButton />
        </div>
      </section>

      <section className="tf-section">
        <TfReveal variant="scale" className="tf-container">
          <div className="tf-cta">
            <h2 className="tf-h2">Listo para adaptarse a tu marca</h2>
            <p className="tf-body-xl" style={{ maxWidth: '48ch' }}>
              Cambia los tokens, conserva la estructura. Continuum está pensado para escalar sin
              reescribir componentes.
            </p>
            <button type="button" className="tf-btn tf-btn-primary tf-btn-lg">
              Explorar documentación
            </button>
          </div>
        </TfReveal>
      </section>

      <Footer />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal de ejemplo">
        <p className="tf-body" style={{ color: 'var(--tf-text-muted)' }}>
          Este es un modal genérico del sistema, con overlay, foco atrapado por Escape y animación
          de escala.
        </p>
        <div style={{ display: 'flex', gap: 'var(--tf-space-3)', marginTop: 'var(--tf-space-6)' }}>
          <button
            type="button"
            className="tf-btn tf-btn-primary"
            onClick={() => setModalOpen(false)}
          >
            Confirmar
          </button>
          <button type="button" className="tf-btn tf-btn-ghost" onClick={() => setModalOpen(false)}>
            Cancelar
          </button>
        </div>
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Panel lateral">
        <p className="tf-body" style={{ color: 'var(--tf-text-muted)' }}>
          Los drawers son ideales para filtros, carritos o formularios secundarios sin abandonar el
          contexto.
        </p>
      </Drawer>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        commands={COMMANDS}
      />
    </>
  );
}

export default function ThemeFrameworkPage() {
  return (
    <ToastProvider>
      <ThemeFrameworkContent />
    </ToastProvider>
  );
}
