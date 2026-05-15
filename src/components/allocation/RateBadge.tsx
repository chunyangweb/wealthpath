import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Inline editable percentage badge. Click to edit, blur or Enter to save.
 * Used next to each product name to show the rate the engine will use.
 */
export function RateBadge({
  rate,
  isOverride,
  onChange,
  onReset,
}: {
  /** The rate as a decimal (0.015 = 1.5%) */
  rate: number;
  /** True if the user has overridden the default rate */
  isOverride: boolean;
  /** Called with the new rate as a decimal. */
  onChange: (newRate: number) => void;
  /** Called when the user wants to reset to the default rate. */
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const display = `${(rate * 100).toFixed(2).replace(/\.?0+$/, '')} %`;

  function commit() {
    const cleaned = draft.replace(',', '.').replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    if (Number.isFinite(n) && n >= -50 && n <= 100) {
      onChange(n / 100);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-16 rounded border border-input bg-card px-1 py-0.5 text-xs tabular-nums"
        aria-label="Edit rate"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft((rate * 100).toFixed(2));
        setEditing(true);
      }}
      onContextMenu={(e) => {
        if (isOverride) {
          e.preventDefault();
          onReset();
        }
      }}
      className={cn(
        'rounded px-1.5 py-0.5 text-xs tabular-nums transition-colors',
        isOverride
          ? 'bg-warning text-warning-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      )}
      title={
        isOverride
          ? 'Taux modifié. Clic droit pour réinitialiser.'
          : 'Cliquez pour modifier le taux.'
      }
    >
      {display}
    </button>
  );
}
