import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { organizationsApi } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui/Feedback";
import { OrganizationForm } from "../components/organizations/OrganizationForm";
import type { CreateOrganizationRequest, OrganizationDto, UpdateOrganizationRequest } from "../lib/types";
import { ApiError } from "../lib/api";

export function OrganizationsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; org: OrganizationDto } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["organizations", "page"], queryFn: () => organizationsApi.list({ pageSize: 100 }) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["organizations"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateOrganizationRequest) => organizationsApi.create(payload),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateOrganizationRequest }) => organizationsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => organizationsApi.remove(id),
    onSuccess: invalidate,
    onError: (err) => setDeleteError(err instanceof ApiError ? err.message : "Could not delete this organization."),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="Organizations"
        description="The insurers, medical aids and investment houses you place business with."
        actions={
          isAdmin ? (
            <Button onClick={() => setModal({ mode: "create" })}>
              <Plus className="size-4" /> New organization
            </Button>
          ) : undefined
        }
      />

      {deleteError && <div className="mb-4"><ErrorBanner message={deleteError} /></div>}

      <Card>
        {query.isLoading && <Spinner label="Loading organizations…" />}
        {query.isError && <ErrorBanner message="Could not load organizations." />}
        {query.data && query.data.items.length === 0 && <EmptyState title="No organizations yet" />}

        {query.data && query.data.items.length > 0 && (
          <ul className="divide-y divide-border">
            {query.data.items.map((org, i) => (
              <li
                key={org.id}
                className="animate-row-in flex flex-col gap-3 p-4 transition-colors hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between sm:p-5"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text">{org.name}</p>
                    <Badge value={org.type} className="border border-border bg-surface-elevated text-text-muted" />
                    {!org.isActive && <Badge value="Inactive" />}
                  </div>
                  <p className="text-xs text-text-muted">{org.contactEmail || org.contactPhone || "No contact details"}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 self-start sm:self-center">
                    <Button size="sm" variant="secondary" onClick={() => setModal({ mode: "edit", org })}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setDeleteError(null);
                        if (confirm(`Delete ${org.name}?`)) deleteMutation.mutate(org.id);
                      }}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit organization" : "New organization"}>
        {modal && (
          <OrganizationForm
            initial={modal.mode === "edit" ? modal.org : undefined}
            onCancel={() => setModal(null)}
            onSubmit={async (payload) => {
              if (modal.mode === "edit") {
                await updateMutation.mutateAsync({ id: modal.org.id, payload: payload as UpdateOrganizationRequest });
              } else {
                await createMutation.mutateAsync(payload as CreateOrganizationRequest);
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}
