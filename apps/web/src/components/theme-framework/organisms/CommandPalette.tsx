'use client';

import { useEffect, useMemo, useState } from 'react';

export interface CommandEntry {
  id: string;
  label: string;
  hint?: string;
}

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: CommandEntry[];
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(
    () => commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase())),
    [commands, query],
  );

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown')
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
      if (event.key === 'ArrowUp') setActiveIndex((index) => Math.max(index - 1, 0));
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, filtered.length]);

  return (
    <>
      <div className="tf-overlay" data-open={open} onClick={onClose} aria-hidden="true" />
      <div className="tf-command" data-open={open} role="dialog" aria-label="Paleta de comandos">
        <input
          className="tf-command-input"
          placeholder="Escribe un comando o busca…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
        <div className="tf-command-list">
          {filtered.map((command, index) => (
            <div key={command.id} className="tf-command-item" data-active={index === activeIndex}>
              <span className="tf-small">{command.label}</span>
              {command.hint && <span className="tf-caption">{command.hint}</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
