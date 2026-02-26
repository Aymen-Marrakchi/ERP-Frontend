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
import { RMA, RmaDecision, RmaStatus, useSales } from "../../store";

function badgeForRmaStatus(s: RmaStatus) {
  if (s === "Created") return { variant: "neutral" as const, label: "Created" };
  if (s === "Received") return { variant: "info" as const, label: "Received" };
  if (s === "Inspected") return { variant: "warning" as const, label: "Inspected" };
  return { variant: "success" as const, label: "Closed" };
}

function badgeForDecision(d: RmaDecision) {
  if (d === "Restock") return { variant: "success" as const, label: "Restock" };
  if (d === "Destroy") return { variant: "danger" as const, label: "Destroy" };
  return { variant: "warning" as const, label: "Credit Note" };
}

export default function SalesReturnsPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  // Default to first order and its first line to prevent empty states
  const firstOrder = state.orders[0];
  const [form, setForm] = useState({
    orderId: firstOrder?.id ?? "",
    productRef: firstOrder?.lines[0]?.productRef ?? "",
    reason: "",
    decision: "Restock" as RmaDecision,
  });

  const orderById = useMemo(() => Object.fromEntries(state.orders.map((o) => [o.id, o])), [state.orders]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.rmas.filter((r) => {
      const order = orderById[r.orderId];
      const text = `${r.rmaNo} ${order?.orderNo ?? ""} ${r.productRef} ${r.reason}`.toLowerCase();
      return !query || text.includes(query);
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.rmas, q, orderById]);

  const handleOrderChange = (newOrderId: string) => {
    const selectedOrder = state.orders.find(o => o.id === newOrderId);
    setForm(s => ({
      ...s,
      orderId: newOrderId,
      // Automatically select the first product of the newly selected order
      productRef: selectedOrder?.lines[0]?.productRef || "",
    }));
  };

  const handleOpenCreate = () => {
    const o = state.orders[0];
    setForm({
      orderId: o?.id ?? "",
      productRef: o?.lines[0]?.productRef ?? "",
      reason: "",
      decision: "Restock",
    });
    setOpen(true);
  };

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

  // Derived state for the modal dropdown
  const selectedOrderObj = state.orders.find(o => o.id === form.orderId);

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Returns (RMA)"
        subtitle="Manage customer returns, inspections, and restock/destroy decisions"
        right={<Button onClick={handleOpenCreate}>+ Create RMA</Button>}
      />

      <Card>
        <CardHeader 
          title="RMA List" 
          subtitle="Lifecycle: Created → Received → Inspected → Closed" 
          right={<Button variant="secondary">Export List</Button>} 
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search RMA, order, or product..." />
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Advance statuses sequentially to maintain traceability of returned goods.
            </div>
          </div>

          <Table headers={["RMA No", "Order No", "Product Ref", "Reason", "Decision", "Status", "Actions"]}>
            {filtered.map((r) => {
              const order = orderById[r.orderId];
              const st = badgeForRmaStatus(r.status);
              const dec = badgeForDecision(r.decision);

              return (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.rmaNo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{order?.orderNo ?? "Unknown"}</td>
                  <td className="px-4 py-3 font-medium">{r.productRef}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-4 py-3"><Badge variant={dec.variant}>{dec.label}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {/* Progressive Workflow Buttons */}
                      {r.status === "Created" && (
                        <Button className="py-1.5" onClick={() => updateStatus(r.id, "Received")}>Mark Received</Button>
                      )}
                      {r.status === "Received" && (
                        <Button className="py-1.5" onClick={() => updateStatus(r.id, "Inspected")}>Mark Inspected</Button>
                      )}
                      {r.status === "Inspected" && (
                        <Button className="py-1.5" onClick={() => updateStatus(r.id, "Closed")}>Close RMA</Button>
                      )}
                      {r.status === "Closed" && (
                        <span className="text-sm font-medium text-slate-400 dark:text-slate-500 py-1.5">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>

          {filtered.length === 0 && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No returns match your search criteria.
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Create Return Merchandise Auth (RMA)"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createRma}>Create RMA</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Original Order</div>
            <Select value={form.orderId} onChange={(e) => handleOrderChange(e.target.value)}>
              {state.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNo} — {o.customerName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Product (From Order)</div>
            <Select value={form.productRef} onChange={(e) => setForm((s) => ({ ...s, productRef: e.target.value }))}>
              {selectedOrderObj?.lines.map(line => (
                <option key={line.id} value={line.productRef}>
                  {line.productRef} - {line.productName}
                </option>
              ))}
              {(!selectedOrderObj || selectedOrderObj.lines.length === 0) && (
                <option value="">No products found</option>
              )}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Target Decision</div>
            <Select value={form.decision} onChange={(e) => setForm((s) => ({ ...s, decision: e.target.value as any }))}>
              <option value="Restock">Restock (Return to Inventory)</option>
              <option value="Destroy">Destroy (Damaged/Unsalvageable)</option>
              <option value="Credit Note">Credit Note (Finance action required)</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reason for Return</div>
            <Input 
              value={form.reason} 
              onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))} 
              placeholder="e.g., Arrived scratched, wrong item sent..." 
            />
          </div>

          <div className="md:col-span-2 mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <strong>Note:</strong> The target decision drives downstream processes. "Restock" will notify the Logistics team to update inventory upon closure.
          </div>
        </div>
      </Modal>
    </div>
  );
}