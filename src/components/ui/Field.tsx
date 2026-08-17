import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

const fieldClasses =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint " +
  "focus:border-text focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-ring/20 disabled:bg-surface-elevated disabled:text-text-faint";

interface WrapperProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function FieldWrapper({ label, error, required, hint, children, htmlFor }: WrapperProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-text">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-text-faint">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => (
    <FieldWrapper label={label} error={error} required={required} hint={hint} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        required={required}
        className={clsx(fieldClasses, error && "border-red-400", className)}
        {...props}
      />
    </FieldWrapper>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => (
    <FieldWrapper label={label} error={error} required={required} hint={hint} htmlFor={id}>
      <textarea ref={ref} id={id} required={required} className={clsx(fieldClasses, error && "border-red-400", className)} {...props} />
    </FieldWrapper>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, className, id, children, ...props }, ref) => (
    <FieldWrapper label={label} error={error} required={required} hint={hint} htmlFor={id}>
      <select ref={ref} id={id} required={required} className={clsx(fieldClasses, error && "border-red-400", className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
);
Select.displayName = "Select";
