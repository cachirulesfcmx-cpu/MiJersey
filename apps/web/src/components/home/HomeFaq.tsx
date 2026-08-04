'use client';

import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Preguntas frecuentes reales de la tienda -- envío, pagos, cambios y seguridad. Nada aquí
 * inventa plazos ni promesas que la plataforma no pueda cumplir (p.ej. no se afirman rangos
 * de días de envío específicos: el checkout calcula el costo/tiempo real por zona vía el
 * módulo de shipping). Mismo criterio "solo datos reales" del resto del rediseño.
 */
const FAQS: FaqItem[] = [
  {
    question: '¿Cuánto cuesta el envío?',
    answer:
      'El costo y tiempo estimado de envío se calculan en el checkout según tu dirección y la zona de envío correspondiente, antes de confirmar tu compra.',
  },
  {
    question: '¿Puedo rastrear mi pedido?',
    answer:
      'Sí. Una vez que tu pedido se envía, puedes darle seguimiento desde "Mis pedidos" en tu cuenta o desde la página de rastreo con tu número de orden.',
  },
  {
    question: '¿Cómo pago mi pedido?',
    answer: 'Verás los métodos de pago disponibles al finalizar tu compra en el checkout.',
  },
  {
    question: '¿Puedo cambiar o devolver mi jersey?',
    answer:
      'Sí, contamos con un proceso de soporte para cambios y devoluciones. Puedes iniciarlo desde tu cuenta en la sección de soporte/pedidos, o contactándonos directamente.',
  },
  {
    question: '¿Es seguro comprar en MiJersey?',
    answer:
      'Tu compra se procesa a través de un checkout con conexión cifrada. No compartimos tus datos de pago con terceros fuera del procesamiento de tu pedido.',
  },
];

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tf-accordion-item" data-open={open}>
      <button
        type="button"
        className="tf-accordion-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <svg
          className="tf-accordion-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
      <div className="tf-accordion-panel">
        <div className="tf-accordion-panel-inner">
          <p className="tf-accordion-panel-content">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export function HomeFaq() {
  return (
    <section className="tf-section py-10 sm:py-14">
      <div className="tf-container max-w-3xl">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-neutral-500">Resuelve tus dudas antes de comprar.</p>
        </div>
        <div>
          {FAQS.map((item) => (
            <FaqAccordionItem key={item.question} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
