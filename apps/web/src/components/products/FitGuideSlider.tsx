'use client';

import { useState } from 'react';

const STEPS = [
  { label: 'Suelto', hint: 'Pedir una talla menos para ajuste normal' },
  { label: 'Normal', hint: 'Pedir talla normal' },
  { label: 'Ajustado', hint: 'Pedir una talla más para ajuste normal' },
] as const;

/**
 * Guía de talla genérica (no depende de datos por producto que no tenemos, como medidas reales
 * de cada jersey) -- consejo informativo estándar para quien no sabe si el corte de jersey de
 * fútbol suele ser más entallado que la ropa casual. Puramente orientativo, no es una promesa de
 * ajuste exacto.
 */
export function FitGuideSlider() {
  const [step, setStep] = useState(1);
  const active = STEPS[step] ?? STEPS[1];

  return (
    <div className="flex flex-col gap-2">
      <span className="label-arena">¿Cómo prefieres que te quede?</span>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        className="w-full accent-[var(--tf-accent)]"
        aria-label="Preferencia de ajuste"
      />
      <div className="flex justify-between text-xs text-neutral-400">
        {STEPS.map((s, i) => (
          <span key={s.label} className={i === step ? 'font-semibold text-neutral-900' : undefined}>
            {s.label}
          </span>
        ))}
      </div>
      <p className="text-xs text-neutral-500">{active.hint}</p>
    </div>
  );
}
