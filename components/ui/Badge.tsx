import React from "react";

const styles = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  danger: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  neutral: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: keyof typeof styles;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
