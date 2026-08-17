import { useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "../../lib/api";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { ApiError } from "../../lib/api";
import type { CreateProductTypeRequest, ProductCategory, ProductTypeDto, UpdateProductTypeRequest } from "../../lib/types";

const categories: ProductCategory[] = ["Policy", "Investment", "MedicalAid"];

export function ProductTypeForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: ProductTypeDto;
  onSubmit: (payload: CreateProductTypeRequest | UpdateProductTypeRequest) => Promise<unknown>;
  onCancel: () => void;
}) {
  const orgsQuery = useQuery({ queryKey: ["organizations", "all"], queryFn: () => organizationsApi.list({ pageSize: 200 }) });

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ProductCategory>(initial?.category ?? "Policy");
  const [organizationId, setOrganizationId] = useState<number | "">(initial?.organizationId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!organizationId) {
      setError("Please select an organization.");
      return;
    }
    setSubmitting(true);
    try {
      const base = { name, category, organizationId: Number(organizationId), description: description || undefined };
      await onSubmit(initial ? { ...base, isActive } : base);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Comprehensive Medical Aid" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Category" required value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select label="Organization" required value={organizationId} onChange={(e) => setOrganizationId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Select…</option>
          {orgsQuery.data?.items.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
      </div>
      <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      {initial && (
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded border-border-strong text-accent accent-accent" />
          Active
        </label>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? "Save changes" : "Create product type"}
        </Button>
      </div>
    </form>
  );
}
