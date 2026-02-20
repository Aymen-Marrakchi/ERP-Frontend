import React from "react";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const cls =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : variant === "secondary"
      ? "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${cls} ${className ?? ""}`}
    />
  );
}
