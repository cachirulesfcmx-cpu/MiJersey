'use client';

export function ViewToggle({
  view,
  onChange,
}: {
  view: 'grid' | 'list';
  onChange: (view: 'grid' | 'list') => void;
}) {
  return (
    <div className="flex gap-1 rounded-full border border-neutral-200 p-1">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          view === 'grid' ? 'bg-arena-950 text-white' : 'hover:text-arena-900 text-neutral-500'
        }`}
      >
        Cuadrícula
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          view === 'list' ? 'bg-arena-950 text-white' : 'hover:text-arena-900 text-neutral-500'
        }`}
      >
        Lista
      </button>
    </div>
  );
}
