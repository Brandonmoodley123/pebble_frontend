import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { ApiError, organizationsApi, productTypesApi } from "../../lib/api";
import type { CreateClientRequest, InitialClientProduct, UpdateClientRequest } from "../../lib/types";
import { toDateInputValue } from "../../lib/format";

interface ClientFormProps {
  initial?: { [K in keyof CreateClientRequest]?: string | null };
  submitLabel: string;
  onSubmit: (payload: CreateClientRequest | UpdateClientRequest, product?: InitialClientProduct) => Promise<unknown>;
  onCancel: () => void;
}

export function ClientForm({ initial, submitLabel, onSubmit, onCancel }: ClientFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<CreateClientRequest>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    idNumber: initial?.idNumber ?? "",
    email: initial?.email ?? "",
    phoneNumber: initial?.phoneNumber ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    addressLine2: initial?.addressLine2 ?? "",
    city: initial?.city ?? "",
    postalCode: initial?.postalCode ?? "",
    dateOfBirth: toDateInputValue(initial?.dateOfBirth),
    notes: initial?.notes ?? "",
  });
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const orgsQuery = useQuery({
    queryKey: ["organizations", "all"],
    queryFn: () => organizationsApi.list({ pageSize: 200 }),
    enabled: !isEdit,
  });
  const productsQuery = useQuery({
    queryKey: ["product-types", "all"],
    queryFn: () => productTypesApi.list({ pageSize: 200 }),
    enabled: !isEdit,
  });
  const [organizationId, setOrganizationId] = useState<number | "">("");
  const [productTypeId, setProductTypeId] = useState<number | "">("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [premiumAmount, setPremiumAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const productTypesForOrg = useMemo(
    () => (productsQuery.data?.items ?? []).filter((p) => !organizationId || p.organizationId === organizationId),
    [productsQuery.data, organizationId]
  );

  const update = (patch: Partial<CreateClientRequest>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!isEdit && (!organizationId || !productTypeId)) {
      setError("Please select an organization and a product type for this client's first product.");
      return;
    }
    setSubmitting(true);
    try {
      const base: CreateClientRequest = {
        ...form,
        email: form.email || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      };
      const payload: CreateClientRequest | UpdateClientRequest = isEdit ? { ...base, reason } : base;
      const product: InitialClientProduct | undefined = isEdit
        ? undefined
        : {
            organizationId: Number(organizationId),
            productTypeId: Number(productTypeId),
            policyNumber: policyNumber || undefined,
            premiumAmount: premiumAmount ? Number(premiumAmount) : undefined,
            startDate,
          };
      await onSubmit(payload, product);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (name: string) => fieldErrors[name]?.[0] ?? fieldErrors[name.replace(/^\w/, (c) => c.toUpperCase())]?.[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="First name" required value={form.firstName} onChange={(e) => update({ firstName: e.target.value })} error={fieldError("FirstName")} />
        <Input label="Last name" required value={form.lastName} onChange={(e) => update({ lastName: e.target.value })} error={fieldError("LastName")} />
      </div>
      <Input
        label="ID number"
        required
        value={form.idNumber}
        onChange={(e) => update({ idNumber: e.target.value })}
        error={fieldError("IdNumber")}
        hint="South African ID or passport number"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Email" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} error={fieldError("Email")} />
        <Input label="Phone number" value={form.phoneNumber} onChange={(e) => update({ phoneNumber: e.target.value })} />
      </div>
      <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => update({ dateOfBirth: e.target.value })} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Address line 1" value={form.addressLine1} onChange={(e) => update({ addressLine1: e.target.value })} />
        <Input label="Address line 2" value={form.addressLine2} onChange={(e) => update({ addressLine2: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="City" value={form.city} onChange={(e) => update({ city: e.target.value })} />
        <Input label="Postal code" value={form.postalCode} onChange={(e) => update({ postalCode: e.target.value })} />
      </div>
      <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => update({ notes: e.target.value })} />

      {!isEdit && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <h3 className="text-sm font-medium text-text">Initial product</h3>
            <p className="text-xs text-text-faint">Every client must be linked to an organization and product type.</p>
          </div>
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
          <Input label="Start date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
      )}

      {isEdit && (
        <Textarea
          label="Reason for this change"
          required
          minLength={3}
          rows={2}
          placeholder="e.g. Client updated their contact details"
          hint="Recorded in the audit log."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={fieldError("Reason")}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
