import React, { forwardRef } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <label htmlFor={inputId} className={`flex cursor-pointer items-start gap-3 ${className}`}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          {...props}
        />
        <span>
          <span className="block text-sm font-medium text-gray-900">{label}</span>
          {description ? <span className="mt-0.5 block text-sm text-gray-500">{description}</span> : null}
        </span>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';
