import Link from "next/link";

const nav = [
  { section: "Stock", items: [
    { label: "Overview", href: "/stock" },
    { label: "Products", href: "/stock/products" },
    { label: "Movements", href: "/stock/movements" },
    { label: "Alerts", href: "/stock/alerts" },
    { label: "Inventory", href: "/stock/inventory" },
  ]},
  { section: "Sales", items: [
    { label: "Orders", href: "/sales/orders" },
    { label: "Preparation", href: "/sales/preparation" },
    { label: "Shipments", href: "/sales/shipments" },
    { label: "Planning", href: "/sales/planning" },
    { label: "Returns (RMA)", href: "/sales/returns" },
  ]},
  { section: "Finance", items: [
    { label: "Dashboard", href: "/finance" },
    { label: "Invoices", href: "/finance/invoices" },
    { label: "Payments", href: "/finance/payments" },
    { label: "Transactions", href: "/finance/transactions" },
    { label: "Reports", href: "/finance/reports" },
  ]},
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[280px] shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
      <div className="px-6 py-5">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">ERP Dashboard</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Stock - Sales - Finance</div>
      </div>

      <div className="space-y-6 px-4 pb-6">
        {nav.map((s) => (
          <div key={s.section}>
            <div className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {s.section}
            </div>
            <div className="mt-2 space-y-1">
              {s.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
