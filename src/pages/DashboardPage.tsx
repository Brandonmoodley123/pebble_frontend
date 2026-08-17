import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, History, Package, ShieldCheck, StickyNote, UserCheck, Users as UsersIcon } from "lucide-react";
import { auditLogsApi, clientProductsApi, clientsApi, organizationsApi, productTypesApi } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { Spinner, ErrorBanner } from "../components/ui/Feedback";
import { Badge } from "../components/ui/Badge";
import { describeAuditAction, formatDateTime } from "../lib/format";

async function loadDashboardStats() {
  const [clients, activeClients, organizations, productTypes, activePolicies] = await Promise.all([
    clientsApi.list({ page: 1, pageSize: 1 }),
    clientsApi.list({ page: 1, pageSize: 1, status: "Active" }),
    organizationsApi.list({ page: 1, pageSize: 1 }),
    productTypesApi.list({ page: 1, pageSize: 1 }),
    clientProductsApi.list({ page: 1, pageSize: 1, status: "Active" }),
  ]);

  return {
    totalClients: clients.totalCount,
    activeClients: activeClients.totalCount,
    organizations: organizations.totalCount,
    productTypes: productTypes.totalCount,
    activePolicies: activePolicies.totalCount,
  };
}

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: loadDashboardStats });
  const auditQuery = useQuery({
    queryKey: ["dashboard-recent-audit"],
    queryFn: () => auditLogsApi.list({ page: 1, pageSize: 6 }),
    enabled: isAdmin,
  });
  const clientNotesQuery = useQuery({
    queryKey: ["dashboard-client-notes"],
    queryFn: () => clientsApi.list({ page: 1, pageSize: 100, status: "Active" }),
  });

  const stats = statsQuery.data;
  const clientsWithNotes = (clientNotesQuery.data?.items ?? []).filter((c) => c.notes && c.notes.trim().length > 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`${greeting}, ${user?.firstName ?? ""}`}
        description="Here's what's happening across the book of business."
      />

      {clientsWithNotes.length > 0 && (
        <div className="mb-6 space-y-2">
          {clientsWithNotes.map((c) => (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-500/15 dark:text-amber-300"
            >
              <StickyNote className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {c.firstName} {c.lastName}
                </p>
                <p className="mt-0.5 truncate">{c.notes}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {statsQuery.isLoading && <Spinner label="Loading dashboard…" />}
      {statsQuery.isError && <ErrorBanner message="Could not load dashboard stats." />}

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={UsersIcon} label="Total clients" value={stats.totalClients} to="/clients" />
          <StatCard icon={UserCheck} label="Active clients" value={stats.activeClients} to="/clients?status=Active" />
          <StatCard icon={Building2} label="Organizations" value={stats.organizations} to="/organizations" />
          <StatCard icon={Package} label="Product types" value={stats.productTypes} to="/product-types" />
          <StatCard icon={ShieldCheck} label="Active policies" value={stats.activePolicies} />
        </div>
      )}

      {isAdmin && (
        <Card className="mt-8">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <History className="size-4 text-text-faint" />
              <h2 className="text-sm font-semibold text-text">Recent activity</h2>
            </div>
            <Link to="/audit-logs" className="text-xs font-medium text-text-muted hover:text-text hover:underline">
              View all
            </Link>
          </div>
          {auditQuery.isLoading && <Spinner />}
          {auditQuery.data && (
            <ul className="divide-y divide-border">
              {auditQuery.data.items.length === 0 && <li className="px-5 py-4 text-sm text-text-muted">No activity yet.</li>}
              {auditQuery.data.items.map((log) => (
                <li key={log.id} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                  <Badge value={log.action} />
                  <span className="text-text-muted">
                    <span className="font-medium text-text">{log.username ?? "System"}</span> {describeAuditAction(log.action)}{" "}
                    {log.entityName} #{log.entityId}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-text-faint">{formatDateTime(log.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number;
  to?: string;
}) {
  const content = (
    <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:bg-surface-hover">
      <div className="flex size-9 items-center justify-center rounded-lg bg-surface-elevated text-text-muted">
        <Icon className="size-4.5" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-text">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </Card>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}
