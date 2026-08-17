import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search, X } from "lucide-react";
import { auditLogsApi, usersApi } from "../lib/api";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui/Feedback";
import { Pagination } from "../components/ui/Pagination";
import { formatDateTime, humanizeChanges } from "../lib/format";
import type { AuditLogDto, UserDto } from "../lib/types";

const entityOptions = ["Client", "ClientProduct", "Organization", "ProductType", "User", "UserOrganization"];

export function AuditLogsPage() {
  const [entityName, setEntityName] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogDto | null>(null);

  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list() });
  const query = useQuery({
    queryKey: ["audit-logs", { entityName, userId, page }],
    queryFn: () =>
      auditLogsApi.list({
        entityName: entityName || undefined,
        userId: userId ? Number(userId) : undefined,
        page,
        pageSize: 25,
      }),
  });

  return (
    <div>
      <PageHeader eyebrow="Compliance" title="Audit logs" description="Every create, update and delete, attributed to the user who made it." />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <Select
            value={entityName}
            onChange={(e) => {
              setEntityName(e.target.value);
              setPage(1);
            }}
            className="sm:w-56"
          >
            <option value="">All entity types</option>
            {entityOptions.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
          <PerformedByFilter
            users={usersQuery.data}
            userId={userId}
            onChange={(id) => {
              setUserId(id);
              setPage(1);
            }}
          />
        </div>

        {query.isLoading && <Spinner label="Loading audit logs…" />}
        {query.isError && <ErrorBanner message="Could not load audit logs." />}
        {query.data && query.data.items.length === 0 && <EmptyState title="No matching activity" />}

        {query.data && query.data.items.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
                  <tr>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">Performed by</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {query.data.items.map((log, i) => (
                    <tr key={log.id} className="animate-row-in transition-colors hover:bg-surface-hover" style={{ animationDelay: `${i * 25}ms` }}>
                      <td className="px-4 py-3.5">
                        <Badge value={log.action} />
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">
                        {log.entityName} #{log.entityId}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-text">{log.username ?? "System"}</td>
                      <td className="max-w-xs truncate px-4 py-3.5 text-text-muted">{log.reason ?? "—"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-text-muted">{formatDateTime(log.timestamp)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <Button size="sm" variant="secondary" onClick={() => setSelected(log)}>
                          <Eye className="size-4" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border sm:hidden">
              {query.data.items.map((log, i) => (
                <li key={log.id} className="animate-row-in flex flex-col gap-2 p-4" style={{ animationDelay: `${i * 25}ms` }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge value={log.action} />
                    <span className="text-sm text-text">
                      <span className="font-medium">{log.username ?? "System"}</span> — {log.entityName} #{log.entityId}
                    </span>
                  </div>
                  {log.reason && <p className="text-xs text-text-muted">"{log.reason}"</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-faint">{formatDateTime(log.timestamp)}</span>
                    <Button size="sm" variant="secondary" onClick={() => setSelected(log)}>
                      <Eye className="size-4" /> View
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={query.data.page} totalPages={query.data.totalPages} totalCount={query.data.totalCount} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Audit log detail">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge value={selected.action} />
              <p className="text-sm font-medium text-text">
                {selected.entityName} #{selected.entityId}
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <Row label="Performed by" value={selected.username ?? "System"} />
              <Row label="When" value={formatDateTime(selected.timestamp)} />
            </dl>

            {selected.reason && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">Reason given</p>
                <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{selected.reason}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">What changed</p>
              {humanizeChanges(selected.changes).length === 0 ? (
                <p className="text-sm text-text-faint">No additional details recorded for this action.</p>
              ) : (
                <dl className="divide-y divide-border rounded-lg border border-border">
                  {humanizeChanges(selected.changes).map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 px-3 py-2 text-sm">
                      <dt className="shrink-0 text-text-muted">{row.label}</dt>
                      <dd className="text-right text-text">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd className="text-right text-text">{value}</dd>
    </div>
  );
}

function PerformedByFilter({
  users,
  userId,
  onChange,
}: {
  users: UserDto[] | undefined;
  userId: string;
  onChange: (userId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = users?.find((u) => String(u.id) === userId);

  const matches = (users ?? []).filter((u) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  if (selected && !open) {
    return (
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm text-text sm:w-56"
      >
        <span className="truncate">
          {selected.firstName} {selected.lastName}
        </span>
        <X
          role="button"
          aria-label="Clear performed-by filter"
          className="size-3.5 shrink-0 text-text-faint hover:text-text"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
        />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full sm:w-56">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search performed by…"
        className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-faint focus:border-text focus:outline focus:outline-2 focus:outline-ring/20"
      />
      {open && (
        <div className="animate-fade-in absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
            }}
            className="flex w-full items-center px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-hover"
          >
            All users
          </button>
          {matches.length === 0 && <p className="px-3 py-2 text-sm text-text-faint">No matching users</p>}
          {matches.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onChange(String(u.id));
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-surface-hover"
            >
              <span className="text-sm font-medium text-text">
                {u.firstName} {u.lastName}
              </span>
              <span className="text-xs text-text-faint">{u.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
