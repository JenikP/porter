import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, icon, className = '', id, ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>}
        <input
          ref={ref}
          id={inputId}
          className={`
            porter-input block w-full rounded-lg border text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>
      {error && <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-gray-500">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';
