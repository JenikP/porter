import React from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  active?: boolean;
  completed?: boolean;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <ol className={`space-y-4 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pl-1">
            {!isLast ? <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden /> : null}
            <span
              className={`relative z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 ${
                item.completed
                  ? 'border-green-600 bg-green-600'
                  : item.active
                    ? 'border-blue-600 bg-white'
                    : 'border-slate-300 bg-white'
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1 pb-1">
              <p className={`text-sm font-medium ${item.active ? 'text-slate-900' : 'text-slate-700'}`}>
                {item.title}
              </p>
              {item.subtitle ? <p className="text-sm text-slate-500">{item.subtitle}</p> : null}
              {item.timestamp ? <p className="mt-0.5 text-xs text-slate-400">{item.timestamp}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
