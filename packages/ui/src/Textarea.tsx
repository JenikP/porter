import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={`block w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
        {hint && !error ? <p className="mt-1.5 text-sm text-gray-500">{hint}</p> : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
