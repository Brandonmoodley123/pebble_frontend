import { useState } from "react";
import type { FormEvent } from "react";
import { Input, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { ApiError } from "../../lib/api";
import type { SetUserPasswordRequest } from "../../lib/types";

export function ResetPasswordForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: SetUserPasswordRequest) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldError = (name: string) => fieldErrors[name]?.[0] ?? fieldErrors[name.replace(/^\w/, (c) => c.toUpperCase())]?.[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ newPassword, reason });
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
      <Input
        label="New password"
        type="password"
        required
        minLength={8}
        hint="At least 8 characters"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={fieldError("NewPassword")}
      />
      <Input
        label="Confirm new password"
        type="password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Textarea
        label="Reason"
        required
        minLength={3}
        rows={2}
        placeholder="e.g. User forgot their password"
        hint="Recorded in the audit log. The new password itself is never logged."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={fieldError("Reason")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Reset password
        </Button>
      </div>
    </form>
  );
}
