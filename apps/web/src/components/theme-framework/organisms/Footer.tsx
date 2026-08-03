const COLUMNS = [
  { title: 'Producto', links: ['Funciones', 'Precios', 'Novedades', 'Seguridad'] },
  { title: 'Compañía', links: ['Nosotros', 'Empleo', 'Blog', 'Contacto'] },
  { title: 'Recursos', links: ['Documentación', 'Guías', 'Comunidad', 'Soporte'] },
];

export function Footer() {
  return (
    <footer className="tf-footer">
      <div className="tf-container tf-footer-grid">
        <div>
          <span className="tf-h3" style={{ fontSize: '1.25rem' }}>
            Continuum
          </span>
          <p
            className="tf-small"
            style={{
              color: 'var(--tf-text-muted)',
              marginTop: 'var(--tf-space-3)',
              maxWidth: '32ch',
            }}
          >
            Un sistema de diseño minimalista y modular, pensado para adaptarse a cualquier marca sin
            tocar una línea de código.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="tf-footer-col-title tf-small">{column.title}</p>
            <ul className="tf-footer-links">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="tf-container" style={{ marginTop: 'var(--tf-space-16)' }}>
        <p className="tf-caption" style={{ color: 'var(--tf-text-faint)' }}>
          © {new Date().getFullYear()} Continuum. Framework de diseño de demostración.
        </p>
      </div>
    </footer>
  );
}
