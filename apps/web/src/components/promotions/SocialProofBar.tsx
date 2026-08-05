'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Barra de urgencia social simulada, estilo bartjerseys.com ("32 personas viendo ahora",
 * "Fulano de [ciudad] acaba de agregar N jerseys"). A diferencia del resto del sitio (que solo
 * muestra datos reales -- promociones, reseñas, descuentos por volumen), esto SÍ es simulado a
 * propósito: aprobado explícitamente por el cliente para igualar 1:1 el comportamiento de
 * Bartjerseys. Los nombres de producto que cita sí son reales (vienen de `productNames`, los
 * productos que ya están renderizados en la página); solo la ciudad, el nombre de la persona y el
 * momento de la "compra" son inventados -- nunca se le atribuyen a un comprador real.
 */

const CITIES = [
  'CDMX',
  'Guadalajara',
  'Monterrey',
  'Puebla',
  'Querétaro',
  'Tijuana',
  'León',
  'Mérida',
  'Toluca',
  'Cancún',
];

const FIRST_NAMES = [
  'Carlos',
  'Ana',
  'Luis',
  'María',
  'Jorge',
  'Sofía',
  'Diego',
  'Valeria',
  'Miguel',
  'Fernanda',
  'Ulises',
  'Paola',
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick<T>(items: T[], seed: number): T {
  const index = Math.floor(pseudoRandom(seed) * items.length) % items.length;
  return items[index] as T;
}

/** Contador de "personas viendo ahora" -- estable dentro del mismo minuto (no salta en cada render), varía lento entre 8 y 40 para que se sienta orgánico sin parpadear. */
export function ViewersBadge() {
  const [minuteBucket, setMinuteBucket] = useState(() => Math.floor(Date.now() / 60000));

  useEffect(() => {
    const interval = setInterval(() => setMinuteBucket(Math.floor(Date.now() / 60000)), 15000);
    return () => clearInterval(interval);
  }, []);

  const count = 8 + Math.floor(pseudoRandom(minuteBucket) * 33);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      👀 {count} personas viendo ahora
    </span>
  );
}

/** Notificación rotativa "Fulano de [ciudad] compró [producto]" -- flotante, esquina inferior izquierda, se oculta y reaparece cada ~9s con otro nombre/ciudad/producto. */
export function RecentPurchaseToast({ productNames }: { productNames: string[] }) {
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (productNames.length === 0) return;
    const showTimer = setTimeout(() => setVisible(true), 2500);
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTick((t) => t + 1);
        setVisible(true);
      }, 400);
    }, 9000);
    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [productNames.length]);

  const message = useMemo(() => {
    if (productNames.length === 0) return null;
    const seed = tick * 7 + 1;
    const name = pick(FIRST_NAMES, seed);
    const city = pick(CITIES, seed + 1);
    const product = pick(productNames, seed + 2);
    const minutesAgo = 1 + Math.floor(pseudoRandom(seed + 3) * 14);
    return { name, city, product, minutesAgo };
  }, [tick, productNames]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-30 max-w-xs rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-neutral-200 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <p className="text-sm text-neutral-800">
        🛒 <span className="font-semibold">{message.name}</span> de {message.city} compró{' '}
        <span className="font-semibold">{message.product}</span>
      </p>
      <p className="tf-caption mt-0.5 text-neutral-400">Hace {message.minutesAgo} min</p>
    </div>
  );
}
