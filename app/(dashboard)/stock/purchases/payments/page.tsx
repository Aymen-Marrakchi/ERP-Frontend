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
import type { SupplierInvoice } from "../types";
import { supplierInvoiceTotals, usePurchases } from "../store";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SupplierPaymentsPage() {
  const { state, dispatch } = usePurchases();

  const supplierById = useMemo(() => Object.fromEntries(state.suppliers.map((s) => [s.id, s])), [state.suppliers]);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"" | "DueSoon" | "Overdue">("");
  const [open, setOpen] = useState(false);

  const [payForm, setPayForm] = useState({
    invId: state.invoices[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10),
    method: "Bank",
    amount: "0",
    reference: "",
  });

  const schedule = useMemo(() => {
    const t = today();
    const query = q.trim().toLowerCase();

    const rows = state.invoices
      .filter((inv) => inv.status === "Posted" || inv.status === "Approved" || inv.status === "Submitted")
      .map((inv) => {
        const totals = supplierInvoiceTotals(inv);
        const due = Math.max(0, totals.ttc - inv.totalPaid);
        const overdue = inv.dueDate < t && due > 0;
        const dueSoon = !overdue && inv.dueDate <= t; // simple
        return { inv, totals, due, overdue, dueSoon };
      })
      .filter(({ inv }) => {
        const sup = supplierById[inv.supplierId]?.name ?? "";
        const text = `${inv.invNo} ${sup}`.toLowerCase();
        return !query || text.includes(query);
      })
      .filter((r) => {
        if (!filter) return true;
        if (filter === "Overdue") return r.overdue;
        if (filter === "DueSoon") return r.due > 0 && !r.overdue;
        return true;
      })
      .sort((a, b) => a.inv.dueDate.localeCompare(b.inv.dueDate));

    return rows;
  }, [state.invoices, supplierById, q, filter]);

  const openPay = (inv: SupplierInvoice) => {
    const totals = supplierInvoiceTotals(inv);
    const due = Math.max(0, totals.ttc - inv.totalPaid);

    setPayForm({
      invId: inv.id,
      date: new Date().toISOString().slice(0, 10),
      method: "Bank",
      amount: String(due || 0),
      reference: "",
    });
    setOpen(true);
  };

  const savePayment = () => {
    const amt = Number(payForm.amount);
    if (!payForm.invId || !amt || amt <= 0) return;

    dispatch({ type: "SINV_ADD_PAYMENT", payload: { invId: payForm.invId, amount: amt } });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Topbar title="Supplier Payments" subtitle="Payment schedule, alerts and payment history (simplified)" />

      <Card>
        <CardHeader title="Payment Schedule" subtitle="Based on supplier invoices due dates" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice or supplier..." />
            <Select value={filter} onChange={(e) => setFilter(e.target.value as "" | "DueSoon" | "Overdue")}>
              <option value="">All</option>
              <option value="Overdue">Overdue</option>
              <option value="DueSoon">Due</option>
            </Select>
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Later: connect to Finance cashflow and bank accounts.
            </div>
          </div>

          <Table headers={["Invoice", "Supplier", "Due Date", "Total", "Paid", "Due", "Alert", "Action"]}>
            {schedule.map(({ inv, totals, due, overdue }) => {
              const sup = supplierById[inv.supplierId];
              const alert = overdue ? <Badge variant="danger">Overdue</Badge> : due > 0 ? <Badge variant="warning">Due</Badge> : <Badge variant="success">Paid</Badge>;

              return (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{inv.invNo}</td>
                  <td className="px-4 py-3">{sup?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3">{inv.dueDate}</td>
                  <td className="px-4 py-3">{totals.ttc.toLocaleString()} {inv.currency}</td>
                  <td className="px-4 py-3">{inv.totalPaid.toLocaleString()} {inv.currency}</td>
                  <td className="px-4 py-3">{due.toLocaleString()} {inv.currency}</td>
                  <td className="px-4 py-3">{alert}</td>
                  <td className="px-4 py-3">
                    <Button className="py-1.5" onClick={() => openPay(inv)} disabled={due <= 0}>
                      Record Payment
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>

          {schedule.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">No invoices in this filter.</div>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Record Supplier Payment"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={savePayment}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice</div>
            <Select value={payForm.invId} onChange={(e) => setPayForm((s) => ({ ...s, invId: e.target.value }))}>
              {state.invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invNo}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date</div>
            <Input type="date" value={payForm.date} onChange={(e) => setPayForm((s) => ({ ...s, date: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Method</div>
            <Select value={payForm.method} onChange={(e) => setPayForm((s) => ({ ...s, method: e.target.value }))}>
              <option value="Bank">Bank transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Amount</div>
            <Input type="number" min={1} value={payForm.amount} onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reference</div>
            <Input value={payForm.reference} onChange={(e) => setPayForm((s) => ({ ...s, reference: e.target.value }))} placeholder="TRX..." />
          </div>

          <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">
            This screen updates the invoice paid amount (UI). Later backend will create finance transactions and update cashflow.
          </div>
        </div>
      </Modal>
    </div>
  );
}
