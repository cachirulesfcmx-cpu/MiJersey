'use client';

export function ViewToggle({
  view,
  onChange,
}: {
  view: 'grid' | 'list';
  onChange: (view: 'grid' | 'list') => void;
}) {
  return (
    <div className="flex gap-1 rounded-md border border-neutral-200 p-1">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`rounded px-2 py-1 text-xs ${
          view === 'grid' ? 'bg-neutral-900 text-white' : 'text-neutral-500'
        }`}
      >
        Cuadrícula
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`rounded px-2 py-1 text-xs ${
          view === 'list' ? 'bg-neutral-900 text-white' : 'text-neutral-500'
        }`}
      >
        Lista
      </button>
    </div>
  );
}
