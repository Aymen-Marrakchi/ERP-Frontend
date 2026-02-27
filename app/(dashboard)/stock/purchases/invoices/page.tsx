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
import type { SupplierInvoice, SupplierInvoiceStatus } from "../../store";
import { supplierInvoiceTotals, threeWayMatch, usePurchases } from "../store";

function badgeForStatus(s: SupplierInvoiceStatus) {
  if (s === "Draft") return { variant: "neutral" as const, label: "Draft" };
  if (s === "Submitted") return { variant: "info" as const, label: "Submitted" };
  if (s === "Approved") return { variant: "info" as const, label: "Approved" };
  if (s === "Rejected") return { variant: "danger" as const, label: "Rejected" };
  return { variant: "success" as const, label: "Posted" };
}

export default function SupplierInvoicesPage() {
  const { state, dispatch } = usePurchases();

  const supplierById = useMemo(() => Object.fromEntries(state.suppliers.map((s) => [s.id, s])), [state.suppliers]);
  const poById = useMemo(() => Object.fromEntries(state.orders.map((o) => [o.id, o])), [state.orders]);
  const receiptById = useMemo(() => Object.fromEntries(state.receipts.map((r) => [r.id, r])), [state.receipts]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | SupplierInvoiceStatus>("");

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SupplierInvoice | null>(null);

  const [form, setForm] = useState({
    invNo: `SINV-${String(Date.now()).slice(-4)}`,
    supplierId: state.suppliers.find((s) => s.status === "Active")?.id ?? "",
    poId: state.orders[0]?.id ?? "",
    receiptIds: state.receipts.filter((r) => r.status === "Validated").slice(0, 1).map((r) => r.id),
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    currency: "TND" as SupplierInvoice["currency"],
    item: "Product A",
    qty: "1",
    unitPriceHT: "0",
    taxRate: "0.19",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.invoices.filter((inv) => {
      const sup = supplierById[inv.supplierId]?.name ?? "";
      const matchQ = !query || inv.invNo.toLowerCase().includes(query) || sup.toLowerCase().includes(query);
      const matchS = !status || inv.status === status;
      return matchQ && matchS;
    });
  }, [state.invoices, q, status, supplierById]);

  const openCreate = () => {
    const activeSup = state.suppliers.find((s) => s.status === "Active")?.id ?? "";
    const poId = state.orders[0]?.id ?? "";
    const validReceipt = state.receipts.find((r) => r.status === "Validated")?.id;
    setForm({
      invNo: `SINV-${String(Date.now()).slice(-4)}`,
      supplierId: activeSup,
      poId,
      receiptIds: validReceipt ? [validReceipt] : [],
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      currency: "TND",
      item: "Product A",
      qty: "1",
      unitPriceHT: "0",
      taxRate: "0.19",
    });
    setOpen(true);
  };

  const create = () => {
    if (!form.invNo.trim() || !form.supplierId) return;

    const inv: SupplierInvoice = {
      id: `sinv-${Date.now()}`,
      invNo: form.invNo.trim(),
      supplierId: form.supplierId,
      poId: form.poId || undefined,
      receiptIds: form.receiptIds,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: "Draft",
      currency: form.currency,
      totalPaid: 0,
      lines: [
        {
          id: `sinvl-${Date.now()}`,
          item: form.item.trim(),
          qty: Number(form.qty) || 1,
          unitPriceHT: Number(form.unitPriceHT) || 0,
          taxRate: Number(form.taxRate) || 0,
        },
      ],
    };

    dispatch({ type: "SINV_CREATE", payload: inv });
    setOpen(false);
  };

  const setInvStatus = (invId: string, next: SupplierInvoiceStatus, reason?: string) =>
    dispatch({ type: "SINV_SET_STATUS", payload: { invId, status: next, rejectionReason: reason } });

  return (
    <div className="space-y-6">
      <Topbar
        title="Supplier Invoices"
        subtitle="Supplier invoice entry with 3-way matching (PO ↔ Receipt ↔ Invoice)"
        right={<Button onClick={openCreate}>Create Invoice</Button>}
      />

      <Card>
        <CardHeader title="Invoice List" subtitle="Draft → Submitted → Approved/Rejected → Posted" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice or supplier..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Posted">Posted</option>
            </Select>
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              3-way match is computed from selected PO and validated receipts.
            </div>
          </div>

          <Table headers={["Invoice", "Supplier", "PO", "Amount TTC", "Match", "Status", "Actions"]}>
            {filtered.map((inv) => {
              const sup = supplierById[inv.supplierId];
              const po = inv.poId ? poById[inv.poId] : undefined;
              const receipts = inv.receiptIds.map((id) => receiptById[id]).filter(Boolean);
              const totals = supplierInvoiceTotals(inv);

              const match = threeWayMatch({ po, receipts, inv });
              const matchBadge =
                match.status === "OK"
                  ? { variant: "success" as const, label: "OK" }
                  : match.status === "Missing PO" || match.status === "Missing Receipt"
                    ? { variant: "neutral" as const, label: match.status }
                    : { variant: "warning" as const, label: "Mismatch" };

              const st = badgeForStatus(inv.status);

              return (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{inv.invNo}</td>
                  <td className="px-4 py-3">{sup?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3">{po?.poNo ?? "—"}</td>
                  <td className="px-4 py-3">{totals.ttc.toLocaleString()} {inv.currency}</td>
                  <td className="px-4 py-3"><Badge variant={matchBadge.variant}>{matchBadge.label}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" className="py-1.5" onClick={() => setView(inv)}>View</Button>
                      {inv.status === "Draft" ? (
                        <Button className="py-1.5" onClick={() => setInvStatus(inv.id, "Submitted")}>Submit</Button>
                      ) : null}
                      {inv.status === "Submitted" ? (
                        <>
                          <Button className="py-1.5" onClick={() => setInvStatus(inv.id, "Approved")}>Approve</Button>
                          <Button variant="secondary" className="py-1.5" onClick={() => setInvStatus(inv.id, "Rejected", "Mismatch or missing documents")}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {inv.status === "Approved" ? (
                        <Button className="py-1.5" onClick={() => setInvStatus(inv.id, "Posted")}>Post</Button>
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
        title="Create Supplier Invoice"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice No</div>
            <Input value={form.invNo} onChange={(e) => setForm((s) => ({ ...s, invNo: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Supplier</div>
            <Select value={form.supplierId} onChange={(e) => setForm((s) => ({ ...s, supplierId: e.target.value }))}>
              {state.suppliers.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === "Blacklisted"}>
                  {s.name} {s.status === "Blacklisted" ? "(Blacklisted)" : ""}
                </option>
              ))}
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

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Currency</div>
            <Select value={form.currency} onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value as any }))}>
              <option value="TND">TND</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">PO (optional)</div>
            <Select value={form.poId} onChange={(e) => setForm((s) => ({ ...s, poId: e.target.value }))}>
              <option value="">None</option>
              {state.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.poNo}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Receipts (validated)</div>
            <Select
              value={form.receiptIds[0] ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, receiptIds: e.target.value ? [e.target.value] : [] }))}
            >
              <option value="">None</option>
              {state.receipts
                .filter((r) => r.status === "Validated")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.grNo}
                  </option>
                ))}
            </Select>
          </div>

          <div className="md:col-span-2 mt-2 text-sm font-semibold">Single line (PFE demo)</div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Item</div>
            <Input value={form.item} onChange={(e) => setForm((s) => ({ ...s, item: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Qty</div>
            <Input type="number" min={1} value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Unit Price (HT)</div>
            <Input type="number" min={0} value={form.unitPriceHT} onChange={(e) => setForm((s) => ({ ...s, unitPriceHT: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Tax Rate</div>
            <Input type="number" step="0.01" min={0} value={form.taxRate} onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!view}
        title={view ? `Invoice ${view.invNo}` : "Invoice"}
        onClose={() => setView(null)}
        footer={<Button variant="secondary" onClick={() => setView(null)}>Close</Button>}
      >
        {!view ? null : (() => {
          const po = view.poId ? poById[view.poId] : undefined;
          const receipts = view.receiptIds
            .map((id) => receiptById[id])
            .filter((r): r is NonNullable<typeof r> => Boolean(r));
          const match = threeWayMatch({ po, receipts, inv: view });

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Supplier</div>
                  <div className="mt-1 font-semibold">{supplierById[view.supplierId]?.name ?? "Unknown"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-sm text-slate-500 dark:text-slate-400">PO / Receipts</div>
                  <div className="mt-1 font-semibold">{po?.poNo ?? "—"} / {view.receiptIds.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Match</div>
                  <div className="mt-1 font-semibold">{match.status}</div>
                </div>
              </div>

              <div className="text-sm font-semibold">3-way match details</div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Item</th>
                      <th className="px-4 py-3 text-left font-semibold">PO Qty</th>
                      <th className="px-4 py-3 text-left font-semibold">Received Qty</th>
                      <th className="px-4 py-3 text-left font-semibold">Invoiced Qty</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {match.lines.map((l) => (
                      <tr key={l.item} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium">{l.item}</td>
                        <td className="px-4 py-3">{l.poQty}</td>
                        <td className="px-4 py-3">{l.receivedQty}</td>
                        <td className="px-4 py-3">{l.invoicedQty}</td>
                        <td className="px-4 py-3">
                          <Badge variant={l.status === "OK" ? "success" : "warning"}>{l.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {view.status === "Rejected" ? (
                <div className="text-sm text-red-600 dark:text-red-400">Rejection reason: {view.rejectionReason ?? "—"}</div>
              ) : null}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}


