import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarDays,
  Eye,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Tag,
  Trash2,
} from "lucide-react";
import { clientProductsApi, clientsApi } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Modal } from "../components/ui/Modal";
import { ReasonModal } from "../components/ui/ReasonModal";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui/Feedback";
import { ClientForm } from "../components/clients/ClientForm";
import { ClientProductForm } from "../components/clients/ClientProductForm";
import { formatCurrency, formatDate } from "../lib/format";
import type { ClientProductDto, ClientProductStatus, ClientStatus, CreateClientProductRequest, UpdateClientProductRequest, UpdateClientRequest } from "../lib/types";

const statusFlow: ClientStatus[] = ["Active", "Inactive", "Deceased"];
const productStatusFlow: ClientProductStatus[] = ["Active", "Lapsed", "Cancelled"];

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ClientStatus | null>(null);
  const [productModal, setProductModal] = useState<{ mode: "create" } | { mode: "edit"; product: ClientProductDto } | null>(null);
  const [viewProduct, setViewProduct] = useState<ClientProductDto | null>(null);

  const clientQuery = useQuery({ queryKey: ["clients", clientId], queryFn: () => clientsApi.get(clientId) });
  const productsQuery = useQuery({
    queryKey: ["client-products", { clientId }],
    queryFn: () => clientProductsApi.list({ clientId, pageSize: 100 }),
  });

  const invalidateClient = () => {
    queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateClientRequest) => clientsApi.update(clientId, payload),
    onSuccess: () => {
      invalidateClient();
      setEditOpen(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: ClientStatus; reason: string }) => clientsApi.updateStatus(clientId, { status, reason }),
    onSuccess: () => {
      invalidateClient();
      setStatusTarget(null);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: () => clientsApi.remove(clientId),
    onSuccess: () => navigate("/clients", { replace: true }),
  });

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["client-products", { clientId }] });
    invalidateClient();
  };

  const createProductMutation = useMutation({
    mutationFn: (payload: CreateClientProductRequest) => clientProductsApi.create(payload),
    onSuccess: () => {
      invalidateProducts();
      setProductModal(null);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateClientProductRequest }) => clientProductsApi.update(id, payload),
    onSuccess: () => {
      invalidateProducts();
      setProductModal(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => clientProductsApi.remove(productId),
    onSuccess: invalidateProducts,
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ product, status }: { product: ClientProductDto; status: ClientProductStatus }) =>
      clientProductsApi.update(product.id, {
        organizationId: product.organizationId,
        productTypeId: product.productTypeId,
        policyNumber: product.policyNumber ?? undefined,
        premiumAmount: product.premiumAmount ?? undefined,
        startDate: product.startDate,
        endDate: product.endDate ?? undefined,
        notes: product.notes ?? undefined,
        status,
      }),
    onSuccess: invalidateProducts,
  });

  if (clientQuery.isLoading) return <Spinner label="Loading client…" />;
  if (clientQuery.isError || !clientQuery.data) return <ErrorBanner message="Could not load this client." />;

  const client = clientQuery.data;

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-text-faint">
        <Link to="/clients" className="inline-flex items-center gap-1 text-text-muted hover:text-text">
          <ArrowLeft className="size-4" /> Clients
        </Link>
        <span>/</span>
        <span className="truncate text-text-muted">
          {client.firstName} {client.lastName}
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar firstName={client.firstName} lastName={client.lastName} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
                {client.firstName} {client.lastName}
              </h1>
              <Badge value={client.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              ID {client.idNumber} · Client since {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit details
          </Button>
          {isAdmin && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Permanently delete ${client.firstName} ${client.lastName}? This cannot be undone.`)) {
                  deleteClientMutation.mutate();
                }
              }}
              loading={deleteClientMutation.isPending}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {client.notes && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <StickyNote className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">Note</p>
            <p className="mt-0.5 whitespace-pre-line break-words">{client.notes}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-text">Contact details</h2>
            <dl className="space-y-4">
              <Detail icon={Mail} label="Email" value={client.email} />
              <Detail icon={Phone} label="Phone" value={client.phoneNumber} />
              <Detail
                icon={MapPin}
                label="Address"
                value={[client.addressLine1, client.addressLine2, client.city, client.postalCode].filter(Boolean).join(", ")}
              />
              <Detail icon={CalendarDays} label="Date of birth" value={client.dateOfBirth ? formatDate(client.dateOfBirth) : undefined} />
              {client.notes && <Detail icon={StickyNote} label="Notes" value={client.notes} />}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-text">Status</h2>
            <p className="mb-3 text-xs text-text-muted">
              Changing status keeps all policy/investment history intact - use this when a client leaves or passes away.
            </p>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === client.status ? "primary" : "secondary"}
                  disabled={s === client.status}
                  onClick={() => setStatusTarget(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-semibold text-text">Policies &amp; investments</h2>
              <Button size="sm" onClick={() => setProductModal({ mode: "create" })}>
                <Plus className="size-4" /> Add product
              </Button>
            </div>

            {productsQuery.isLoading && <Spinner />}
            {productsQuery.data && productsQuery.data.items.length === 0 && (
              <EmptyState title="No products yet" description="Add this client's first policy or investment." />
            )}

            <ul className="divide-y divide-border">
              {productsQuery.data?.items.map((product, i) => (
                <li
                  key={product.id}
                  className="animate-row-in flex flex-col gap-3 p-4 transition-colors hover:bg-surface-hover sm:p-5"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text">{product.productTypeName}</p>
                        <Badge value={product.status} />
                      </div>
                      <p className="text-xs text-text-muted">
                        {product.organizationName} {product.policyNumber && `· ${product.policyNumber}`}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(product.premiumAmount)} · from {formatDate(product.startDate)}
                        {product.endDate ? ` to ${formatDate(product.endDate)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start sm:self-center">
                      <Button size="sm" variant="secondary" onClick={() => setViewProduct(product)}>
                        <Eye className="size-4" /> View
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setProductModal({ mode: "edit", product })}>
                        <Pencil className="size-4" /> Edit
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm("Remove this product record?")) deleteProductMutation.mutate(product.id);
                          }}
                        >
                          <Trash2 className="size-4" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Status</span>
                    {productStatusFlow.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === product.status ? "primary" : "secondary"}
                        disabled={s === product.status}
                        loading={
                          quickStatusMutation.isPending &&
                          quickStatusMutation.variables?.product.id === product.id &&
                          quickStatusMutation.variables?.status === s
                        }
                        onClick={() => quickStatusMutation.mutate({ product, status: s })}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit client">
        <ClientForm
          initial={client}
          submitLabel="Save changes"
          onCancel={() => setEditOpen(false)}
          onSubmit={(payload) => updateMutation.mutateAsync(payload as UpdateClientRequest)}
        />
      </Modal>

      <Modal open={viewProduct !== null} onClose={() => setViewProduct(null)} title="Product details">
        {viewProduct && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-text">{viewProduct.productTypeName}</p>
              <Badge value={viewProduct.status} />
            </div>
            <dl className="space-y-4">
              <Detail icon={Building2} label="Organization" value={viewProduct.organizationName} />
              <Detail icon={Tag} label="Category" value={viewProduct.productCategory} />
              <Detail icon={Hash} label="Policy / account number" value={viewProduct.policyNumber} />
              <Detail icon={Banknote} label="Premium / contribution" value={formatCurrency(viewProduct.premiumAmount)} />
              <Detail icon={CalendarDays} label="Start date" value={formatDate(viewProduct.startDate)} />
              <Detail icon={CalendarDays} label="End date" value={viewProduct.endDate ? formatDate(viewProduct.endDate) : undefined} />
              {viewProduct.notes && <Detail icon={StickyNote} label="Notes" value={viewProduct.notes} />}
              <Detail icon={CalendarDays} label="Added" value={formatDate(viewProduct.createdAt)} />
              <Detail icon={CalendarDays} label="Last updated" value={viewProduct.updatedAt ? formatDate(viewProduct.updatedAt) : undefined} />
            </dl>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setViewProduct(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setProductModal({ mode: "edit", product: viewProduct });
                  setViewProduct(null);
                }}
              >
                <Pencil className="size-4" /> Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ReasonModal
        open={statusTarget !== null}
        title={`Change status to ${statusTarget}`}
        description="Changing status keeps all policy/investment history intact."
        confirmLabel="Change status"
        variant={statusTarget === "Deceased" ? "danger" : "primary"}
        onCancel={() => setStatusTarget(null)}
        onConfirm={(reason) => statusMutation.mutateAsync({ status: statusTarget!, reason })}
      />

      <Modal
        open={productModal !== null}
        onClose={() => setProductModal(null)}
        title={productModal?.mode === "edit" ? "Edit product" : "Add product"}
      >
        {productModal && (
          <ClientProductForm
            clientId={clientId}
            initial={productModal.mode === "edit" ? productModal.product : undefined}
            onCancel={() => setProductModal(null)}
            onSubmit={async (payload) => {
              if (productModal.mode === "edit") {
                await updateProductMutation.mutateAsync({ id: productModal.product.id, payload: payload as UpdateClientProductRequest });
              } else {
                await createProductMutation.mutateAsync(payload as CreateClientProductRequest);
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-text-muted">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-text-faint">{label}</dt>
        <dd className="mt-0.5 whitespace-pre-line break-words text-sm text-text">{value || "—"}</dd>
      </div>
    </div>
  );
}
