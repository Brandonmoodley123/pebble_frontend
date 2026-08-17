import { useState } from "react";
import type { FormEvent } from "react";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { ApiError } from "../../lib/api";
import type { Role, UpdateUserRequest, UserDto } from "../../lib/types";

export function EditUserForm({
  user,
  onSubmit,
  onCancel,
}: {
  user: UserDto;
  onSubmit: (payload: UpdateUserRequest) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [role, setRole] = useState<Role>(user.role);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldError = (name: string) => fieldErrors[name]?.[0] ?? fieldErrors[name.replace(/^\w/, (c) => c.toUpperCase())]?.[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit({ email, firstName, lastName, role, reason });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="First name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} error={fieldError("FirstName")} />
        <Input label="Last name" required value={lastName} onChange={(e) => setLastName(e.target.value)} error={fieldError("LastName")} />
      </div>
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError("Email")} />
      <Select label="Role" required value={role} onChange={(e) => setRole(e.target.value as Role)} error={fieldError("Role")}>
        <option value="Broker">Broker</option>
        <option value="Admin">Admin</option>
      </Select>
      <Textarea
        label="Reason for this change"
        required
        minLength={3}
        rows={2}
        placeholder="e.g. Promoted to admin"
        hint="Recorded in the audit log."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={fieldError("Reason")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
