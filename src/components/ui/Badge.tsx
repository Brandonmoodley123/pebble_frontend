import { clsx } from "clsx";

const colorMap: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Inactive: "bg-surface-elevated text-text-muted border border-border",
  Deceased: "bg-text text-bg",
  Lapsed: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  Admin: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  Broker: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  CREATE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  UPDATE: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  UPDATE_STATUS: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  DELETE: "bg-red-500/10 text-red-700 dark:text-red-400",
  ACTIVATE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  DEACTIVATE: "bg-surface-elevated text-text-muted border border-border",
  SET_PASSWORD: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ASSIGN_ORGANIZATION: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  DEACTIVATE_ORGANIZATION: "bg-surface-elevated text-text-muted border border-border",
  REACTIVATE_ORGANIZATION: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function Badge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorMap[value] ?? "bg-surface-elevated text-text-muted border border-border",
        className
      )}
    >
      {value}
    </span>
  );
}
