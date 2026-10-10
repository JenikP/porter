import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, options, className = '', id, ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <select
        ref={ref}
        id={selectId}
        className={`
          block w-full rounded-lg border text-gray-900 bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500
          px-4 py-2.5
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';
