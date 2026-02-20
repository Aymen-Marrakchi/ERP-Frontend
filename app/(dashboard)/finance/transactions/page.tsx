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

export default function FinanceTransactionsPage() {
  const { state, dispatch } = useFinance();

  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | TxType>("");
  const [category, setCategory] = useState<"" | Transaction["category"]>("");

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
    return state.transactions.filter((t) => {
      const matchQ = !query || (t.reference ?? "").toLowerCase().includes(query);
      const matchT = !type || t.type === type;
      const matchC = !category || t.category === category;
      return matchQ && matchT && matchC;
    });
  }, [state.transactions, q, type, category]);

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
      <Topbar title="Transactions" subtitle="Income and expenses with categorization" right={<Button onClick={() => setOpen(true)}>Add Transaction</Button>} />

      <Card>
        <CardHeader title="Transaction List" subtitle="Posted and pending flows" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference..." />
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
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Transactions can be created manually or generated automatically from payments.
            </div>
          </div>

          <Table headers={["Date", "Type", "Category", "Amount", "Reference", "Status"]}>
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.type === "Income" ? "info" : "warning"}>{t.type}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.category}</td>
                <td className="px-4 py-3">{t.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.reference ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.status === "Posted" ? "success" : "neutral"}>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </Table>
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
            <Input value={form.reference} onChange={(e) => setForm((s) => ({ ...s, reference: e.target.value }))} placeholder="INV-1032, Supplier bill..." />
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
