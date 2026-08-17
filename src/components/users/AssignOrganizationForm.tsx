import { useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationsApi, productTypesApi } from "../../lib/api";
import { Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { ApiError } from "../../lib/api";
import type { AssignUserOrganizationRequest } from "../../lib/types";

export function AssignOrganizationForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: AssignUserOrganizationRequest) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [organizationId, setOrganizationId] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const organizationsQuery = useQuery({ queryKey: ["organizations", "all"], queryFn: () => organizationsApi.list({ pageSize: 100 }) });
  const productTypesQuery = useQuery({
    queryKey: ["product-types", { organizationId }],
    queryFn: () => productTypesApi.list({ organizationId: Number(organizationId), pageSize: 100 }),
    enabled: !!organizationId,
  });

  const fieldError = (name: string) => fieldErrors[name]?.[0] ?? fieldErrors[name.replace(/^\w/, (c) => c.toUpperCase())]?.[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit({
        organizationId: Number(organizationId),
        productTypeId: productTypeId ? Number(productTypeId) : undefined,
        reason,
      });
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

  const activeOrgs = organizationsQuery.data?.items.filter((o) => o.isActive) ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <Select
        label="Organization"
        required
        value={organizationId}
        onChange={(e) => {
          setOrganizationId(e.target.value);
          setProductTypeId("");
        }}
        error={fieldError("OrganizationId")}
      >
        <option value="" disabled>
          {organizationsQuery.isLoading ? "Loading organizations…" : "Select an organization"}
        </option>
        {activeOrgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
      <Select
        label="Product type"
        value={productTypeId}
        onChange={(e) => setProductTypeId(e.target.value)}
        disabled={!organizationId}
        hint="Leave blank to assign across all product types for this organization."
      >
        <option value="">All product types</option>
        {productTypesQuery.data?.items.filter((p) => p.isActive).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <Textarea
        label="Reason"
        required
        minLength={3}
        rows={2}
        placeholder="e.g. Broker now placing business with this insurer"
        hint="Recorded in the audit log."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={fieldError("Reason")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} disabled={!organizationId}>
          Assign
        </Button>
      </div>
    </form>
  );
}
