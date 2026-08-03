'use client';

import type { ApiClient, SearchResultItem } from '@mijersey/sdk';
import { useEffect, useRef, useState } from 'react';

import { addRecentSearch, clearRecentSearches, getRecentSearches } from './recent-searches';
import { getSearchSessionId } from './search-session';

const DEBOUNCE_MS = 300;
const SUGGESTIONS_LIMIT = 8;

interface SearchBoxProps {
  client: ApiClient;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

/** Search Box + Autocomplete + Recent Searches (016 §6) en un solo componente: comparten el mismo dropdown y el mismo estado de foco/blur. */
export function SearchBox({ client, value, onChange, onSubmit }: SearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      client
        .getSearchSuggestions({ q: value, limit: SUGGESTIONS_LIMIT })
        .then((result) => setSuggestions(result.items))
        .catch(() => setSuggestions([]));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [client, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function submit(term: string) {
    if (!term.trim()) return;
    addRecentSearch(term.trim());
    setRecent(getRecentSearches());
    setIsOpen(false);
    onSubmit(term.trim());
  }

  function handleSuggestionClick(item: SearchResultItem) {
    void client.logSearchClick({
      term: value,
      entityType: item.type,
      entityId: item.id,
      sessionId: getSearchSessionId(),
    });
    submit(item.name);
  }

  const showRecent = isOpen && !value.trim() && recent.length > 0;
  const showSuggestions = isOpen && value.trim().length > 0 && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
        className="flex gap-2"
      >
        <input
          className="input-arena"
          placeholder="Buscar productos…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        <button type="submit" className="btn-pop-sm shrink-0">
          Buscar
        </button>
      </form>

      {(showRecent || showSuggestions) && (
        <div className="animate-fade-in-up shadow-arena-950/10 absolute z-10 mt-2 w-full rounded-2xl border border-neutral-100 bg-white p-1 shadow-xl">
          {showRecent && (
            <div className="flex flex-col gap-1 p-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-neutral-500">Búsquedas recientes</span>
                <button
                  type="button"
                  className="text-xs text-neutral-400 hover:underline"
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  Limpiar
                </button>
              </div>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="rounded px-2 py-1 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  onClick={() => submit(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {showSuggestions && (
            <ul className="flex flex-col gap-1 p-2">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <span>{item.name}</span>
                    {item.sku && <span className="text-xs text-neutral-400">{item.sku}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
