import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const baseInputClasses = cn(
  'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm',
  'placeholder:text-muted-foreground2',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'tabular-nums',
);

/** Generic text input */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseInputClasses, className)} {...props} />
  ),
);
Input.displayName = 'Input';

/**
 * NumberInput — accepts decimal point or comma (French convention).
 * Stores cleaned number via onValueChange. Empty string → undefined.
 */
type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'type'
> & {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  /** Minimum allowed (validation only — caller still must filter). */
  min?: number;
  /** Maximum allowed. */
  max?: number;
};

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onValueChange, min, max, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn(baseInputClasses, className)}
        value={value === undefined ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (raw === '') {
            onValueChange(undefined);
            return;
          }
          // Accept both "1234.5" and "1234,5" (FR convention)
          const cleaned = raw.replace(',', '.').replace(/[^0-9.-]/g, '');
          const n = Number(cleaned);
          if (!Number.isFinite(n)) return;
          if (min !== undefined && n < min) return;
          if (max !== undefined && n > max) return;
          onValueChange(n);
        }}
        {...props}
      />
    );
  },
);
NumberInput.displayName = 'NumberInput';

/** Native select with consistent styling */
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

/** Form field label */
export function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </label>
  );
}

/** Help text shown below a field */
export function HelpText({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn('mt-1 text-xs text-muted-foreground2', className)}>
      {children}
    </p>
  );
}
