import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, UserCog, Users as UsersIcon, X } from "lucide-react";
import { clsx } from "clsx";
import { clientsApi, usersApi } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Avatar } from "../ui/Avatar";

export function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const active = debounced.length >= 2;

  const clientsQuery = useQuery({
    queryKey: ["global-search-clients", debounced],
    queryFn: () => clientsApi.list({ search: debounced, page: 1, pageSize: 5 }),
    enabled: active,
    staleTime: 15_000,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
    enabled: active && isAdmin,
    staleTime: 60_000,
  });

  const matchedUsers = (usersQuery.data ?? [])
    .filter((u) => {
      const term = debounced.toLowerCase();
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    })
    .slice(0, 5);

  const clients = clientsQuery.data?.items ?? [];
  const hasResults = clients.length > 0 || matchedUsers.length > 0;
  const loading = clientsQuery.isFetching || (isAdmin && usersQuery.isFetching);

  const go = (path: string) => {
    navigate(path);
    setQuery("");
    setDebounced("");
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search clients, users…"
          className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-8 text-sm text-text placeholder:text-text-faint focus:border-text focus:bg-surface focus:outline focus:outline-2 focus:outline-ring/20"
        />
        {query && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setDebounced("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && active && (
        <div className="animate-fade-in absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl">
          {loading && !hasResults && <p className="px-4 py-6 text-center text-sm text-text-muted">Searching…</p>}

          {!loading && !hasResults && <p className="px-4 py-6 text-center text-sm text-text-muted">No matches for "{debounced}"</p>}

          {clients.length > 0 && (
            <div className="py-2">
              <p className="px-4 pb-1 text-xs font-medium uppercase tracking-wide text-text-faint">Clients</p>
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go(`/clients/${c.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-hover"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-text-muted">
                    <UsersIcon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="block truncate text-xs text-text-muted">{c.idNumber}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {matchedUsers.length > 0 && (
            <div className={clsx("border-t border-border py-2", clients.length === 0 && "border-t-0")}>
              <p className="px-4 pb-1 text-xs font-medium uppercase tracking-wide text-text-faint">Users</p>
              {matchedUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => go(`/users/${u.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-hover"
                >
                  <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="block truncate text-xs text-text-muted">{u.username}</span>
                  </span>
                  <UserCog className="size-3.5 shrink-0 text-text-faint" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
