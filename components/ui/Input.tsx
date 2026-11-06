import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'

type BaseFieldProps = {
  label?: string
  error?: string
  hint?: string
  variant?: 'filled' | 'bordered'
  containerClassName?: string
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & BaseFieldProps

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & BaseFieldProps & {
  children: ReactNode
}

export function Input({
  label,
  error,
  hint,
  variant = 'filled',
  id,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId

  if (variant === 'bordered') {
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={fieldId} className="text-caption font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={fieldId}
          className={cn(
            'h-11 rounded-[10px] border border-separator bg-surface px-3.5 text-body-sm text-ink placeholder:text-text-muted focus:border-teal outline-none transition-colors',
            error && 'border-negative focus:border-negative',
            className
          )}
          {...props}
        />
        {error && <p className="text-label text-negative">{error}</p>}
        {!error && hint && <p className="text-label text-text-muted">{hint}</p>}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      <div
        className={cn(
          'group flex flex-col justify-center gap-0.5 rounded-xl bg-canvas px-3.5 py-2 min-h-[56px] border border-transparent transition-colors focus-within:border-teal focus-within:bg-teal/5',
          error && 'border-negative bg-negative/5 focus-within:border-negative focus-within:bg-negative/5'
        )}
      >
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'text-label font-medium text-text-secondary transition-colors group-focus-within:text-teal',
              error && 'text-negative group-focus-within:text-negative'
            )}
          >
            {label}
          </label>
        )}
        <input
          id={fieldId}
          className={cn(
            'w-full bg-transparent text-body-sm font-semibold text-ink placeholder:text-text-muted placeholder:font-normal outline-none',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-label text-negative">{error}</p>}
      {!error && hint && <p className="text-label text-text-muted">{hint}</p>}
    </div>
  )
}

export function Select({
  label,
  error,
  hint,
  variant = 'filled',
  id,
  className,
  containerClassName,
  children,
  ...props
}: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId

  if (variant === 'bordered') {
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={fieldId} className="text-caption font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          id={fieldId}
          className={cn(
            'h-11 rounded-[10px] border border-separator bg-surface px-3.5 text-body-sm text-ink focus:border-teal outline-none transition-colors',
            error && 'border-negative focus:border-negative',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-label text-negative">{error}</p>}
        {!error && hint && <p className="text-label text-text-muted">{hint}</p>}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      <div
        className={cn(
          'group flex flex-col justify-center gap-0.5 rounded-xl bg-canvas px-3.5 py-2 min-h-[56px] border border-transparent transition-colors focus-within:border-teal focus-within:bg-teal/5',
          error && 'border-negative bg-negative/5 focus-within:border-negative focus-within:bg-negative/5'
        )}
      >
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'text-label font-medium text-text-secondary transition-colors group-focus-within:text-teal',
              error && 'text-negative group-focus-within:text-negative'
            )}
          >
            {label}
          </label>
        )}
        <select
          id={fieldId}
          className={cn(
            'w-full bg-transparent text-body-sm font-semibold text-ink outline-none',
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && <p className="text-label text-negative">{error}</p>}
      {!error && hint && <p className="text-label text-text-muted">{hint}</p>}
    </div>
  )
}
