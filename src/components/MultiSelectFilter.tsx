import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';

export interface MultiSelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface MultiSelectFilterProps<T extends string | number> {
  label: string;
  options: MultiSelectOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  minWidth?: string;
}

function MultiSelectFilter<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  placeholder,
  icon,
  className,
  minWidth = '160px',
}: MultiSelectFilterProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const toggleOption = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const buttonText = selected.length === 0
    ? (placeholder ?? `All ${label}`)
    : `${label} (${selected.length})`;

  return (
    <div
      ref={containerRef}
      className={clsx('relative', className)}
      style={{ minWidth }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg',
          'bg-dark-900 border border-dark-700 text-dark-100',
          'hover:border-dark-600 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
          selected.length > 0 && 'border-primary-500/40'
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-dark-400 shrink-0">{icon}</span>}
          <span className={clsx('truncate text-sm', selected.length === 0 && 'text-dark-400')}>
            {buttonText}
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className="p-0.5 text-dark-400 hover:text-dark-50 hover:bg-dark-700 rounded transition-colors"
              title="Clear"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={clsx('text-dark-400 transition-transform', open && 'rotate-180')}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full min-w-[200px] bg-dark-900 border border-dark-700 rounded-lg shadow-xl py-1 max-h-72 overflow-y-auto animate-fade-in">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-dark-500">No options</div>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                    'hover:bg-dark-800 transition-colors',
                    isSelected ? 'text-dark-50' : 'text-dark-200'
                  )}
                >
                  <span
                    className={clsx(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      isSelected
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-dark-600 bg-dark-800'
                    )}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
          {selected.length > 0 && (
            <div className="border-t border-dark-800 mt-1 pt-1 px-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full px-2 py-1.5 text-xs text-dark-400 hover:text-dark-50 hover:bg-dark-800 rounded transition-colors text-left"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MultiSelectFilter;
