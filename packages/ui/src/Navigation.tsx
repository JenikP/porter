import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface NavigationProps {
  items: NavItem[];
  variant?: 'bottom' | 'side';
  className?: string;
}

export function Navigation({ items, variant = 'bottom', className = '' }: NavigationProps) {
  if (variant === 'side') {
    return (
      <nav className={`flex flex-col gap-1 ${className}`} aria-label="Section navigation">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
              item.active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur ${className}`}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {items.map((item) => (
          <li key={item.id} className="flex-1">
            <button
              type="button"
              onClick={item.onClick}
              className={`flex w-full flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${
                item.active ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <span className="text-base leading-none">●</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
