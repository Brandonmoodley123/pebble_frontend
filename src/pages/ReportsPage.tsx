import { useQuery } from "@tanstack/react-query";
import { Banknote, ShieldCheck, UserCheck, Users as UsersIcon } from "lucide-react";
import { clientProductsApi, clientsApi } from "../lib/api";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { Spinner, ErrorBanner } from "../components/ui/Feedback";
import { RankedBarList, StatusMixBar, TrendLineChart } from "../components/reports/Charts";
import { formatCurrency } from "../lib/format";
import type { ClientDto, ClientProductDto } from "../lib/types";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function buildMonthlyGrowth(clients: ClientDto[], monthsBack = 6) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    return { key: monthKey(d), label: d.toLocaleDateString("en-ZA", { month: "short" }) };
  });
  const counts = new Map(months.map((m) => [m.key, 0]));
  for (const c of clients) {
    const key = monthKey(new Date(c.createdAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
}

function topGroups(items: ClientProductDto[], keyFn: (p: ClientProductDto) => string, limit = 6) {
  const counts = new Map<string, number>();
  for (const p of items) {
    const key = keyFn(p) || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limit).map(([label, value]) => ({ label, value }));
  const restTotal = sorted.slice(limit).reduce((sum, [, v]) => sum + v, 0);
  return restTotal > 0 ? [...top, { label: "Other", value: restTotal }] : top;
}

async function loadReportsData() {
  const [clients, activeClients, inactiveClients, deceasedClients, allClients, activeProducts] = await Promise.all([
    clientsApi.list({ page: 1, pageSize: 1 }),
    clientsApi.list({ page: 1, pageSize: 1, status: "Active" }),
    clientsApi.list({ page: 1, pageSize: 1, status: "Inactive" }),
    clientsApi.list({ page: 1, pageSize: 1, status: "Deceased" }),
    clientsApi.list({ page: 1, pageSize: 500 }),
    clientProductsApi.list({ page: 1, pageSize: 500, status: "Active" }),
  ]);

  return {
    totalClients: clients.totalCount,
    activeClients: activeClients.totalCount,
    inactiveClients: inactiveClients.totalCount,
    deceasedClients: deceasedClients.totalCount,
    activePolicies: activeProducts.totalCount,
    activePremium: activeProducts.items.reduce((sum, p) => sum + (p.premiumAmount ?? 0), 0),
    growth: buildMonthlyGrowth(allClients.items),
    byOrganization: topGroups(activeProducts.items, (p) => p.organizationName ?? "Unknown"),
    byProductType: topGroups(activeProducts.items, (p) => p.productTypeName ?? "Unknown"),
  };
}

export function ReportsPage() {
  const reportsQuery = useQuery({ queryKey: ["reports-data"], queryFn: loadReportsData });
  const data = reportsQuery.data;

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Reports" description="How the book of business breaks down by client, organization, and product." />

      {reportsQuery.isLoading && <Spinner label="Loading reports…" />}
      {reportsQuery.isError && <ErrorBanner message="Could not load report data." />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Total clients" value={data.totalClients.toLocaleString()} icon={UsersIcon} />
            <StatTile label="Active clients" value={data.activeClients.toLocaleString()} icon={UserCheck} />
            <StatTile label="Active policies" value={data.activePolicies.toLocaleString()} icon={ShieldCheck} />
            <StatTile label="Active premium" value={formatCurrency(data.activePremium)} icon={Banknote} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-text">Client status mix</h2>
              <StatusMixBar
                segments={[
                  { label: "Active", value: data.activeClients, color: "#0ca30c" },
                  { label: "Inactive", value: data.inactiveClients, color: "#fab219" },
                  { label: "Deceased", value: data.deceasedClients, color: "#ec835a" },
                ]}
              />
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-text">New clients, last 6 months</h2>
              <TrendLineChart points={data.growth} />
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-text">Active policies by organization</h2>
              <RankedBarList items={data.byOrganization} />
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-text">Active policies by product type</h2>
              <RankedBarList items={data.byProductType} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Banknote }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-surface-elevated text-text-muted">
        <Icon className="size-4.5" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-text">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </Card>
  );
}
