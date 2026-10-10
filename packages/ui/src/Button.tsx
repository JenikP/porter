import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
  secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-500',
  ghost: 'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  accent: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading, fullWidth, icon, children, className = '', disabled, ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={`porter-button porter-button--${variant} ${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {loading ? (
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    ) : icon ? <span className="flex-shrink-0">{icon}</span> : null}
    {children}
  </button>
));
Button.displayName = 'Button';
