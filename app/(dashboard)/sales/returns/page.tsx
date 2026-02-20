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
import { RMA, RmaDecision, RmaStatus, useSales } from "../store";

function badgeForRmaStatus(s: RmaStatus) {
  if (s === "Created") return { variant: "info" as const, label: "Created" };
  if (s === "Received") return { variant: "warning" as const, label: "Received" };
  if (s === "Inspected") return { variant: "warning" as const, label: "Inspected" };
  return { variant: "success" as const, label: "Closed" };
}

export default function SalesReturnsPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    orderId: state.orders[0]?.id ?? "",
    productRef: "SKU-001",
    reason: "Damaged",
    decision: "Restock" as RmaDecision,
  });

  const orderById = useMemo(() => Object.fromEntries(state.orders.map((o) => [o.id, o])), [state.orders]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.rmas.filter((r) => {
      const order = orderById[r.orderId];
      const text = `${r.rmaNo} ${order?.orderNo ?? ""} ${r.productRef}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [state.rmas, q, orderById]);

  const createRma = () => {
    if (!form.orderId || !form.productRef.trim() || !form.reason.trim()) return;

    const r: RMA = {
      id: `r-${Date.now()}`,
      rmaNo: `RMA-${String(Date.now()).slice(-4)}`,
      orderId: form.orderId,
      productRef: form.productRef.trim(),
      reason: form.reason.trim(),
      decision: form.decision,
      status: "Created",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    dispatch({ type: "RMA_CREATE", payload: r });
    setOpen(false);
  };

  const updateStatus = (rmaId: string, status: RmaStatus) => {
    dispatch({ type: "RMA_UPDATE_STATUS", payload: { rmaId, status } });
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Returns (RMA)"
        subtitle="Create returns, decide restock/destruction/credit note, track status"
        right={<Button onClick={() => setOpen(true)}>Create RMA</Button>}
      />

      <Card>
        <CardHeader title="RMA List" subtitle="Created → Received → Inspected → Closed" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search RMA/order/product..." />
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Use status changes to keep traceability of returns.
            </div>
          </div>

          <Table headers={["RMA", "Order", "Product Ref", "Reason", "Decision", "Status", "Actions"]}>
            {filtered.map((r) => {
              const order = orderById[r.orderId];
              const st = badgeForRmaStatus(r.status);
              return (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{r.rmaNo}</td>
                  <td className="px-4 py-3">{order?.orderNo ?? "Unknown"}</td>
                  <td className="px-4 py-3">{r.productRef}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.reason}</td>
                  <td className="px-4 py-3">{r.decision}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" className="py-1.5" onClick={() => updateStatus(r.id, "Received")}>Mark Received</Button>
                      <Button variant="secondary" className="py-1.5" onClick={() => updateStatus(r.id, "Inspected")}>Mark Inspected</Button>
                      <Button className="py-1.5" onClick={() => updateStatus(r.id, "Closed")}>Close</Button>
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
        title="Create RMA"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createRma}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Order</div>
            <Select value={form.orderId} onChange={(e) => setForm((s) => ({ ...s, orderId: e.target.value }))}>
              {state.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNo} — {o.customerName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Product Ref</div>
            <Input value={form.productRef} onChange={(e) => setForm((s) => ({ ...s, productRef: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Decision</div>
            <Select value={form.decision} onChange={(e) => setForm((s) => ({ ...s, decision: e.target.value as any }))}>
              <option value="Restock">Restock</option>
              <option value="Destroy">Destroy</option>
              <option value="Credit Note">Credit Note</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reason</div>
            <Input value={form.reason} onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))} />
          </div>

          <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">
            The decision drives what happens after inspection (restock, destruction, or credit note creation in finance later).
          </div>
        </div>
      </Modal>
    </div>
  );
}
