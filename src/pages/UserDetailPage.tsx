import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, KeyRound, Pencil, Plus } from "lucide-react";
import { usersApi } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Modal } from "../components/ui/Modal";
import { ReasonModal } from "../components/ui/ReasonModal";
import { EmptyState, ErrorBanner, Spinner } from "../components/ui/Feedback";
import { EditUserForm } from "../components/users/EditUserForm";
import { ResetPasswordForm } from "../components/users/ResetPasswordForm";
import { AssignOrganizationForm } from "../components/users/AssignOrganizationForm";
import { formatDate, formatDateTime } from "../lib/format";
import type { UpdateUserRequest, UserOrganizationDto } from "../lib/types";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeConfirm, setActiveConfirm] = useState(false);
  const [orgAction, setOrgAction] = useState<{ link: UserOrganizationDto; mode: "deactivate" | "reactivate" } | null>(null);

  const userQuery = useQuery({ queryKey: ["users", userId], queryFn: () => usersApi.get(userId) });
  const orgsQuery = useQuery({ queryKey: ["user-organizations", userId], queryFn: () => usersApi.getOrganizations(userId) });

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ["users", userId] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };
  const invalidateOrgs = () => queryClient.invalidateQueries({ queryKey: ["user-organizations", userId] });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserRequest) => usersApi.update(userId, payload),
    onSuccess: () => {
      invalidateUser();
      setEditOpen(false);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: { newPassword: string; reason: string }) => usersApi.setPassword(userId, payload),
    onSuccess: () => setPasswordOpen(false),
  });

  const activeMutation = useMutation({
    mutationFn: (reason: string) => usersApi.setActive(userId, { isActive: !userQuery.data?.isActive, reason }),
    onSuccess: () => {
      invalidateUser();
      setActiveConfirm(false);
    },
  });

  const assignMutation = useMutation({
    mutationFn: (payload: Parameters<typeof usersApi.assignOrganization>[1]) => usersApi.assignOrganization(userId, payload),
    onSuccess: () => {
      invalidateOrgs();
      setAssignOpen(false);
    },
  });

  const orgActionMutation = useMutation({
    mutationFn: ({ link, mode, reason }: { link: UserOrganizationDto; mode: "deactivate" | "reactivate"; reason: string }) =>
      mode === "deactivate"
        ? usersApi.deactivateOrganization(userId, link.id, { reason })
        : usersApi.reactivateOrganization(userId, link.id, { reason }),
    onSuccess: () => {
      invalidateOrgs();
      setOrgAction(null);
    },
  });

  if (userQuery.isLoading) return <Spinner label="Loading user…" />;
  if (userQuery.isError || !userQuery.data) return <ErrorBanner message="Could not load this user." />;

  const user = userQuery.data;
  const isSelf = user.id === currentUser?.id;
  const orgs = orgsQuery.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-text-faint">
        <Link to="/users" className="inline-flex items-center gap-1 text-text-muted hover:text-text">
          <ArrowLeft className="size-4" /> Users
        </Link>
        <span>/</span>
        <span className="truncate text-text-muted">
          {user.firstName} {user.lastName}
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar firstName={user.firstName} lastName={user.lastName} size="md" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
                {user.firstName} {user.lastName}
              </h1>
              <Badge value={user.role} />
              <Badge value={user.isActive ? "Active" : "Inactive"} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {user.username} · Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
            <KeyRound className="size-4" /> Reset password
          </Button>
          <Button
            variant={user.isActive ? "danger" : "primary"}
            disabled={isSelf}
            onClick={() => setActiveConfirm(true)}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {isSelf && <p className="mb-6 text-xs text-text-muted">You can't deactivate your own account.</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="border-b border-border px-5 py-4 text-sm font-semibold text-text">Account details</h2>
            <dl className="divide-y divide-border px-5">
              <Detail label="Username" value={user.username} />
              <Detail label="Email" value={user.email} />
              <Detail label="Role" value={user.role} />
              <Detail label="Status" value={user.isActive ? "Active" : "Inactive"} />
              <Detail label="Joined" value={formatDate(user.createdAt)} />
            </dl>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="text-sm font-semibold text-text">Organization access</h2>
                <p className="mt-0.5 text-xs text-text-muted">Which organizations this broker can place business with.</p>
              </div>
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                <Plus className="size-4" /> Assign
              </Button>
            </div>

            {orgsQuery.isLoading && <Spinner />}
            {orgs.length === 0 && !orgsQuery.isLoading && (
              <EmptyState title="No organizations assigned" description="Assign an organization to let this broker place business with it." />
            )}

            <ul className="divide-y divide-border">
              {orgs.map((link) => (
                <li key={link.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text">{link.organizationName}</p>
                      <Badge value={link.isActive ? "Active" : "Inactive"} />
                    </div>
                    <p className="text-xs text-text-muted">{link.productTypeName ?? "All product types"}</p>
                    <p className="mt-1 text-xs text-text-faint">
                      Assigned {formatDateTime(link.assignedAt)}
                      {link.assignedByUsername ? ` by ${link.assignedByUsername}` : ""}
                      {link.assignedReason ? ` — "${link.assignedReason}"` : ""}
                    </p>
                    {!link.isActive && link.deactivatedAt && (
                      <p className="mt-1 text-xs text-text-faint">
                        Deactivated {formatDateTime(link.deactivatedAt)}
                        {link.deactivatedByUsername ? ` by ${link.deactivatedByUsername}` : ""}
                        {link.deactivationReason ? ` — "${link.deactivationReason}"` : ""}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="self-start"
                    onClick={() => setOrgAction({ link, mode: link.isActive ? "deactivate" : "reactivate" })}
                  >
                    {link.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit user">
        <EditUserForm user={user} onCancel={() => setEditOpen(false)} onSubmit={(payload) => updateMutation.mutateAsync(payload)} />
      </Modal>

      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Reset password">
        <ResetPasswordForm onCancel={() => setPasswordOpen(false)} onSubmit={(payload) => passwordMutation.mutateAsync(payload)} />
      </Modal>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign organization">
        <AssignOrganizationForm onCancel={() => setAssignOpen(false)} onSubmit={(payload) => assignMutation.mutateAsync(payload)} />
      </Modal>

      <ReasonModal
        open={activeConfirm}
        title={user.isActive ? `Deactivate ${user.firstName}?` : `Activate ${user.firstName}?`}
        description={
          user.isActive ? "They will immediately lose the ability to log in." : "They will regain the ability to log in."
        }
        confirmLabel={user.isActive ? "Deactivate" : "Activate"}
        variant={user.isActive ? "danger" : "primary"}
        onCancel={() => setActiveConfirm(false)}
        onConfirm={(reason) => activeMutation.mutateAsync(reason)}
      />

      <ReasonModal
        open={orgAction !== null}
        title={orgAction?.mode === "deactivate" ? `Remove access to ${orgAction.link.organizationName}?` : `Restore access to ${orgAction?.link.organizationName}?`}
        confirmLabel={orgAction?.mode === "deactivate" ? "Deactivate" : "Reactivate"}
        variant={orgAction?.mode === "deactivate" ? "danger" : "primary"}
        onCancel={() => setOrgAction(null)}
        onConfirm={(reason) => orgActionMutation.mutateAsync({ link: orgAction!.link, mode: orgAction!.mode, reason })}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-text-faint">{label}</dt>
      <dd className="mt-1 break-words text-sm text-text">{value || "—"}</dd>
    </div>
  );
}
