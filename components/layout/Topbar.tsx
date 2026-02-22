export function Topbar({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="text-2xl font-bold">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
      </div>
      <div className="flex items-center gap-2">
        {right}
      </div>
    </div>
  );
}
