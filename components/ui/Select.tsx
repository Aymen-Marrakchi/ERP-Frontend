import React from "react";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 " +
        "focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 " +
        (className ?? "")
      }
    />
  );
}
