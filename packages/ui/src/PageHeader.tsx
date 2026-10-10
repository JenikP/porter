import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  dense?: boolean;
}

export function PageHeader({ eyebrow, title, description, actions, dense = false }: PageHeaderProps) {
  return (
    <header className={`flex flex-wrap items-start justify-between gap-4 ${dense ? 'mb-4' : 'mb-6'}`}>
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{eyebrow}</p>
        ) : null}
        <h1 className={`font-semibold text-slate-900 ${dense ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
