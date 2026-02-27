"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Select } from "@/components/ui/Select";
import { useMemo, useState } from "react";
import type { SupplierInvoice } from "../../store";
import { usePurchases, poTotals } from "../store";

function invoiceTotals(inv: SupplierInvoice) {
  const ht = inv.lines.reduce((a, l) => a + l.qty * l.unitPriceHT, 0);
  const tva = inv.lines.reduce((a, l) => a + l.qty * l.unitPriceHT * l.taxRate, 0);
  return { ht, tva, ttc: ht + tva };
}

export default function PurchasesReportsPage() {
  const { state } = usePurchases();
  const invoicesState = (state as { invoices?: SupplierInvoice[] }).invoices ?? [];

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [metric, setMetric] = useState<"Orders" | "Invoices">("Orders");

  const supplierById = useMemo(
    () => Object.fromEntries(state.suppliers.map((s) => [s.id, s])),
    [state.suppliers]
  );

  const inRange = (date: string) => {
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const kpis = useMemo(() => {
    const orders = state.orders.filter((o) => inRange(o.createdAt));
    const receipts = state.receipts.filter((r) => inRange(r.date));
    const invoices = invoicesState.filter((i) => inRange(i.issueDate));

    const spendOrders = orders.reduce((a, o) => a + poTotals(o).ttc, 0);
    const spendInvoices = invoices.reduce((a, i) => a + invoiceTotals(i).ttc, 0);

    const openOrders = orders.filter((o) => o.status !== "Closed").length;
    const partiallyReceived = orders.filter((o) => o.status === "Partially Received").length;

    const overdueSupplierInvoices = invoices.filter((i) => {
      const total = invoiceTotals(i).ttc;
      const dueAmount = Math.max(0, total - (i.totalPaid ?? 0));
      const today = new Date().toISOString().slice(0, 10);
      return i.dueDate < today && dueAmount > 0;
    }).length;

    return {
      ordersCount: orders.length,
      receiptsCount: receipts.length,
      invoicesCount: invoices.length,
      spendOrders,
      spendInvoices,
      openOrders,
      partiallyReceived,
      overdueSupplierInvoices,
    };
  }, [state.orders, state.receipts, invoicesState, from, to]);

  const spendBySupplier = useMemo(() => {
    const map = new Map<string, number>();

    if (metric === "Orders") {
      state.orders
        .filter((o) => inRange(o.createdAt))
        .forEach((o) => {
          map.set(o.supplierId, (map.get(o.supplierId) ?? 0) + poTotals(o).ttc);
        });
    } else {
      invoicesState
        .filter((i) => inRange(i.issueDate))
        .forEach((i) => {
          map.set(i.supplierId, (map.get(i.supplierId) ?? 0) + invoiceTotals(i).ttc);
        });
    }

    return Array.from(map.entries())
      .map(([supplierId, total]) => ({
        supplierId,
        supplier: supplierById[supplierId]?.name ?? "Unknown",
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [state.orders, invoicesState, metric, from, to, supplierById]);

  const ordersByStatus = useMemo(() => {
    const list = state.orders.filter((o) => inRange(o.createdAt));
    const statuses = ["Draft", "Validated", "Sent", "Partially Received", "Received", "Closed"] as const;

    return statuses.map((s) => ({
      status: s,
      count: list.filter((o) => o.status === s).length,
    }));
  }, [state.orders, from, to]);

  return (
    <div className="space-y-6">
      <Topbar
        title="Purchases Reports"
        subtitle="KPIs and purchasing insights (PFE scope)"
        right={<Button variant="secondary">Export</Button>}
      />

      <Card>
        <CardHeader title="Filters" subtitle="Select period and measure" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Select value={metric} onChange={(e) => setMetric(e.target.value as any)}>
              <option value="Orders">Spend from Orders</option>
              <option value="Invoices">Spend from Invoices</option>
            </Select>
            <Button variant="secondary">Generate</Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Orders</div><div className="mt-2 text-2xl font-bold">{kpis.ordersCount}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Receipts</div><div className="mt-2 text-2xl font-bold">{kpis.receiptsCount}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Supplier invoices</div><div className="mt-2 text-2xl font-bold">{kpis.invoicesCount}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Overdue supplier invoices</div><div className="mt-2 text-2xl font-bold">{kpis.overdueSupplierInvoices}</div></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Spend by Supplier" subtitle={metric === "Orders" ? "Based on purchase orders" : "Based on supplier invoices"} />
          <CardBody>
            <Table headers={["Supplier", "Total"]}>
              {spendBySupplier.map((r) => (
                <tr key={r.supplierId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{r.supplier}</td>
                  <td className="px-4 py-3">{r.total.toLocaleString()}</td>
                </tr>
              ))}
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Orders by Status" subtitle="Operational overview" />
          <CardBody>
            <Table headers={["Status", "Count"]}>
              {ordersByStatus.map((r) => (
                <tr key={r.status} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{r.status}</td>
                  <td className="px-4 py-3">{r.count}</td>
                </tr>
              ))}
            </Table>

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              More advanced KPIs (delivery lead time, conformity rate) can be computed after backend integration.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

