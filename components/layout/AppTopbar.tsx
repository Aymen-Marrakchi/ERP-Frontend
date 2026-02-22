"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useEffect, useRef, useState } from "react";

function IconUser() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1 .6 1.2-.2.8 1 .9.8-.2 1.2.6 1 .9.8-.4 1.2.4 1.2-.9.8-.6 1 .2 1.2-.9.8-.8 1-1.2-.2-1 .6-1-.6-1.2.2-.8-1-.9-.8.2-1.2-.6-1-.9-.8.4-1.2-.4-1.2.9-.8.6-1-.2-1.2.9-.8.8-1 1.2.2 1-.6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function AppTopbar() {
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex w-full max-w-xl items-center gap-3">
          <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/50">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search or type command..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-slate-100"
            />
          </div>
        </div>

        <div className="ml-6 flex items-center gap-3">
          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <div className="h-7 w-7 rounded-full bg-slate-400 dark:bg-slate-600" />
              <div className="hidden text-left md:block">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Admin</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Super User</div>
              </div>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className={`h-4 w-4 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
              >
                <button
                  type="button"
                  className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Admin</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">admin@example.com</div>
                  </div>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                </button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">admin@example.com</div>
                  </div>

                  <div className="space-y-1">
                    <button type="button" role="menuitem" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800">
                      <span className="text-slate-400"><IconUser /></span>
                      Edit profile
                    </button>
                    <button type="button" role="menuitem" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800">
                      <span className="text-slate-400"><IconSettings /></span>
                      Account settings
                    </button>
                    <button type="button" role="menuitem" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800">
                      <span className="text-slate-400"><IconInfo /></span>
                      Support
                    </button>
                  </div>

                  <div className="my-3 h-px bg-slate-200 dark:bg-slate-800" />

                  <button type="button" role="menuitem" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800">
                    <span className="text-slate-400"><IconLogout /></span>
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
