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

function badgeForInvoiceType(t: "IN" | "OUT") {
  if (t === "IN") return { variant: "success" as const, label: "IN" };
  return { variant: "warning" as const, label: "OUT" };
}

export default function FinanceInvoicesPage() {
  const { state, dispatch } = useFinance();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | InvoiceStatus>("");
  const [type, setType] = useState<"" | "IN" | "OUT">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const [form, setForm] = useState({
    invoiceNo: "",
    customerName: "",
    type: "IN" as "IN" | "OUT",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    currency: "TND",

    // One line for PFE demo
    lineLabel: "Sale",
    lineQty: "1",
    lineUnitPrice: "0",

    // Taxes (Tunisia style)
    tvaRate: "0.19",
    fodecRate: "0",
    timbre: "0",
    retenueRate: "0",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.invoices
      .filter((i) => {
        const matchQ =
          !query ||
          i.invoiceNo.toLowerCase().includes(query) ||
          i.customerName.toLowerCase().includes(query);

        const matchS = !status || i.status === status;
        const matchT = !type || i.type === type;

        const matchFrom = !from || i.issueDate >= from;
        const matchTo = !to || i.issueDate <= to;

        return matchQ && matchS && matchT && matchFrom && matchTo;
      })
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [state.invoices, q, status, type, from, to]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      invoiceNo: `INV-${String(Date.now()).slice(-4)}`,
      customerName: "",
      type: "IN",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      currency: "TND",
      lineLabel: "Sale",
      lineQty: "1",
      lineUnitPrice: "0",
      tvaRate: "0.19",
      fodecRate: "0",
      timbre: "0",
      retenueRate: "0",
    });
    setOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    const first = inv.lines[0];
    setForm({
      invoiceNo: inv.invoiceNo,
      customerName: inv.customerName,
      type: inv.type ?? "IN",
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      currency: inv.currency,

      lineLabel: first?.label ?? "Sale",
      lineQty: String(first?.qty ?? 1),
      lineUnitPrice: String(first?.unitPrice ?? 0),

      tvaRate: String(inv.taxes?.tvaRate ?? 0.19),
      fodecRate: String(inv.taxes?.fodecRate ?? 0),
      timbre: String(inv.taxes?.timbre ?? 0),
      retenueRate: String(inv.taxes?.retenueRate ?? 0),
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.invoiceNo.trim() || !form.customerName.trim()) return;

    const inv: Invoice = {
      id: editing?.id ?? `i-${Date.now()}`,
      invoiceNo: form.invoiceNo.trim(),
      customerName: form.customerName.trim(),
      type: form.type,
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

      // Taxes
      taxes: {
        tvaRate: Math.max(0, Number(form.tvaRate) || 0),
        fodecRate: Math.max(0, Number(form.fodecRate) || 0),
        timbre: Math.max(0, Number(form.timbre) || 0),
        retenueRate: Math.max(0, Number(form.retenueRate) || 0),
      },

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
        subtitle="Create/send invoices, track taxes, type IN/OUT, export documents"
        right={<Button onClick={openCreate}>Create Invoice</Button>}
      />

      <Card>
        <CardHeader
          title="Invoice List"
          subtitle="Draft / Sent / Paid / Overdue"
          right={<Button variant="secondary">Export PDF/Excel</Button>}
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice/customer..." />

            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </Select>

            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="">All Types</option>
              <option value="IN">IN (Customer)</option>
              <option value="OUT">OUT (Supplier)</option>
            </Select>

            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />

            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Date filter uses issue date.
            </div>
          </div>

          <Table headers={["Type", "Invoice", "Customer", "Total TTC", "Net (after retenue)", "Paid", "Due Date", "Status", "Actions"]}>
            {filtered.map((i) => {
              const totals = financeHelpers.invoiceTotals(i); // UPDATED helper (see store changes below)
              const st = badgeForInvoiceStatus(i.status);
              const tp = badgeForInvoiceType(i.type ?? "IN");

              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <Badge variant={tp.variant}>{tp.label}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{i.invoiceNo}</td>
                  <td className="px-4 py-3">{i.customerName}</td>

                  <td className="px-4 py-3 font-semibold">
                    {totals.gross.toLocaleString()} {i.currency}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {totals.net.toLocaleString()} {i.currency}
                  </td>

                  <td className="px-4 py-3">
                    {i.paidAmount.toLocaleString()} {i.currency}
                  </td>

                  <td className="px-4 py-3">{i.dueDate}</td>

                  <td className="px-4 py-3">
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" className="py-1.5" onClick={() => openEdit(i)}>
                        Edit
                      </Button>
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

          {filtered.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No invoices match your filters.
            </div>
          ) : null}
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
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Customer / Supplier</div>
            <Input value={form.customerName} onChange={(e) => setForm((s) => ({ ...s, customerName: e.target.value }))} placeholder="Name..." />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Type</div>
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as any }))}>
              <option value="IN">IN (Customer)</option>
              <option value="OUT">OUT (Supplier)</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Currency</div>
            <Select value={form.currency} onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}>
              <option value="TND">TND</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Issue Date</div>
            <Input type="date" value={form.issueDate} onChange={(e) => setForm((s) => ({ ...s, issueDate: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Due Date</div>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Line (PFE demo)</div>
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

          <div className="md:col-span-2">
            <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Taxes</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              TVA + FODEC + Timbre, with Retenue à la source (withholding) applied on HT.
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">TVA rate</div>
            <Input type="number" step="0.01" min={0} value={form.tvaRate} onChange={(e) => setForm((s) => ({ ...s, tvaRate: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">FODEC rate</div>
            <Input type="number" step="0.01" min={0} value={form.fodecRate} onChange={(e) => setForm((s) => ({ ...s, fodecRate: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Timbre</div>
            <Input type="number" step="0.1" min={0} value={form.timbre} onChange={(e) => setForm((s) => ({ ...s, timbre: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Retenue rate</div>
            <Input type="number" step="0.01" min={0} value={form.retenueRate} onChange={(e) => setForm((s) => ({ ...s, retenueRate: e.target.value }))} />
          </div>
        </div>
        {/* --- Paste this right below the Retenue input inside the Modal --- */}
          <div className="md:col-span-2 mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
            <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Live Summary / Total Calculé</h4>
            
            {(() => {
              // Live calculation based on current form state
              const ht = (Number(form.lineQty) || 0) * (Number(form.lineUnitPrice) || 0);
              const fodec = ht * (Number(form.fodecRate) || 0);
              const tvaBase = ht + fodec;
              const tva = tvaBase * (Number(form.tvaRate) || 0);
              const timbre = Number(form.timbre) || 0;
              const retenue = ht * (Number(form.retenueRate) || 0);
              const grossTTC = tvaBase + tva + timbre;
              const netToPay = grossTTC - retenue;

              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Montant HT:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{ht.toFixed(3)} {form.currency}</span>
                  </div>
                  {(fodec > 0) && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>FODEC:</span>
                      <span>{fodec.toFixed(3)} {form.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>TVA:</span>
                    <span>{tva.toFixed(3)} {form.currency}</span>
                  </div>
                  {(timbre > 0) && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Timbre Fiscal:</span>
                      <span>{timbre.toFixed(3)} {form.currency}</span>
                    </div>
                  )}
                  <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Total TTC:</span>
                    <span className="text-slate-900 dark:text-slate-100">{grossTTC.toFixed(3)} {form.currency}</span>
                  </div>
                  {(retenue > 0) && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Retenue à la source (-):</span>
                      <span>{retenue.toFixed(3)} {form.currency}</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between rounded-lg bg-slate-900 p-3 text-white dark:bg-white dark:text-slate-900">
                    <span className="font-semibold">Net à Payer:</span>
                    <span className="font-bold">{netToPay.toFixed(3)} {form.currency}</span>
                  </div>
                </div>
              );
            })()}
          </div>
      </Modal>
    </div>
  );
}