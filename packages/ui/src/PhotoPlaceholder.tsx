import React from 'react';

export interface PhotoPlaceholderProps {
  label?: string;
  aspect?: 'square' | 'video';
  className?: string;
}

export function PhotoPlaceholder({
  label = 'Photo placeholder',
  aspect = 'square',
  className = '',
}: PhotoPlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 ${
        aspect === 'square' ? 'aspect-square' : 'aspect-video'
      } ${className}`}
    >
      <div>
        <p className="text-2xl" aria-hidden>
          📷
        </p>
        <p className="mt-1 px-2">{label}</p>
      </div>
    </div>
  );
}
