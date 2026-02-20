"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMemo } from "react";
import { financeHelpers, useFinance } from "./store";

export default function FinanceDashboard() {
  const { state } = useFinance();

  const kpis = useMemo(() => {
    const totalRevenue = state.transactions
      .filter((t) => t.type === "Income" && t.status === "Posted")
      .reduce((a, t) => a + t.amount, 0);

    const totalExpense = state.transactions
      .filter((t) => t.type === "Expense" && t.status === "Posted")
      .reduce((a, t) => a + t.amount, 0);

    const unpaid = state.invoices.filter((i) => i.status !== "Paid").length;

    // Cash balance: revenue - expenses (simple PFE model)
    const cash = totalRevenue - totalExpense;

    return { totalRevenue, totalExpense, unpaid, cash };
  }, [state.transactions, state.invoices]);

  return (
    <div className="space-y-6">
      <Topbar title="Finance Dashboard" subtitle="Revenues, expenses, invoices and reporting" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Revenue (posted)</div><div className="mt-2 text-2xl font-bold">{kpis.totalRevenue.toLocaleString()}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Expenses (posted)</div><div className="mt-2 text-2xl font-bold">{kpis.totalExpense.toLocaleString()}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Cash Balance</div><div className="mt-2 text-2xl font-bold">{kpis.cash.toLocaleString()}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Unpaid Invoices</div><div className="mt-2 text-2xl font-bold">{kpis.unpaid}</div></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Quick Actions" subtitle="Invoices, payments, transactions and reports" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Button variant="secondary">Open Invoices</Button>
            <Button variant="secondary">Record Payment</Button>
            <Button variant="secondary">Transactions</Button>
            <Button variant="secondary">Reports</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
