"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody } from "@/components/ui/Card";

import { last7Alerts, movements7d, productInventory } from "./overview/mock";
import { StockAlerts } from "./overview/StockAlerts";
import { StockMovementsChart } from "./overview/StockMovementsChart";
import { ProductInventoryTable } from "./overview/ProductInventoryTable";

export default function StockOverviewPage() {
  return (
    <div className="space-y-6">
      <Topbar title="Stock Overview" subtitle="Inventory health and movements" />

      {/* KPI row (keep yours if already exists) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardBody><div className="text-xs text-slate-500 dark:text-slate-400">Total SKUs</div><div className="mt-2 text-2xl font-bold">1,248</div><div className="mt-1 text-xs text-emerald-500">+24 this month</div></CardBody></Card>
        <Card><CardBody><div className="text-xs text-slate-500 dark:text-slate-400">Stock Value</div><div className="mt-2 text-2xl font-bold">184K</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-400">TND</div></CardBody></Card>
        <Card><CardBody><div className="text-xs text-slate-500 dark:text-slate-400">Low Stock</div><div className="mt-2 text-2xl font-bold">47</div><div className="mt-1 text-xs text-rose-500">-7 since yesterday</div></CardBody></Card>
        <Card><CardBody><div className="text-xs text-slate-500 dark:text-slate-400">Out of Stock</div><div className="mt-2 text-2xl font-bold">12</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-400">same as last week</div></CardBody></Card>
      </div>

      {/* Main middle area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <ProductInventoryTable rows={productInventory} />
        </div>
        <div className="lg:col-span-3">
          <StockAlerts alerts={last7Alerts} />
        </div>
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <StockMovementsChart data={movements7d} />
        </div>
        <div className="lg:col-span-6">
          {/* placeholder for later: Top sellers / Category health */}
          <Card>
            <CardBody>
              <div className="text-sm font-semibold">Category Health</div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Optional next: mini trends per category like the reference screenshot.
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
