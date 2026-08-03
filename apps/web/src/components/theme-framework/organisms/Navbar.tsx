'use client';

import { useEffect, useState } from 'react';

const NAV_LINKS = ['Producto', 'Soluciones', 'Precios', 'Recursos'];

const MEGA_COLUMNS = [
  { title: 'Plataforma', items: ['Panel general', 'Automatizaciones', 'Integraciones', 'API'] },
  { title: 'Casos de uso', items: ['Equipos de producto', 'Operaciones', 'Finanzas', 'Soporte'] },
  { title: 'Recursos', items: ['Guías', 'Comunidad', 'Changelog', 'Estado del servicio'] },
  { title: 'Compañía', items: ['Nosotros', 'Empleo', 'Prensa', 'Contacto'] },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="tf-navbar" data-scrolled={scrolled} style={{ position: 'relative' }}>
      <div
        className="tf-container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span className="tf-h3" style={{ fontSize: '1.25rem' }}>
          Continuum
        </span>
        <div className="tf-navbar-links" style={{ gap: 'var(--tf-space-8)' }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              className="tf-navlink"
              href="#"
              onMouseEnter={() => setMegaOpen(link === 'Soluciones')}
              onMouseLeave={() => setMegaOpen(false)}
            >
              {link}
            </a>
          ))}
        </div>
        <button type="button" className="tf-btn tf-btn-primary tf-btn-sm">
          Empezar
        </button>
      </div>

      <div
        className="tf-mega"
        data-open={megaOpen}
        onMouseEnter={() => setMegaOpen(true)}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="tf-container tf-mega-columns">
          {MEGA_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="tf-caption" style={{ marginBottom: 'var(--tf-space-3)' }}>
                {column.title}
              </p>
              <ul className="tf-footer-links">
                {column.items.map((item) => (
                  <li key={item}>
                    <a href="#">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
