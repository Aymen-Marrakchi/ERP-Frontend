"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { useMemo, useState } from "react";
import { useFinance } from "../store";

export default function FinanceReportsPage() {
  const { state } = useFinance();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const tx = useMemo(() => {
    return state.transactions.filter((t) => {
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return t.status === "Posted";
    });
  }, [state.transactions, from, to]);

  const report = useMemo(() => {
    const revenue = tx.filter((t) => t.type === "Income").reduce((a, t) => a + t.amount, 0);
    const expenses = tx.filter((t) => t.type === "Expense").reduce((a, t) => a + t.amount, 0);
    const net = revenue - expenses;

    // Simple Balance Sheet model for PFE:
    const cash = net;
    const assets = cash; // assume only cash for now
    const liabilities = 0;
    const equity = assets - liabilities;

    return { revenue, expenses, net, assets, liabilities, equity, cash };
  }, [tx]);

  return (
    <div className="space-y-6">
      <Topbar title="Reports" subtitle="P&L and Balance Sheet (simple PFE model) with export options" />

      <Card>
        <CardHeader
          title="Report Filters"
          subtitle="Select a period and generate"
          right={<Button variant="secondary">Export PDF/Excel</Button>}
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button variant="secondary">Generate</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Profit & Loss (P&L)" subtitle="Revenue - Expenses = Net profit" />
        <CardBody>
          <Table headers={["Line", "Amount"]}>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Revenue</td>
              <td className="px-4 py-3">{report.revenue.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Expenses</td>
              <td className="px-4 py-3">{report.expenses.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Net Profit</td>
              <td className="px-4 py-3 font-semibold">{report.net.toLocaleString()}</td>
            </tr>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Balance Sheet" subtitle="Assets / Liabilities / Equity (simple)" />
        <CardBody>
          <Table headers={["Section", "Amount"]}>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Assets</td>
              <td className="px-4 py-3">{report.assets.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Liabilities</td>
              <td className="px-4 py-3">{report.liabilities.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Equity</td>
              <td className="px-4 py-3">{report.equity.toLocaleString()}</td>
            </tr>
          </Table>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            This is a simplified model suitable for PFE scope; it can be extended with accounts, liabilities and VAT later.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="General Ledger (UI)" subtitle="Posted transactions for the selected period" right={<Button variant="secondary">Export Ledger</Button>} />
        <CardBody>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {tx.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">{t.date}</td>
                    <td className="px-4 py-3">{t.type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.category}</td>
                    <td className="px-4 py-3">{t.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
