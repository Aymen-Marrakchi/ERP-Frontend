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
import { poTotals } from "../../store";
import type { PurchaseOrder, PurchaseOrderStatus } from "../../store";
import { usePurchases } from "../store";

function badgeForPoStatus(s: PurchaseOrderStatus) {
  if (s === "Draft") return { variant: "neutral" as const, label: "Draft" };
  if (s === "Validated") return { variant: "info" as const, label: "Validated" };
  if (s === "Sent") return { variant: "warning" as const, label: "Sent" };
  if (s === "Partially Received") return { variant: "warning" as const, label: "Partial" };
  if (s === "Received") return { variant: "success" as const, label: "Received" };
  return { variant: "success" as const, label: "Closed" };
}

export default function PurchaseOrdersPage() {
  const { state, dispatch } = usePurchases();

  // Create a map for quick supplier lookup
  const supplierById = useMemo(() => Object.fromEntries(state.suppliers.map((s) => [s.id, s])), [state.suppliers]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);

  const [form, setForm] = useState({
    supplierId: "",
    poNo: `PO-${String(Date.now()).slice(-4)}`,
    expectedDelivery: new Date().toISOString().slice(0, 10),
    currency: "TND" as "TND" | "EUR" | "USD",
    paymentTerms: "30 days",
    deliveryTerms: "Delivery to warehouse",
    item: "Product A",
    qty: "1",
    unit: "pcs",
    unitPriceHT: "0",
    taxRate: "0.19",
    discount: "0",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    // Safe fallback if orders array is undefined
    const orders = state.orders || [];
    
    return orders.filter((po) => {
      const sup = supplierById[po.supplierId]?.name ?? "";
      const matchQ = !query || po.poNo.toLowerCase().includes(query) || sup.toLowerCase().includes(query);
      const matchS = !status || po.status === status;
      return matchQ && matchS;
    });
  }, [state.orders, q, status, supplierById]);

  const openCreate = () => {
    setEditing(null);
    const firstActive = state.suppliers.find((s) => s.status === "Active")?.id ?? "";
    setForm({
      supplierId: firstActive,
      poNo: `PO-${String(Date.now()).slice(-4)}`,
      expectedDelivery: new Date().toISOString().slice(0, 10),
      currency: "TND",
      paymentTerms: "30 days",
      deliveryTerms: "Delivery to warehouse",
      item: "Product A",
      qty: "1",
      unit: "pcs",
      unitPriceHT: "0",
      taxRate: "0.19",
      discount: "0",
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.supplierId || !form.poNo.trim()) return;

    const po: PurchaseOrder = {
      id: editing?.id ?? `po-${Date.now()}`,
      poNo: form.poNo.trim(),
      supplierId: form.supplierId,
      status: editing?.status ?? "Draft",
      createdAt: editing?.createdAt ?? new Date().toISOString().slice(0, 10),
      expectedDelivery: form.expectedDelivery,
      paymentTerms: form.paymentTerms,
      deliveryTerms: form.deliveryTerms,
      currency: form.currency,
      lines: editing?.lines?.length
        ? editing.lines
        : [
            {
              id: `pol-${Date.now()}`,
              item: form.item.trim(),
              qty: Number(form.qty) || 1,
              unit: form.unit.trim() || "pcs",
              unitPriceHT: Number(form.unitPriceHT) || 0,
              taxRate: Number(form.taxRate) || 0,
              discount: Number(form.discount) || 0,
            },
          ],
    };

    if (editing) dispatch({ type: "PO_UPDATE", payload: po });
    else dispatch({ type: "PO_CREATE", payload: po });

    setOpen(false);
  };

  const setPoStatus = (poId: string, next: PurchaseOrderStatus) =>
    dispatch({ type: "PO_SET_STATUS", payload: { poId, status: next } });

  return (
    <div className="space-y-6">
      <Topbar 
        title="Purchase Orders (BC)" 
        subtitle="Create, validate and send orders to suppliers" 
        right={<Button onClick={openCreate}>+ Create PO</Button>} 
      />

      <Card>
        <CardHeader title="Order List" subtitle="Draft → Validated → Sent → Received" right={<Button variant="secondary">Export List</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PO No or Supplier..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Validated">Validated</option>
              <option value="Sent">Sent</option>
              <option value="Received">Received</option>
              <option value="Closed">Closed</option>
            </Select>
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              "Received" status is usually set automatically by the Goods Receipt (BR) module.
            </div>
          </div>

          <Table headers={["PO No", "Supplier", "Delivery Date", "Total TTC", "Status", "Actions"]}>
            {filtered.map((po) => {
              const sup = supplierById[po.supplierId];
              const totals = poTotals(po); // Using the helper from store
              const st = badgeForPoStatus(po.status);

              return (
                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{po.poNo}</td>
                  <td className="px-4 py-3">{sup?.name ?? <span className="text-rose-500">Unknown Supplier</span>}</td>
                  <td className="px-4 py-3">{po.expectedDelivery}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {totals.ttc.toLocaleString(undefined, { minimumFractionDigits: 3 })} {po.currency}
                  </td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" className="py-1.5" onClick={() => { setEditing(po); setOpen(true); }}>
                        Edit
                      </Button>

                      {po.status === "Draft" && (
                        <Button className="py-1.5" onClick={() => setPoStatus(po.id, "Validated")}>Validate</Button>
                      )}

                      {po.status === "Validated" && (
                        <Button className="py-1.5" onClick={() => setPoStatus(po.id, "Sent")}>Send</Button>
                      )}

                      {po.status === "Received" && (
                        <Button className="py-1.5" onClick={() => setPoStatus(po.id, "Closed")}>Close</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
          
          {filtered.length === 0 && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No purchase orders found.
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title={editing ? `Edit ${editing.poNo}` : "Create Purchase Order"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save PO</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
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
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">PO Number</div>
            <Input value={form.poNo} onChange={(e) => setForm((s) => ({ ...s, poNo: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Expected Delivery</div>
            <Input type="date" value={form.expectedDelivery} onChange={(e) => setForm((s) => ({ ...s, expectedDelivery: e.target.value }))} />
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
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Terms</div>
            <Input value={form.paymentTerms} onChange={(e) => setForm((s) => ({ ...s, paymentTerms: e.target.value }))} />
          </div>

          <div className="md:col-span-2 border-t pt-2 mt-2 text-sm font-semibold">Line Item (Demo)</div>

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
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Tax Rate (0.19)</div>
            <Input type="number" step="0.01" min={0} value={form.taxRate} onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Discount (0.05)</div>
            <Input type="number" step="0.01" min={0} max={1} value={form.discount} onChange={(e) => setForm((s) => ({ ...s, discount: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

