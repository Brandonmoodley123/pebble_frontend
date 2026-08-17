export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-ZA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value);
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const actionVerbs: Record<string, string> = {
  CREATE: "created",
  UPDATE: "updated",
  UPDATE_STATUS: "changed the status of",
  DELETE: "deleted",
  ACTIVATE: "activated",
  DEACTIVATE: "deactivated",
  SET_PASSWORD: "reset the password for",
  ASSIGN_ORGANIZATION: "assigned an organization to",
  DEACTIVATE_ORGANIZATION: "removed organization access from",
  REACTIVATE_ORGANIZATION: "restored organization access for",
};

export function describeAuditAction(action: string): string {
  return actionVerbs[action] ?? action.toLowerCase().replace(/_/g, " ");
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function humanizeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
  return String(value);
}

export function humanizeChanges(changes?: string | null): Array<{ label: string; value: string }> {
  if (!changes) return [];
  try {
    const parsed = JSON.parse(changes) as Record<string, unknown>;
    return Object.entries(parsed).map(([key, value]) => ({ label: humanizeKey(key), value: humanizeValue(value) }));
  } catch {
    return [{ label: "Raw", value: changes }];
  }
}
