import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { authApi, usersApi } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { ReasonModal } from "../components/ui/ReasonModal";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui/Feedback";
import { RegisterUserForm } from "../components/users/RegisterUserForm";
import { formatDate } from "../lib/format";
import type { RegisterUserRequest, UserDto } from "../lib/types";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeTarget, setActiveTarget] = useState<UserDto | null>(null);

  const query = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list() });

  const createMutation = useMutation({
    mutationFn: (payload: RegisterUserRequest) => authApi.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive, reason }: { id: number; isActive: boolean; reason: string }) =>
      usersApi.setActive(id, { isActive, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setActiveTarget(null);
    },
  });

  const filtered = useMemo(() => {
    if (!query.data) return [];
    const term = search.trim().toLowerCase();
    return query.data.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!term) return true;
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [query.data, search, roleFilter]);

  return (
    <div>
      <PageHeader
        eyebrow="Access"
        title="Users"
        description="Everyone who can log in to Pebble, and what they're allowed to touch."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New login
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username or email…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-faint focus:border-text focus:outline focus:outline-2 focus:outline-ring/20"
            />
          </div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="sm:w-44">
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Broker">Broker</option>
          </Select>
        </div>

        {query.isLoading && <Spinner label="Loading users…" />}
        {query.isError && <ErrorBanner message="Could not load users." />}
        {query.data && filtered.length === 0 && (
          <EmptyState title="No users found" description="Try a different search term or filter." />
        )}

        {filtered.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-4 py-3.5">
                        <Link to={`/users/${u.id}`} className="flex items-center gap-3">
                          <Avatar firstName={u.firstName} lastName={u.lastName} />
                          <div>
                            <p className="font-medium text-text hover:underline">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-text-muted">
                              {u.username} · {u.email}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge value={u.role} />
                      </td>
                      <td className="px-4 py-3.5">{!u.isActive && <Badge value="Inactive" />}{u.isActive && <Badge value="Active" />}</td>
                      <td className="px-4 py-3.5 text-text-muted">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={u.id === currentUser?.id}
                          onClick={() => setActiveTarget(u)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border sm:hidden">
              {filtered.map((u) => (
                <li key={u.id} className="flex flex-col gap-3 p-4">
                  <Link to={`/users/${u.id}`} className="flex items-center gap-3">
                    <Avatar firstName={u.firstName} lastName={u.lastName} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text">
                          {u.firstName} {u.lastName}
                        </p>
                        <Badge value={u.role} />
                        {!u.isActive && <Badge value="Inactive" />}
                      </div>
                      <p className="text-xs text-text-muted">
                        {u.username} · {u.email}
                      </p>
                      <p className="text-xs text-text-faint">Joined {formatDate(u.createdAt)}</p>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={u.id === currentUser?.id}
                    onClick={() => setActiveTarget(u)}
                    className="self-start"
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New login">
        <RegisterUserForm onCancel={() => setCreateOpen(false)} onSubmit={(payload) => createMutation.mutateAsync(payload)} />
      </Modal>

      <ReasonModal
        open={activeTarget !== null}
        title={activeTarget?.isActive ? `Deactivate ${activeTarget?.firstName}?` : `Activate ${activeTarget?.firstName}?`}
        description={
          activeTarget?.isActive
            ? "They will immediately lose the ability to log in."
            : "They will regain the ability to log in."
        }
        confirmLabel={activeTarget?.isActive ? "Deactivate" : "Activate"}
        variant={activeTarget?.isActive ? "danger" : "primary"}
        onCancel={() => setActiveTarget(null)}
        onConfirm={(reason) =>
          toggleActiveMutation.mutateAsync({ id: activeTarget!.id, isActive: !activeTarget!.isActive, reason })
        }
      />
    </div>
  );
}
