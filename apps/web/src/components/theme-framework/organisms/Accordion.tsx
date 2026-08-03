'use client';

import { useState } from 'react';

export interface AccordionEntry {
  id: string;
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="tf-accordion-item" data-open={isOpen}>
            <button
              type="button"
              className="tf-accordion-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              {item.question}
              <span className="tf-accordion-icon" aria-hidden="true">
                +
              </span>
            </button>
            <div className="tf-accordion-panel">
              <div className="tf-accordion-panel-inner">
                <p className="tf-accordion-panel-content tf-small">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
