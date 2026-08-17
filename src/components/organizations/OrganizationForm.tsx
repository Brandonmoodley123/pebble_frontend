import { useState } from "react";
import type { FormEvent } from "react";
import { Input, Select } from "../ui/Field";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { ApiError } from "../../lib/api";
import type { CreateOrganizationRequest, OrganizationDto, OrganizationType, UpdateOrganizationRequest } from "../../lib/types";

const orgTypes: OrganizationType[] = ["Insurer", "MedicalAid", "InvestmentHouse", "Other"];

export function OrganizationForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: OrganizationDto;
  onSubmit: (payload: CreateOrganizationRequest | UpdateOrganizationRequest) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<OrganizationType>(initial?.type ?? "Insurer");
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const base = { name, type, contactEmail: contactEmail || undefined, contactPhone: contactPhone || undefined };
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
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Select label="Type" required value={type} onChange={(e) => setType(e.target.value as OrganizationType)}>
        {orgTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Contact email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        <Input label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
      </div>
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
          {initial ? "Save changes" : "Create organization"}
        </Button>
      </div>
    </form>
  );
}
