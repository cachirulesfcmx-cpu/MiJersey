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
    <ol className="flex items-center gap-1 text-sm sm:gap-2">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-1 sm:gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ${
                isActive
                  ? 'from-pop-500 to-pop-400 shadow-pop-600/30 bg-gradient-to-br text-white shadow-md'
                  : isDone
                    ? 'bg-pop-500/15 text-pop-600'
                    : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`hidden truncate sm:inline ${isActive ? 'text-arena-950 font-semibold' : 'text-neutral-500'}`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span
                className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  isDone ? 'bg-pop-500/40' : 'bg-neutral-200'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
