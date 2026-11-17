import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingInitialAuth, setCheckingInitialAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || "/admin";

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated && isMounted) {
            navigate(redirectPath, { replace: true });
            return;
          }
        }
      } catch {
        // Not authenticated
      } finally {
        if (isMounted) {
          setCheckingInitialAuth(false);
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate, redirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem("admin_token", data.token);
        }
        navigate(redirectPath, { replace: true });
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingInitialAuth) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0d0d0f] text-white">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-semibold text-stone-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center bg-[#0d0d0f] px-4 py-8 text-white">
      <div className="w-full max-w-sm bg-[#141417] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            <img src="/favicon-circle.png" alt="Prime Cuts" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-white tracking-tight">Prime Cuts POS</h1>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-stone-400">Staff & Operations Console</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Access Passcode
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 text-white text-sm pl-9 pr-3 bg-[#0d0d0f] border border-white/15 rounded-lg focus:outline-none focus:border-primary font-medium placeholder:text-stone-600"
                placeholder="Enter admin password"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to Workspace</span>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
