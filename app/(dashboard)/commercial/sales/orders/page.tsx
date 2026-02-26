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
import { Order, OrderStatus, OrderLine, useSales } from "../../store";

// Tunisian Dinar Formatting (3 decimals)
function money(n: number) {
  return n.toFixed(3) + " TND";
}

function badgeForOrderStatus(s: OrderStatus) {
  if (s === "New") return { variant: "neutral" as const, label: "New" };
  if (s === "Confirmed") return { variant: "info" as const, label: "Confirmed" };
  if (s === "Reserved") return { variant: "success" as const, label: "Reserved" };
  if (s === "Prepared") return { variant: "warning" as const, label: "Prepared" };
  if (s === "Shipped") return { variant: "info" as const, label: "Shipped" };
  if (s === "Delivered") return { variant: "success" as const, label: "Delivered" };
  return { variant: "neutral" as const, label: "Closed" };
}

function badgeForStockState(s: Order["stockState"]) {
  if (s === "Reserved") return { variant: "success" as const, label: "Reserved" };
  if (s === "Partial") return { variant: "warning" as const, label: "Partial" };
  if (s === "Backorder") return { variant: "danger" as const, label: "Backorder" };
  return { variant: "neutral" as const, label: "Unallocated" };
}

function orderTotal(o: Order) {
  return o.lines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);
}

export default function SalesOrdersPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [stockState, setStockState] = useState<"" | Order["stockState"]>("");

  // Modals state
  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    orderNo: "",
    customerName: "",
    promisedDate: new Date().toISOString().slice(0, 10),
    notes: "",
    lines: [] as Omit<OrderLine, "availableQty" | "reservedQty" | "backorderQty">[],
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.orders.filter((o) => {
      const matchQ =
        !query ||
        o.orderNo.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query);
      const matchS = !status || o.status === status;
      const matchStock = !stockState || o.stockState === stockState;
      return matchQ && matchS && matchStock;
    });
  }, [state.orders, q, status, stockState]);

  const openDetails = (o: Order) => {
    setSelected(o);
    setOpenView(true);
  };

  const handleOpenCreate = () => {
    setForm({
      orderNo: `SO-${String(Date.now()).slice(-5)}`,
      customerName: "",
      promisedDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      notes: "",
      lines: [{ id: `l-${Date.now()}`, productRef: "", productName: "", qty: 1, unitPrice: 0 }],
    });
    setOpenCreate(true);
  };

  const saveNewOrder = () => {
    if (!form.orderNo.trim() || !form.customerName.trim() || form.lines.length === 0) return;

    const formattedLines: OrderLine[] = form.lines.map(l => ({
      ...l,
      qty: Number(l.qty),
      unitPrice: Number(l.unitPrice),
      availableQty: 100, // Simulation stock
      reservedQty: 0,
      backorderQty: 0,
    }));

    const order: Order = {
      id: `o-${Date.now()}`,
      orderNo: form.orderNo,
      customerName: form.customerName,
      createdAt: new Date().toISOString().slice(0, 10),
      promisedDate: form.promisedDate,
      status: "New",
      stockState: "None",
      notes: form.notes,
      lines: formattedLines,
    };

    dispatch({ type: "ORDER_CREATE", payload: order });
    setOpenCreate(false);
  };

  const actionBar = (o: Order) => {
    return (
      <div className="flex flex-wrap gap-2">
        {o.status === "New" && (
          <Button onClick={() => dispatch({ type: "ORDER_CONFIRM", payload: { orderId: o.id } })}>
            Confirm
          </Button>
        )}

        {o.status === "Confirmed" && (
          <Button onClick={() => dispatch({ type: "ORDER_RESERVE", payload: { orderId: o.id } })}>
            Reserve Stock
          </Button>
        )}

        {o.status === "Reserved" && (
          <Button onClick={() => dispatch({ type: "ORDER_MARK_PREPARED", payload: { orderId: o.id } })}>
            Mark Prepared
          </Button>
        )}

        {o.status === "Delivered" && (
          <Button onClick={() => dispatch({ type: "ORDER_CLOSE", payload: { orderId: o.id } })}>
            Close Order
          </Button>
        )}

        <Button variant="secondary" onClick={() => setOpenView(false)}>Close</Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Sales Orders"
        subtitle="Lifecycle, stock reservation, and promised delivery dates (SLA)"
        right={<Button onClick={handleOpenCreate}>+ New Order</Button>}
      />

      <Card>
        <CardHeader
          title="Order List"
          subtitle="New → Confirmed → Reserved → Prepared → Shipped → Delivered → Closed"
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order or customer..." />
            
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Reserved">Reserved</option>
              <option value="Prepared">Prepared</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Closed">Closed</option>
            </Select>
            
            <Select value={stockState} onChange={(e) => setStockState(e.target.value as any)}>
              <option value="">Stock State</option>
              <option value="Reserved">Reserved</option>
              <option value="Partial">Partial</option>
              <option value="Backorder">Backorder</option>
              <option value="None">Unallocated</option>
            </Select>
            
            <Button variant="secondary" className="md:col-span-2">Export List</Button>
          </div>

          <Table headers={["Order No", "Customer", "Status", "SLA (Promised)", "Stock State", "Total Excl. Tax", "Actions"]}>
            {filtered.map((o) => {
              const os = badgeForOrderStatus(o.status);
              const ss = badgeForStockState(o.stockState);
              const total = orderTotal(o);
              const isLate = o.promisedDate < new Date().toISOString().slice(0, 10) && o.status !== "Delivered" && o.status !== "Closed";

              return (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{o.orderNo}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3"><Badge variant={os.variant}>{os.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{o.promisedDate}</span>
                      {isLate ? <Badge variant="danger">Late</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={ss.variant}>{ss.label}</Badge></td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{money(total)}</td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" className="py-1.5" onClick={() => openDetails(o)}>
                      Details & Actions
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>

          {filtered.length === 0 ? (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No orders match your filters.
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* VIEW & ACTION MODAL */}
      <Modal
        open={openView}
        title={selected ? `Order Details ${selected.orderNo}` : "Order"}
        onClose={() => setOpenView(false)}
        footer={selected ? actionBar(selected) : undefined}
      >
        {!selected ? null : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-sm text-slate-500 dark:text-slate-400">Customer</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{selected.customerName}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-sm text-slate-500 dark:text-slate-400">Promised Date (SLA)</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{selected.promisedDate}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/20 dark:bg-emerald-900/10">
                <div className="text-sm text-emerald-700 dark:text-emerald-400">Total Excl. Tax</div>
                <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-400">{money(orderTotal(selected))}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Order Lines</div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">Qty</th>
                      <th className="px-4 py-3 text-left font-semibold">Reserved</th>
                      <th className="px-4 py-3 text-left font-semibold text-rose-600 dark:text-rose-400">Backorder</th>
                      <th className="px-4 py-3 text-left font-semibold">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selected.lines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{l.productName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{l.productRef}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{l.qty}</td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">{l.reservedQty}</td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">{l.backorderQty}</td>
                        <td className="px-4 py-3">{money(l.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                Reservation and backorders are calculated at the line level as per the commercial specifications.
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE MODAL */}
      <Modal
        open={openCreate}
        title="New Sales Order"
        onClose={() => setOpenCreate(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={saveNewOrder}>Create Order</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Order No</div>
              <Input value={form.orderNo} onChange={(e) => setForm(s => ({ ...s, orderNo: e.target.value }))} />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Customer</div>
              <Input value={form.customerName} onChange={(e) => setForm(s => ({ ...s, customerName: e.target.value }))} placeholder="Company name..." />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">SLA (Promised Date)</div>
              <Input type="date" value={form.promisedDate} onChange={(e) => setForm(s => ({ ...s, promisedDate: e.target.value }))} />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Notes (Instructions)</div>
              <Input value={form.notes} onChange={(e) => setForm(s => ({ ...s, notes: e.target.value }))} placeholder="Urgent delivery..." />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Order Lines</h4>
              <Button variant="secondary" className="py-1 text-xs" onClick={() => setForm(s => ({ ...s, lines: [...s.lines, { id: `l-${Date.now()}`, productRef: "", productName: "", qty: 1, unitPrice: 0 }] }))}>
                + Add Item
              </Button>
            </div>
            
            <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3">
              {form.lines.map((line) => (
                <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-end">
                  <div className="flex-1">
                    <div className="mb-1 text-xs font-medium text-slate-500">Ref / SKU</div>
                    <Input value={line.productRef} onChange={(e) => setForm(s => ({ ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, productRef: e.target.value } : l) }))} placeholder="SKU-..." />
                  </div>
                  <div className="flex-[2]">
                    <div className="mb-1 text-xs font-medium text-slate-500">Product Name</div>
                    <Input value={line.productName} onChange={(e) => setForm(s => ({ ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, productName: e.target.value } : l) }))} />
                  </div>
                  <div className="w-24">
                    <div className="mb-1 text-xs font-medium text-slate-500">Qty</div>
                    <Input type="number" min="1" value={line.qty} onChange={(e) => setForm(s => ({ ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, qty: Number(e.target.value) } : l) }))} />
                  </div>
                  <div className="w-32">
                    <div className="mb-1 text-xs font-medium text-slate-500">Unit Price</div>
                    <Input type="number" step="0.001" min="0" value={line.unitPrice} onChange={(e) => setForm(s => ({ ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, unitPrice: Number(e.target.value) } : l) }))} />
                  </div>
                  {form.lines.length > 1 && (
                    <button onClick={() => setForm(s => ({ ...s, lines: s.lines.filter(l => l.id !== line.id) }))} className="mb-2 text-sm text-rose-500 hover:text-rose-700">Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}