import { useState } from "react";
import { Modal } from "./Modal";
import { Textarea } from "./Field";
import { Button } from "./Button";
import { ErrorBanner } from "./Feedback";
import { ApiError } from "../../lib/api";

interface ReasonModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<unknown>;
}

export function ReasonModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  onCancel,
  onConfirm,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setReason("");
    setError(null);
    onCancel();
  };

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-4">
        {description && <p className="text-sm text-text-muted">{description}</p>}
        {error && <ErrorBanner message={error} />}
        <Textarea
          label="Reason"
          required
          minLength={3}
          rows={3}
          autoFocus
          placeholder="Why are you making this change?"
          hint="Recorded in the audit log."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant={variant} loading={submitting} disabled={reason.trim().length < 3} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
