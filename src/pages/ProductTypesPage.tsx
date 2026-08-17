import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { organizationsApi, productTypesApi } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui/Feedback";
import { ProductTypeForm } from "../components/productTypes/ProductTypeForm";
import type { CreateProductTypeRequest, ProductTypeDto, UpdateProductTypeRequest } from "../lib/types";
import { ApiError } from "../lib/api";

export function ProductTypesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [orgFilter, setOrgFilter] = useState("");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; product: ProductTypeDto } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const orgsQuery = useQuery({ queryKey: ["organizations", "all"], queryFn: () => organizationsApi.list({ pageSize: 200 }) });
  const query = useQuery({
    queryKey: ["product-types", "page", orgFilter],
    queryFn: () => productTypesApi.list({ pageSize: 100, organizationId: orgFilter ? Number(orgFilter) : undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["product-types"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateProductTypeRequest) => productTypesApi.create(payload),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProductTypeRequest }) => productTypesApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productTypesApi.remove(id),
    onSuccess: invalidate,
    onError: (err) => setDeleteError(err instanceof ApiError ? err.message : "Could not delete this product type."),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="Product types"
        description="Every kind of policy, investment or medical aid plan you sell."
        actions={
          isAdmin ? (
            <Button onClick={() => setModal({ mode: "create" })}>
              <Plus className="size-4" /> New product type
            </Button>
          ) : undefined
        }
      />

      {deleteError && <div className="mb-4"><ErrorBanner message={deleteError} /></div>}

      <Card>
        <div className="border-b border-border p-4">
          <Select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} className="sm:w-64">
            <option value="">All organizations</option>
            {orgsQuery.data?.items.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>
        </div>

        {query.isLoading && <Spinner label="Loading product types…" />}
        {query.isError && <ErrorBanner message="Could not load product types." />}
        {query.data && query.data.items.length === 0 && <EmptyState title="No product types yet" />}

        {query.data && query.data.items.length > 0 && (
          <ul className="divide-y divide-border">
            {query.data.items.map((product, i) => (
              <li
                key={product.id}
                className="animate-row-in flex flex-col gap-3 p-4 transition-colors hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between sm:p-5"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text">{product.name}</p>
                    <Badge value={product.category} className="border border-border bg-surface-elevated text-text-muted" />
                    {!product.isActive && <Badge value="Inactive" />}
                  </div>
                  <p className="text-xs text-text-muted">{product.organizationName}</p>
                  {product.description && <p className="mt-1 text-xs text-text-faint">{product.description}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 self-start sm:self-center">
                    <Button size="sm" variant="secondary" onClick={() => setModal({ mode: "edit", product })}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setDeleteError(null);
                        if (confirm(`Delete ${product.name}?`)) deleteMutation.mutate(product.id);
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

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit product type" : "New product type"}>
        {modal && (
          <ProductTypeForm
            initial={modal.mode === "edit" ? modal.product : undefined}
            onCancel={() => setModal(null)}
            onSubmit={async (payload) => {
              if (modal.mode === "edit") {
                await updateMutation.mutateAsync({ id: modal.product.id, payload: payload as UpdateProductTypeRequest });
              } else {
                await createMutation.mutateAsync(payload as CreateProductTypeRequest);
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}
