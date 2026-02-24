"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useMemo } from "react";
import { financeHelpers, useFinance } from "@/modules/finance/store";

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function FinanceDashboardPage() {
  const { state } = useFinance();

  const kpis = useMemo(() => {
    const invoices = state.invoices;
    const totals = invoices.map((i) => financeHelpers.invoiceTotals(i));

    const grossInvoiced = totals.reduce((a, t) => a + t.gross, 0);
    const netInvoiced = totals.reduce((a, t) => a + t.net, 0);
    const totalPaid = invoices.reduce((a, i) => a + (i.paidAmount ?? 0), 0);
    const totalDue = totals.reduce((a, t) => a + t.due, 0);

    const postedIncome = state.transactions
      .filter((t) => t.status === "Posted" && t.type === "Income")
      .reduce((a, t) => a + t.amount, 0);

    const postedExpense = state.transactions
      .filter((t) => t.status === "Posted" && t.type === "Expense")
      .reduce((a, t) => a + t.amount, 0);

    const netCash = postedIncome - postedExpense;

    // IN vs OUT
    const inNet = invoices
      .filter((i) => i.type === "IN")
      .reduce((a, i) => a + financeHelpers.invoiceTotals(i).net, 0);

    const outNet = invoices
      .filter((i) => i.type === "OUT")
      .reduce((a, i) => a + financeHelpers.invoiceTotals(i).net, 0);

    return {
      grossInvoiced,
      netInvoiced,
      totalPaid,
      totalDue,
      postedIncome,
      postedExpense,
      netCash,
      inNet,
      outNet,
    };
  }, [state.invoices, state.transactions]);

  const statusCounts = useMemo(() => {
    const c = { Draft: 0, Sent: 0, Overdue: 0, Paid: 0 };
    for (const i of state.invoices) c[i.status] = (c[i.status] as number) + 1;
    return c;
  }, [state.invoices]);

  const overdueTop = useMemo(() => {
    const today = isoToday();
    return state.invoices
      .map((i) => ({ i, due: financeHelpers.invoiceTotals(i).due }))
      .filter(({ i, due }) => (i.status === "Overdue" || i.dueDate < today) && due > 0)
      .sort((a, b) => b.due - a.due)
      .slice(0, 5);
  }, [state.invoices]);

  const upcomingDue = useMemo(() => {
    const today = isoToday();
    const next7 = addDaysISO(today, 7);
    return state.invoices
      .map((i) => ({ i, due: financeHelpers.invoiceTotals(i).due }))
      .filter(({ i, due }) => i.status !== "Paid" && due > 0 && i.dueDate >= today && i.dueDate <= next7)
      .sort((a, b) => a.i.dueDate.localeCompare(b.i.dueDate))
      .slice(0, 6);
  }, [state.invoices]);

  const topParties = useMemo(() => {
    // simple aggregation by customerName (party), split IN/OUT
    const mapIn = new Map<string, number>();
    const mapOut = new Map<string, number>();

    for (const inv of state.invoices) {
      const net = financeHelpers.invoiceTotals(inv).net;
      const key = inv.customerName || "Unknown";
      const m = inv.type === "IN" ? mapIn : mapOut;
      m.set(key, (m.get(key) ?? 0) + net);
    }

    const topIn = Array.from(mapIn.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topOut = Array.from(mapOut.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { topIn, topOut };
  }, [state.invoices]);

  const paymentsTop = useMemo(() => {
    const byInv = Object.fromEntries(state.invoices.map((i) => [i.id, i]));
    return state.payments
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((p) => ({ p, inv: byInv[p.invoiceId] }));
  }, [state.payments, state.invoices]);

  return (
    <div className="space-y-6">
      <Topbar
        title="Finance Dashboard"
        subtitle="Quick view of invoicing, payments, cash flow"
        right={
          <div className="flex flex-wrap gap-2">
            <Link href="/finance/invoices"><Button variant="secondary">Invoices</Button></Link>
            <Link href="/finance/payments"><Button variant="secondary">Payments</Button></Link>
            <Link href="/finance/transactions"><Button variant="secondary">Transactions</Button></Link>
            <Link href="/finance/reports"><Button>Reports</Button></Link>
          </div>
        }
      />

      {/* Quick actions */}
      <Card>
        <CardHeader title="Quick Actions" subtitle="Common finance actions" />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Link href="/finance/invoices"><Button>Create Invoice</Button></Link>
            <Link href="/finance/payments"><Button variant="secondary">Record Payment</Button></Link>
            <Link href="/finance/transactions"><Button variant="secondary">Add Transaction</Button></Link>
            <Link href="/finance/reports"><Button variant="secondary">Generate Report</Button></Link>
          </div>
        </CardBody>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardBody>
          <div className="text-xs text-slate-500 dark:text-slate-400">Gross Invoiced</div>
          <div className="mt-2 text-2xl font-bold">{kpis.grossInvoiced.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">HT + TVA + FODEC + Timbre</div>
        </CardBody></Card>

        <Card><CardBody>
          <div className="text-xs text-slate-500 dark:text-slate-400">Net Invoiced</div>
          <div className="mt-2 text-2xl font-bold">{kpis.netInvoiced.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">After retenue à la source</div>
        </CardBody></Card>

        <Card><CardBody>
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Paid</div>
          <div className="mt-2 text-2xl font-bold">{kpis.totalPaid.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Payments applied</div>
        </CardBody></Card>

        <Card><CardBody>
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Due</div>
          <div className="mt-2 text-2xl font-bold">{kpis.totalDue.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Outstanding net</div>
        </CardBody></Card>
      </div>

      {/* Status + IN/OUT cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader title="Invoice Overview" subtitle="Status distribution and IN/OUT totals" />
            <CardBody>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Draft</div>
                  <div className="mt-1 text-xl font-bold">{statusCounts.Draft}</div>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Sent</div>
                  <div className="mt-1 text-xl font-bold">{statusCounts.Sent}</div>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Overdue</div>
                  <div className="mt-1 text-xl font-bold">{statusCounts.Overdue}</div>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Paid</div>
                  <div className="mt-1 text-xl font-bold">{statusCounts.Paid}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">IN (Sales) — Net</div>
                  <div className="mt-2 text-lg font-bold">{kpis.inNet.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">OUT (Purchases) — Net</div>
                  <div className="mt-2 text-lg font-bold">{kpis.outNet.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                IN = customer invoices, OUT = supplier invoices (both include taxes and withholding).
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Upcoming Due (7 days)" subtitle="Invoices due soon" right={<Link href="/finance/invoices"><Button variant="secondary">Open Invoices</Button></Link>} />
            <CardBody>
              <div className="space-y-3">
                {upcomingDue.map(({ i, due }) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="text-sm font-semibold">{i.invoiceNo} • {i.customerName}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Due {i.dueDate}</div>
                    </div>
                    <div className="text-sm font-semibold">{due.toLocaleString()} {i.currency}</div>
                  </div>
                ))}
                {upcomingDue.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No upcoming due invoices.</div>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Overdue + Payments */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader
              title="Overdue (Top 5)"
              subtitle="Highest outstanding invoices"
              right={<Link href="/finance/payments"><Button variant="secondary">Open Payments</Button></Link>}
            />
            <CardBody>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                      <th className="px-4 py-3 text-left font-semibold">Party</th>
                      <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Due</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {overdueTop.map(({ i, due }) => (
                      <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium">{i.invoiceNo}</td>
                        <td className="px-4 py-3">{i.customerName}</td>
                        <td className="px-4 py-3">{i.dueDate}</td>
                        <td className="px-4 py-3 font-semibold">{due.toLocaleString()} {i.currency}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              i.status === "Overdue"
                                ? "warning"
                                : i.status === "Paid"
                                  ? "success"
                                  : i.status === "Sent"
                                    ? "info"
                                    : "neutral"
                            }
                          >
                            {i.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {overdueTop.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                          No overdue invoices.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader
              title="Recent Payments"
              subtitle="Last recorded payments"
              right={<Link href="/finance/payments"><Button variant="secondary">Record Payment</Button></Link>}
            />
            <CardBody>
              <div className="space-y-3">
                {paymentsTop.map(({ p, inv }) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="text-sm font-semibold">{inv?.invoiceNo ?? "Unknown"} • {p.method}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.date} • {inv?.customerName ?? "—"}</div>
                    </div>
                    <div className="text-sm font-semibold">{p.amount.toLocaleString()} {inv?.currency ?? "TND"}</div>
                  </div>
                ))}
                {paymentsTop.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No payments recorded yet.</div>
                ) : null}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Cash Flow (Posted)</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-300">Income</div>
                  <div className="text-sm font-semibold">{kpis.postedIncome.toLocaleString()}</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-300">Expenses</div>
                  <div className="text-sm font-semibold">{kpis.postedExpense.toLocaleString()}</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-300">Net</div>
                  <div className="text-sm font-semibold">{kpis.netCash.toLocaleString()}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Top customers/suppliers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Card>
            <CardHeader title="Top Customers (IN)" subtitle="Highest invoiced (net) by customer" right={<Link href="/finance/invoices"><Button variant="secondary">View</Button></Link>} />
            <CardBody>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Customer</th>
                      <th className="px-4 py-3 text-left font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {topParties.topIn.map((r) => (
                      <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">{r.name}</td>
                        <td className="px-4 py-3 font-semibold">{r.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {topParties.topIn.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">No customer invoices.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card>
            <CardHeader title="Top Suppliers (OUT)" subtitle="Highest invoiced (net) by supplier" right={<Link href="/finance/invoices"><Button variant="secondary">View</Button></Link>} />
            <CardBody>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Supplier</th>
                      <th className="px-4 py-3 text-left font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {topParties.topOut.map((r) => (
                      <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">{r.name}</td>
                        <td className="px-4 py-3 font-semibold">{r.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {topParties.topOut.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">No supplier invoices.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}