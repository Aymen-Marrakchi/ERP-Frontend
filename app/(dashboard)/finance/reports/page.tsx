"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useMemo, useState } from "react";
import { useFinance } from "../store";

type PeriodPreset = "1M" | "3M" | "CUSTOM";

function startOfTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonthsISO(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function money(n: number) {
  return n.toLocaleString();
}

export default function FinanceReportsPage() {
  const { state } = useFinance();

  const [preset, setPreset] = useState<PeriodPreset>("1M");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Apply preset to dates
  const applyPreset = (p: PeriodPreset) => {
    const today = startOfTodayISO();
    if (p === "1M") {
      setTo(today);
      setFrom(addMonthsISO(today, -1));
      return;
    }
    if (p === "3M") {
      setTo(today);
      setFrom(addMonthsISO(today, -3));
      return;
    }
    // CUSTOM: do not overwrite; user chooses
  };

  // Posted transactions in period
  const tx = useMemo(() => {
    return state.transactions
      .filter((t) => t.status === "Posted")
      .filter((t) => {
        if (from && t.date < from) return false;
        if (to && t.date > to) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, from, to]);

  // Main numbers + simple balance sheet model
  const report = useMemo(() => {
    const revenue = tx.filter((t) => t.type === "Income").reduce((a, t) => a + t.amount, 0);
    const expenses = tx.filter((t) => t.type === "Expense").reduce((a, t) => a + t.amount, 0);
    const net = revenue - expenses;

    // PFE simple balance sheet model
    const cash = net;
    const assets = cash;
    const liabilities = 0;
    const equity = assets - liabilities;

    return { revenue, expenses, net, cash, assets, liabilities, equity };
  }, [tx]);

  const byCategory = useMemo(() => {
    const rev: Record<string, number> = {};
    const exp: Record<string, number> = {};

    for (const t of tx) {
      if (t.type === "Income") rev[t.category] = (rev[t.category] ?? 0) + t.amount;
      if (t.type === "Expense") exp[t.category] = (exp[t.category] ?? 0) + t.amount;
    }

    const revenueByCat = Object.entries(rev)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const expenseByCat = Object.entries(exp)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { revenueByCat, expenseByCat };
  }, [tx]);

  // Light “health” badges
  const netBadge = useMemo(() => {
    if (report.net > 0) return <Badge variant="success">Positive</Badge>;
    if (report.net < 0) return <Badge variant="warning">Negative</Badge>;
    return <Badge variant="neutral">Break-even</Badge>;
  }, [report.net]);

  const onPresetChange = (p: PeriodPreset) => {
    setPreset(p);
    applyPreset(p);
  };

  const generate = () => {
    // UI-only button (filters already reactive)
    // If you want, we can add a toast later.
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Reports"
        subtitle="P&L, Balance Sheet and ledger summaries (PFE model)"
        right={<Button variant="secondary">Export PDF/Excel</Button>}
      />

      {/* Filters */}
      <Card>
        <CardHeader title="Report Filters" subtitle="Select a period and generate" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <Select value={preset} onChange={(e) => onPresetChange(e.target.value as PeriodPreset)}>
              <option value="1M">Last 1 month</option>
              <option value="3M">Last 3 months</option>
              <option value="CUSTOM">Custom</option>
            </Select>

            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />

            <div className="md:col-span-2 flex items-center gap-2">
              <Button variant="secondary" onClick={generate}>Generate</Button>
              <Button variant="secondary" onClick={() => { setFrom(""); setTo(""); setPreset("CUSTOM"); }}>
                Reset
              </Button>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Posted transactions only.
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Revenue</div>
            <div className="mt-2 text-2xl font-bold">{money(report.revenue)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Income total</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Expenses</div>
            <div className="mt-2 text-2xl font-bold">{money(report.expenses)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Expense total</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Net Profit</div>
            <div className="mt-2 text-2xl font-bold flex items-center gap-2">
              {money(report.net)} {netBadge}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Revenue - Expenses</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Cash (simple)</div>
            <div className="mt-2 text-2xl font-bold">{money(report.cash)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">PFE simplified model</div>
          </CardBody>
        </Card>
      </div>

      {/* P&L + Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Card>
            <CardHeader title="Profit & Loss (P&L)" subtitle="Revenue - Expenses = Net profit" right={<Button variant="secondary">Export</Button>} />
            <CardBody>
              <Table headers={["Line", "Amount"]}>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">Revenue</td>
                  <td className="px-4 py-3">{money(report.revenue)}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">Expenses</td>
                  <td className="px-4 py-3">{money(report.expenses)}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">Net Profit</td>
                  <td className="px-4 py-3 font-semibold">{money(report.net)}</td>
                </tr>
              </Table>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card>
            <CardHeader title="Revenue / Expenses by Category" subtitle="Top categories for selected period" right={<Button variant="secondary">Export</Button>} />
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Revenue
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Category</th>
                          <th className="px-4 py-3 text-left font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {byCategory.revenueByCat.length ? (
                          byCategory.revenueByCat.map((r) => (
                            <tr key={r.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">{r.category}</td>
                              <td className="px-4 py-3 font-semibold">{money(r.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400" colSpan={2}>No revenue lines.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Expenses
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Category</th>
                          <th className="px-4 py-3 text-left font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {byCategory.expenseByCat.length ? (
                          byCategory.expenseByCat.map((r) => (
                            <tr key={r.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">{r.category}</td>
                              <td className="px-4 py-3 font-semibold">{money(r.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400" colSpan={2}>No expense lines.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Category is based on transaction.category (Sales, Suppliers, Transport, Payroll, Other).
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Balance Sheet */}
      <Card>
        <CardHeader title="Balance Sheet" subtitle="Assets / Liabilities / Equity (simple PFE model)" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <Table headers={["Section", "Amount"]}>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Assets</td>
              <td className="px-4 py-3">{money(report.assets)}</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Liabilities</td>
              <td className="px-4 py-3">{money(report.liabilities)}</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium">Equity</td>
              <td className="px-4 py-3">{money(report.equity)}</td>
            </tr>
          </Table>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Simplified PFE scope: assumes only cash position from posted transactions.
            Later you can add VAT accounts, receivables/payables, inventory valuation, liabilities, etc.
          </div>
        </CardBody>
      </Card>

      {/* Ledger */}
      <Card>
        <CardHeader title="General Ledger" subtitle="Posted transactions for the selected period" right={<Button variant="secondary">Export Ledger</Button>} />
        <CardBody>
          <Table headers={["Date", "Type", "Category", "Amount", "Reference", "Status"]}>
            {tx.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.type === "Income" ? "info" : "warning"}>{t.type}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.category}</td>
                <td className="px-4 py-3 font-semibold">{money(t.amount)}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.reference ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="success">{t.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>

          {tx.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No posted transactions for this period.
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}