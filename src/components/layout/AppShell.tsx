import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  UserCog,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../../lib/auth-context";
import { Avatar } from "../ui/Avatar";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clients", label: "Clients", icon: UsersIcon },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/product-types", label: "Product Types", icon: Package },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/users", label: "Users", icon: UserCog, adminOnly: true },
  { to: "/audit-logs", label: "Audit Logs", icon: History, adminOnly: true },
];

const SIDEBAR_COLLAPSE_KEY = "pebble-sidebar-collapsed";

function NavLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems
        .filter((item) => !item.adminOnly || isAdmin)
        .map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive ? "bg-accent text-accent-contrast" : "text-text-muted hover:bg-surface-hover hover:text-text"
              )
            }
          >
            <item.icon className="size-4.5 shrink-0" />
            {!collapsed && item.label}
          </NavLink>
        ))}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-surface-hover"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar firstName={user?.firstName ?? ""} lastName={user?.lastName ?? ""} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block max-w-32 truncate text-sm font-medium text-text">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="block text-xs text-text-faint">{user?.role}</span>
        </span>
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-text">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-text-faint">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  return (
    <div className="flex min-h-svh bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-surface py-5 transition-[width] duration-150 lg:flex",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
      >
        <div className={clsx("mb-6 flex items-center gap-2", collapsed ? "justify-center px-0" : "px-6")}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-contrast">
            P
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-text">Pebble</p>
              <p className="truncate text-xs text-text-faint">Brokers admin</p>
            </div>
          )}
        </div>

        <NavLinks collapsed={collapsed} />

        <div className={clsx("mt-auto pt-4", collapsed ? "px-2" : "px-3")}>
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={clsx(
              "flex w-full items-center gap-2 rounded-lg py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text",
              collapsed ? "justify-center" : "px-3"
            )}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="animate-drawer-in relative z-10 flex h-full w-72 max-w-[80svw] flex-col border-r border-border bg-surface py-5">
            <div className="mb-6 flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-contrast">
                  P
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-text">Pebble</p>
                  <p className="text-xs text-text-faint">Brokers admin</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-text-muted" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/70 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-text-muted hover:text-text lg:hidden" aria-label="Open menu">
            <Menu className="size-6" />
          </button>

          <div className="min-w-0 flex-1">
            <GlobalSearch />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
