import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 ${className}`} role="tablist">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`min-h-[40px] flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            {item.badge !== undefined ? (
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">{item.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
