import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div className={`porter-card bg-white rounded-lg border border-slate-200 ${paddingMap[padding]} ${hover ? 'hover:border-blue-300 transition-colors cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}
