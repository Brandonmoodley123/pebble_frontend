import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationsApi, productTypesApi } from "../../lib/api";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { ApiError } from "../../lib/api";
import type { ClientProductDto, ClientProductStatus, CreateClientProductRequest, UpdateClientProductRequest } from "../../lib/types";
import { toDateInputValue } from "../../lib/format";

interface ClientProductFormProps {
  clientId: number;
  initial?: ClientProductDto;
  onSubmit: (payload: CreateClientProductRequest | UpdateClientProductRequest) => Promise<unknown>;
  onCancel: () => void;
}

const statusOptions: ClientProductStatus[] = ["Active", "Lapsed", "Cancelled"];

export function ClientProductForm({ clientId, initial, onSubmit, onCancel }: ClientProductFormProps) {
  const orgsQuery = useQuery({ queryKey: ["organizations", "all"], queryFn: () => organizationsApi.list({ pageSize: 200 }) });
  const productsQuery = useQuery({ queryKey: ["product-types", "all"], queryFn: () => productTypesApi.list({ pageSize: 200 }) });

  const [organizationId, setOrganizationId] = useState<number | "">(initial?.organizationId ?? "");
  const [productTypeId, setProductTypeId] = useState<number | "">(initial?.productTypeId ?? "");
  const [policyNumber, setPolicyNumber] = useState(initial?.policyNumber ?? "");
  const [premiumAmount, setPremiumAmount] = useState(initial?.premiumAmount != null ? String(initial.premiumAmount) : "");
  const [startDate, setStartDate] = useState(toDateInputValue(initial?.startDate) || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(toDateInputValue(initial?.endDate));
  const [status, setStatus] = useState<ClientProductStatus>(initial?.status ?? "Active");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const productTypesForOrg = useMemo(
    () => (productsQuery.data?.items ?? []).filter((p) => !organizationId || p.organizationId === organizationId),
    [productsQuery.data, organizationId]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!organizationId || !productTypeId) {
      setError("Please select an organization and a product type.");
      return;
    }
    setSubmitting(true);
    try {
      const base = {
        organizationId: Number(organizationId),
        productTypeId: Number(productTypeId),
        policyNumber: policyNumber || undefined,
        premiumAmount: premiumAmount ? Number(premiumAmount) : undefined,
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
      };
      if (initial) {
        await onSubmit({ ...base, status } satisfies UpdateClientProductRequest);
      } else {
        await onSubmit({ ...base, clientId } satisfies CreateClientProductRequest);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <Select
        label="Organization"
        required
        value={organizationId}
        onChange={(e) => {
          setOrganizationId(e.target.value ? Number(e.target.value) : "");
          setProductTypeId("");
        }}
      >
        <option value="">Select an organization…</option>
        {orgsQuery.data?.items.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.type})
          </option>
        ))}
      </Select>

      <Select
        label="Product type"
        required
        value={productTypeId}
        onChange={(e) => setProductTypeId(e.target.value ? Number(e.target.value) : "")}
        disabled={!organizationId}
      >
        <option value="">{organizationId ? "Select a product type…" : "Select an organization first"}</option>
        {productTypesForOrg.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.category})
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Policy / account number" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
        <Input label="Premium / contribution (R)" type="number" step="0.01" min="0" value={premiumAmount} onChange={(e) => setPremiumAmount(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Start date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {initial && (
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ClientProductStatus)}>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      )}

      <Textarea label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}
