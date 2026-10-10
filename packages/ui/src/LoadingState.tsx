import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  title = 'Loading',
  description = 'Please wait while we fetch the latest prototype data.',
  size = 'md',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <LoadingSpinner size={size} />
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
