"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavModule {
  module: string;
  badge?: string;
  items: (NavItem | NavGroup)[];
}

const nav: NavModule[] = [
  {
    module: "Stock",
    items: [
      { label: "Overview", href: "/stock" },
      { label: "Products", href: "/stock/products" },
      { label: "Movements", href: "/stock/movements" },
      { label: "Alerts", href: "/stock/alerts" },
      { label: "Inventory", href: "/stock/inventory" },
      {
        title: "Purchases",
        items: [
          { label: "Suppliers", href: "/stock/purchases/suppliers" },
          { label: "Purchase Requests", href: "/stock/purchases/requests" },
          { label: "Purchase Orders", href: "/stock/purchases/orders" },
          { label: "Goods Receipts", href: "/stock/purchases/receipts" },
          { label: "Supplier Invoices", href: "/stock/purchases/invoices" },
          { label: "Payments", href: "/stock/purchases/payments" },
          { label: "Reports", href: "/stock/purchases/reports" },
          { label: "Settings", href: "/stock/purchases/settings" },
        ],
      },
    ],
  },
  {
    module: "Sales",
    items: [
      { label: "Orders", href: "/commercial/sales/orders" },
      { label: "Preparation", href: "/commercial/logistics/preparation" },
      { label: "Shipments", href: "/commercial/logistics/shipments" },
      { label: "Planning", href: "/commercial/logistics/planning" },
      { label: "Returns (RMA)", href: "/commercial/sales/returns" },
    ],
  },
  {
    module: "Finance",
    items: [
      { label: "Dashboard", href: "/finance" },
      { label: "Invoices", href: "/finance/invoices" },
      { label: "Payments", href: "/finance/payments" },
      { label: "Transactions", href: "/finance/transactions" },
      { label: "Reports", href: "/finance/reports" },
    ],
  },
];

function isNavItem(item: NavItem | NavGroup): item is NavItem {
  return "href" in item && "label" in item;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  // IMPORTANT: section roots must be exact (so /stock doesn't match /stock/products)
  if (href === "/stock" || href === "/sales" || href === "/finance") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(href + "/");
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span className={["inline-block text-xs transition-transform duration-200", open ? "rotate-180" : "rotate-0"].join(" ")}>
      ▾
    </span>
  );
}

function ModuleIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      ▦
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const defaultOpen = useMemo(() => {
    const map: Record<string, boolean> = {};
    nav.forEach((m) => {
      const anyActive = m.items.some((it) => {
        if (isNavItem(it)) return isActive(pathname, it.href);
        return it.items.some((sub) => isActive(pathname, sub.href));
      });
      map[m.module] = anyActive;
    });
    return map;
  }, [pathname]);

  const [collapsed, setCollapsed] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(defaultOpen);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Purchases: true });

  const toggleModule = (name: string) => setOpenModules((s) => ({ ...s, [name]: !s[name] }));
  const toggleGroup = (name: string) => setOpenGroups((s) => ({ ...s, [name]: !s[name] }));

  return (
    <aside
      className={[
        "hidden md:block h-screen min-h-screen shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950",
        collapsed ? "w-[84px]" : "w-[280px]",
      ].join(" ")}
    >
      {/* Header + Collapse button */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleIcon />
            {!collapsed ? (
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">ERP Dashboard</div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Stock - Sales - Finance</div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-xl px-2 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
      </div>

      <div className={["space-y-2 pb-6", collapsed ? "px-2" : "px-3"].join(" ")}>
        {nav.map((m) => {
          const isOpen = !!openModules[m.module];

          return (
            <div key={m.module} className="rounded-2xl">
              {/* Module header */}
              <button
                type="button"
                onClick={() => toggleModule(m.module)}
                className={[
                  "flex w-full items-center justify-between rounded-2xl py-2 hover:bg-slate-100 dark:hover:bg-slate-800",
                  collapsed ? "px-2" : "px-3",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <ModuleIcon />
                  {!collapsed ? <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{m.module}</span> : null}
                </div>
                {!collapsed ? <Chevron open={isOpen} /> : null}
              </button>

              {/* Module items */}
              {isOpen && !collapsed ? (
                <div className="mt-1 space-y-1 pb-2">
                  {m.items.map((item) => {
                    if (isNavItem(item)) {
                      const active = isActive(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={[
                            "block rounded-xl px-3 py-2 pl-6 text-[13px] font-medium",
                            active
                              ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                          ].join(" ")}
                        >
                          {item.label}
                        </Link>
                      );
                    }

                    const gOpen = !!openGroups[item.title];

                    return (
                      <div key={item.title} className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.title)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 pl-6 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{item.title}</span>
                          <Chevron open={gOpen} />
                        </button>

                        {gOpen ? (
                          <div className="mt-1 space-y-1">
                            {item.items.map((sub) => {
                              const active = isActive(pathname, sub.href);

                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={[
                                    "block rounded-xl px-3 py-2 pl-10 text-[12px] font-medium",
                                    active
                                      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                                  ].join(" ")}
                                >
                                  {sub.label}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

