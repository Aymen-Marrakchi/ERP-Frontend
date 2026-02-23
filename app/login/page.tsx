"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  // UI-only submit (for now)
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // later: call your backend auth endpoint
    setTimeout(() => setLoading(false), 800);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Left - Brand / info */}
        <div className="hidden border-r border-slate-200 p-10 dark:border-slate-800 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                ERP
              </div>
              <div>
                <div className="text-lg font-semibold">ERP Dashboard</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Stock • Sales • Finance
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="text-3xl font-bold leading-tight">
                Sign in to continue
              </div>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Access is restricted. Accounts are created by the administrator only.
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} ERP PFE — Internal access
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                  ERP
                </div>
                <div>
                  <div className="text-base font-semibold">ERP Dashboard</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Stock • Sales • Finance
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xl font-bold">Login</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter your credentials to access the ERP.
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    <input
                      type={show ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" className="h-4 w-4" />
                    Remember me
                  </label>

                  {/* No signup link */}
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-slate-700 hover:underline dark:text-slate-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  No self-registration. Contact the administrator if you need access.
                </div>
              </form>
            </div>

            <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              By signing in, you agree to internal usage rules.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
