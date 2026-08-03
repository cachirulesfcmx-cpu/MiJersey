'use client';

import { useState } from 'react';

export interface TabEntry {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ tabs }: { tabs: TabEntry[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeId);

  return (
    <div>
      <div className="tf-tabs-list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="tf-tab"
            data-active={tab.id === activeId}
            aria-selected={tab.id === activeId}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" style={{ marginTop: 'var(--tf-space-6)' }}>
        {active?.content}
      </div>
    </div>
  );
}
