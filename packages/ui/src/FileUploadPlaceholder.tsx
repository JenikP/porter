import React from 'react';

export interface FileUploadPlaceholderProps {
  title?: string;
  hint?: string;
  acceptLabel?: string;
  onSelect?: (files: FileList | null) => void;
  className?: string;
}

export function FileUploadPlaceholder({
  title = 'Upload file',
  hint = 'Prototype only — files stay in the browser session.',
  acceptLabel = 'Choose file',
  onSelect,
  className = '',
}: FileUploadPlaceholderProps) {
  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center hover:border-blue-400 hover:bg-blue-50/40 ${className}`}
    >
      <span className="text-2xl" aria-hidden>
        ⬆
      </span>
      <span className="mt-2 text-sm font-medium text-slate-900">{title}</span>
      <span className="mt-1 max-w-xs text-xs text-slate-500">{hint}</span>
      <span className="mt-3 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
        {acceptLabel}
      </span>
      <input
        type="file"
        className="sr-only"
        onChange={(event) => onSelect?.(event.target.files)}
      />
    </label>
  );
}
