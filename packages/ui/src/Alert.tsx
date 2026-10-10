import React from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const styles: Record<AlertVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

export interface AlertProps {
  variant?: AlertVariant;
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]} ${className}`}
    >
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 opacity-90">{children}</div> : null}
    </div>
  );
}
