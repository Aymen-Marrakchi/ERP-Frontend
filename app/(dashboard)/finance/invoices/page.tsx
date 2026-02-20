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
import { Invoice, InvoiceStatus, financeHelpers, useFinance } from "../store";

function badgeForInvoiceStatus(s: InvoiceStatus) {
  if (s === "Draft") return { variant: "neutral" as const, label: "Draft" };
  if (s === "Sent") return { variant: "info" as const, label: "Sent" };
  if (s === "Overdue") return { variant: "warning" as const, label: "Overdue" };
  return { variant: "success" as const, label: "Paid" };
}

export default function FinanceInvoicesPage() {
  const { state, dispatch } = useFinance();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | InvoiceStatus>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const [form, setForm] = useState({
    invoiceNo: "",
    customerName: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    currency: "TND",
    lineLabel: "Sale",
    lineQty: "1",
    lineUnitPrice: "0",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.invoices.filter((i) => {
      const matchQ =
        !query ||
        i.invoiceNo.toLowerCase().includes(query) ||
        i.customerName.toLowerCase().includes(query);
      const matchS = !status || i.status === status;
      return matchQ && matchS;
    });
  }, [state.invoices, q, status]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      invoiceNo: `INV-${String(Date.now()).slice(-4)}`,
      customerName: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      currency: "TND",
      lineLabel: "Sale",
      lineQty: "1",
      lineUnitPrice: "0",
    });
    setOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    const first = inv.lines[0];
    setForm({
      invoiceNo: inv.invoiceNo,
      customerName: inv.customerName,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      currency: inv.currency,
      lineLabel: first?.label ?? "Sale",
      lineQty: String(first?.qty ?? 1),
      lineUnitPrice: String(first?.unitPrice ?? 0),
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.invoiceNo.trim() || !form.customerName.trim()) return;

    const inv: Invoice = {
      id: editing?.id ?? `i-${Date.now()}`,
      invoiceNo: form.invoiceNo.trim(),
      customerName: form.customerName.trim(),
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: editing?.status ?? "Draft",
      currency: form.currency,
      lines: [
        {
          id: editing?.lines?.[0]?.id ?? `il-${Date.now()}`,
          label: form.lineLabel.trim() || "Sale",
          qty: Number(form.lineQty) || 1,
          unitPrice: Number(form.lineUnitPrice) || 0,
        },
      ],
      paidAmount: editing?.paidAmount ?? 0,
      notes: editing?.notes,
    };

    if (editing) dispatch({ type: "INVOICE_UPDATE", payload: inv });
    else dispatch({ type: "INVOICE_CREATE", payload: inv });

    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Invoices"
        subtitle="Create/send invoices, track status, export documents"
        right={<Button onClick={openCreate}>Create Invoice</Button>}
      />

      <Card>
        <CardHeader title="Invoice List" subtitle="Draft / Sent / Paid / Overdue" right={<Button variant="secondary">Export PDF/Excel</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice/customer..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </Select>
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Status updates automatically after payments and due date.
            </div>
          </div>

          <Table headers={["Invoice", "Customer", "Amount", "Paid", "Due Date", "Status", "Actions"]}>
            {filtered.map((i) => {
              const total = financeHelpers.invoiceTotal(i);
              const st = badgeForInvoiceStatus(i.status);

              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{i.invoiceNo}</td>
                  <td className="px-4 py-3">{i.customerName}</td>
                  <td className="px-4 py-3">{total.toLocaleString()} {i.currency}</td>
                  <td className="px-4 py-3">{i.paidAmount.toLocaleString()} {i.currency}</td>
                  <td className="px-4 py-3">{i.dueDate}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" className="py-1.5" onClick={() => openEdit(i)}>Edit</Button>
                      {i.status === "Draft" ? (
                        <Button className="py-1.5" onClick={() => dispatch({ type: "INVOICE_SEND", payload: { invoiceId: i.id } })}>
                          Send
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </CardBody>
      </Card>

      <Modal
        open={open}
        title={editing ? "Edit Invoice" : "Create Invoice"}
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
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice No</div>
            <Input value={form.invoiceNo} onChange={(e) => setForm((s) => ({ ...s, invoiceNo: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Customer</div>
            <Input value={form.customerName} onChange={(e) => setForm((s) => ({ ...s, customerName: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Issue Date</div>
            <Input type="date" value={form.issueDate} onChange={(e) => setForm((s) => ({ ...s, issueDate: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Due Date</div>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Currency</div>
            <Select value={form.currency} onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}>
              <option value="TND">TND</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Line Label</div>
            <Input value={form.lineLabel} onChange={(e) => setForm((s) => ({ ...s, lineLabel: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity</div>
            <Input type="number" min={1} value={form.lineQty} onChange={(e) => setForm((s) => ({ ...s, lineQty: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Unit Price</div>
            <Input type="number" min={0} value={form.lineUnitPrice} onChange={(e) => setForm((s) => ({ ...s, lineUnitPrice: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
