"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { useMemo, useState } from "react";
import { Transaction, TxType, useFinance } from "../store";

type PeriodPreset = "1M" | "3M" | "CUSTOM";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function money(n: number) {
  return n.toLocaleString();
}

export default function FinanceTransactionsPage() {
  const { state, dispatch } = useFinance();

  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | TxType>("");
  const [category, setCategory] = useState<"" | Transaction["category"]>("");
  const [status, setStatus] = useState<"" | Transaction["status"]>("");

  // NEW: date filters + presets
  const [preset, setPreset] = useState<PeriodPreset>("CUSTOM");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const applyPreset = (p: PeriodPreset) => {
    const t = todayISO();
    if (p === "1M") {
      setTo(t);
      setFrom(addMonthsISO(t, -1));
      return;
    }
    if (p === "3M") {
      setTo(t);
      setFrom(addMonthsISO(t, -3));
      return;
    }
    // CUSTOM = do not override
  };

  const onPresetChange = (p: PeriodPreset) => {
    setPreset(p);
    applyPreset(p);
  };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "Expense" as TxType,
    category: "Other" as Transaction["category"],
    amount: "0",
    reference: "",
    status: "Posted" as Transaction["status"],
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return [...state.transactions]
      .filter((t) => {
        // date filter
        if (from && t.date < from) return false;
        if (to && t.date > to) return false;

        // search (reference + category)
        const matchQ =
          !query ||
          (t.reference ?? "").toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query);

        const matchT = !type || t.type === type;
        const matchC = !category || t.category === category;
        const matchS = !status || t.status === status;

        return matchQ && matchT && matchC && matchS;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, q, type, category, status, from, to]);

  const totals = useMemo(() => {
    const income = filtered.filter((t) => t.type === "Income").reduce((a, t) => a + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "Expense").reduce((a, t) => a + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const save = () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return;

    const tx: Transaction = {
      id: `t-${Date.now()}`,
      date: form.date,
      type: form.type,
      category: form.category,
      amount: amt,
      reference: form.reference.trim() || undefined,
      status: form.status,
    };

    dispatch({ type: "TX_ADD", payload: tx });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Transactions"
        subtitle="Income and expenses with categorization, date filtering and summaries"
        right={<Button onClick={() => setOpen(true)}>Add Transaction</Button>}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Income (filtered)</div>
            <div className="mt-2 text-2xl font-bold">{money(totals.income)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sum of Income</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Expenses (filtered)</div>
            <div className="mt-2 text-2xl font-bold">{money(totals.expense)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sum of Expense</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Net (filtered)</div>
            <div className="mt-2 text-2xl font-bold">{money(totals.net)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Income - Expenses</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Transaction List" subtitle="Filter by type, category, status and date range" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-7">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference/category..." />

            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="">Type</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </Select>

            <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="">Category</option>
              <option value="Sales">Sales</option>
              <option value="Suppliers">Suppliers</option>
              <option value="Transport">Transport</option>
              <option value="Payroll">Payroll</option>
              <option value="Other">Other</option>
            </Select>

            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">Status</option>
              <option value="Posted">Posted</option>
              <option value="Pending">Pending</option>
            </Select>

            <Select value={preset} onChange={(e) => onPresetChange(e.target.value as PeriodPreset)}>
              <option value="CUSTOM">Custom</option>
              <option value="1M">Last 1 month</option>
              <option value="3M">Last 3 months</option>
            </Select>

            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("CUSTOM"); }} />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("CUSTOM"); }} />
          </div>

          <Table headers={["Date", "Type", "Category", "Amount", "Reference", "Status"]}>
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.type === "Income" ? "info" : "warning"}>{t.type}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.category}</td>
                <td className="px-4 py-3 font-semibold">{money(t.amount)}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.reference ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.status === "Posted" ? "success" : "neutral"}>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>

          {filtered.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No transactions match your filters.
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Add Transaction"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date</div>
            <Input type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Type</div>
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as any }))}>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Category</div>
            <Select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as any }))}>
              <option value="Sales">Sales</option>
              <option value="Suppliers">Suppliers</option>
              <option value="Transport">Transport</option>
              <option value="Payroll">Payroll</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Amount</div>
            <Input type="number" min={1} value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reference (optional)</div>
            <Input
              value={form.reference}
              onChange={(e) => setForm((s) => ({ ...s, reference: e.target.value }))}
              placeholder="INV-1032, Supplier bill..."
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Status</div>
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as any }))}>
              <option value="Posted">Posted</option>
              <option value="Pending">Pending</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}