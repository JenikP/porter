import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this screen. Try again in a moment.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <span className="text-4xl" aria-hidden>
        ⚠
      </span>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
