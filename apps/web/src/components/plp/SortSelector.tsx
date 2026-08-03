'use client';

type SortBy = 'name' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface SortOption {
  value: string;
  label: string;
  sortBy: SortBy;
  sortDir: SortDir;
}

const OPTIONS: SortOption[] = [
  { value: 'name-asc', label: 'Nombre (A-Z)', sortBy: 'name', sortDir: 'asc' },
  { value: 'name-desc', label: 'Nombre (Z-A)', sortBy: 'name', sortDir: 'desc' },
  { value: 'createdAt-desc', label: 'Más recientes', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'createdAt-asc', label: 'Más antiguos', sortBy: 'createdAt', sortDir: 'asc' },
];

export function SortSelector({
  sortBy,
  sortDir,
  onChange,
}: {
  sortBy: SortBy;
  sortDir: SortDir;
  onChange: (sortBy: SortBy, sortDir: SortDir) => void;
}) {
  const value = `${sortBy}-${sortDir}`;

  return (
    <select
      value={value}
      onChange={(event) => {
        const option = OPTIONS.find((o) => o.value === event.target.value);
        if (option) onChange(option.sortBy, option.sortDir);
      }}
      className="input-arena w-auto py-2 text-sm"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
