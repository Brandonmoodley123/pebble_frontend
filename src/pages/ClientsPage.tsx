import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { clientProductsApi, clientsApi } from "../lib/api";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui/Feedback";
import { Pagination } from "../components/ui/Pagination";
import { ClientForm } from "../components/clients/ClientForm";
import { formatDate } from "../lib/format";
import type { ClientDto, CreateClientRequest, InitialClientProduct, UpdateClientRequest } from "../lib/types";

export function ClientsPage() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientDto | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "";
  const page = Number(params.get("page") ?? "1");

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== search) {
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput) next.set("search", searchInput);
          else next.delete("search");
          next.set("page", "1");
          return next;
        });
      }
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useQuery({
    queryKey: ["clients", { search, status, page }],
    queryFn: () => clientsApi.list({ search: search || undefined, status: status || undefined, page, pageSize: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: async ({ client, product }: { client: CreateClientRequest; product?: InitialClientProduct }) => {
      const created = await clientsApi.create(client);
      if (product) {
        await clientProductsApi.create({ ...product, clientId: created.id });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-products"] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateClientRequest) => clientsApi.update(editTarget!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditTarget(null);
    },
  });

  const setStatus = (value: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("status", value);
      else next.delete("status");
      next.set("page", "1");
      return next;
    });
  };

  const setPage = (value: number) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(value));
      return next;
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Book of business"
        title="Clients"
        description="Search, review and manage every client on the book."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New client
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, ID number, email or policy number…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-faint focus:border-text focus:outline focus:outline-2 focus:outline-ring/20"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Deceased">Deceased</option>
          </Select>
        </div>

        {query.isLoading && <Spinner label="Loading clients…" />}
        {query.isError && <ErrorBanner message="Could not load clients." />}
        {query.data && query.data.items.length === 0 && (
          <EmptyState title="No clients found" description="Try a different search term or add a new client." />
        )}

        {query.data && query.data.items.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">ID number</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Products</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Client since</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {query.data.items.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-4 py-3.5">
                        <Link to={`/clients/${client.id}`} className="font-medium text-text hover:underline">
                          {client.firstName} {client.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{client.idNumber}</td>
                      <td className="px-4 py-3.5 text-text-muted">
                        <div>{client.email ?? "—"}</div>
                        <div className="text-xs text-text-faint">{client.phoneNumber ?? ""}</div>
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{client.productCount}</td>
                      <td className="px-4 py-3.5">
                        <Badge value={client.status} />
                      </td>
                      <td className="px-4 py-3.5 text-text-muted">{formatDate(client.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/clients/${client.id}`)}>
                            <Eye className="size-4" /> View
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditTarget(client)}>
                            <Pencil className="size-4" /> Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border sm:hidden">
              {query.data.items.map((client) => (
                <li key={client.id} className="flex flex-col gap-3 p-4">
                  <Link to={`/clients/${client.id}`} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-text-muted">{client.idNumber}</p>
                      <p className="text-xs text-text-faint">{client.productCount} product(s)</p>
                    </div>
                    <Badge value={client.status} />
                  </Link>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/clients/${client.id}`)}>
                      <Eye className="size-4" /> View
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEditTarget(client)}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={query.data.page} totalPages={query.data.totalPages} totalCount={query.data.totalCount} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New client">
        <ClientForm
          submitLabel="Create client"
          onCancel={() => setCreateOpen(false)}
          onSubmit={(payload, product) => createMutation.mutateAsync({ client: payload as CreateClientRequest, product })}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit client">
        {editTarget && (
          <ClientForm
            initial={editTarget}
            submitLabel="Save changes"
            onCancel={() => setEditTarget(null)}
            onSubmit={(payload) => updateMutation.mutateAsync(payload as UpdateClientRequest)}
          />
        )}
      </Modal>
    </div>
  );
}
