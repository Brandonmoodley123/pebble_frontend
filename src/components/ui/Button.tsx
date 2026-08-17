import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover focus-visible:outline-ring disabled:opacity-40",
  secondary:
    "bg-surface text-text border border-border hover:bg-surface-hover hover:border-border-strong focus-visible:outline-ring disabled:opacity-40",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-600",
  ghost: "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text focus-visible:outline-ring",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5 [&_svg]:size-3.5",
  md: "h-8 px-3 text-[13px] gap-1.5 [&_svg]:size-3.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors duration-100",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
