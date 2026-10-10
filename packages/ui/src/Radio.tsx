import React, { forwardRef } from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const inputId = id || `radio-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <label htmlFor={inputId} className={`flex cursor-pointer items-start gap-3 ${className}`}>
        <input
          ref={ref}
          id={inputId}
          type="radio"
          className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
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
Radio.displayName = 'Radio';
