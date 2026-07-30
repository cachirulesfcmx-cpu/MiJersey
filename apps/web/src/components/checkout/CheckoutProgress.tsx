export type CheckoutStep = 'address' | 'shipping' | 'review' | 'confirmed';

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'address', label: 'Dirección' },
  { key: 'shipping', label: 'Envío' },
  { key: 'review', label: 'Revisión' },
  { key: 'confirmed', label: 'Confirmación' },
];

export function CheckoutProgress({ current }: { current: CheckoutStep }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : isDone
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {index + 1}
            </span>
            <span className={isActive ? 'font-medium text-neutral-900' : 'text-neutral-500'}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && <span className="mx-1 text-neutral-300">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
