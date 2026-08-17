const toneClasses = [
  "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
];

function toneFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % toneClasses.length;
  return toneClasses[hash];
}

export function Avatar({ firstName, lastName, size = "md" }: { firstName: string; lastName: string; size?: "sm" | "md" | "lg" }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const sizeClasses = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-9 text-sm";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClasses} ${toneFor(`${firstName}${lastName}`)}`}
    >
      {initials || "?"}
    </span>
  );
}
