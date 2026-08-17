import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";
import { Input } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/Feedback";
import { ThemeToggle } from "../components/layout/ThemeToggle";

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/";
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-svh bg-bg px-4 lg:px-0">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0a0a0c] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#0a0a0c]">P</span>
          <span className="text-lg font-semibold tracking-tight">Pebble</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">Every client, policy and broker relationship — in one place.</p>
          <p className="mt-4 text-sm text-white/50">The admin console for managing your book of business, organizations and product types.</p>
        </div>
        <p className="relative text-xs text-white/30">© {new Date().getFullYear()} Pebble Brokers</p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col items-center justify-center px-4 lg:w-1/2">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-3 flex justify-center">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-contrast">P</span>
            </div>
            <p className="text-lg font-semibold tracking-tight text-text">Pebble</p>
            <p className="text-sm text-text-faint">Brokers admin console</p>
          </div>

          <div className="mb-6 hidden lg:block">
            <h1 className="text-xl font-semibold tracking-tight text-text">Sign in</h1>
            <p className="mt-1 text-sm text-text-muted">Welcome back — enter your details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:border-0 lg:p-0 lg:shadow-none">
            <h1 className="text-lg font-semibold text-text lg:hidden">Sign in</h1>
            {error && <ErrorBanner message={error} />}
            <Input
              label="Username"
              required
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
            <p className="text-center text-xs text-text-faint">Demo logins: admin / Admin@123 · broker1 / Broker@123</p>  
          </form>
        </div>
      </div>
    </div>
  );
}
