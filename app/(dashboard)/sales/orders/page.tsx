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
import { Order, OrderStatus, useSales } from "../store";

function badgeForOrderStatus(s: OrderStatus) {
  if (s === "New") return { variant: "neutral" as const, label: "New" };
  if (s === "Confirmed") return { variant: "info" as const, label: "Confirmed" };
  if (s === "Reserved") return { variant: "info" as const, label: "Reserved" };
  if (s === "Prepared") return { variant: "warning" as const, label: "Prepared" };
  if (s === "Shipped") return { variant: "warning" as const, label: "Shipped" };
  if (s === "Delivered") return { variant: "success" as const, label: "Delivered" };
  return { variant: "success" as const, label: "Closed" };
}

function badgeForStockState(s: Order["stockState"]) {
  if (s === "Reserved") return { variant: "success" as const, label: "Reserved" };
  if (s === "Partial") return { variant: "warning" as const, label: "Partial" };
  if (s === "Backorder") return { variant: "danger" as const, label: "Backorder" };
  return { variant: "neutral" as const, label: "None" };
}

function orderTotal(o: Order) {
  return o.lines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);
}

export default function SalesOrdersPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [stockState, setStockState] = useState<"" | Order["stockState"]>("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

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
    setOpen(true);
  };

  const actionBar = (o: Order) => {
    return (
      <div className="flex flex-wrap gap-2">
        {o.status === "New" ? (
          <Button onClick={() => dispatch({ type: "ORDER_CONFIRM", payload: { orderId: o.id } })}>
            Confirm
          </Button>
        ) : null}

        {o.status === "Confirmed" ? (
          <Button onClick={() => dispatch({ type: "ORDER_RESERVE", payload: { orderId: o.id } })}>
            Reserve Stock
          </Button>
        ) : null}

        {o.status === "Reserved" ? (
          <Button onClick={() => dispatch({ type: "ORDER_MARK_PREPARED", payload: { orderId: o.id } })}>
            Mark Prepared
          </Button>
        ) : null}

        {o.status === "Delivered" ? (
          <Button onClick={() => dispatch({ type: "ORDER_CLOSE", payload: { orderId: o.id } })}>
            Close Order
          </Button>
        ) : null}

        <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Orders"
        subtitle="Lifecycle, stock reservation/backorder, SLA promised dates"
        right={<Button variant="secondary">Export</Button>}
      />

      <Card>
        <CardHeader
          title="Order List"
          subtitle="New → Confirmed → Reserved → Prepared → Shipped → Delivered → Closed"
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order or customer..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Status</option>
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
              <option value="None">None</option>
            </Select>
            <Button variant="secondary">Export</Button>
          </div>

          <Table headers={["Order", "Customer", "Status", "SLA (Promised)", "Stock", "Total", "Actions"]}>
            {filtered.map((o) => {
              const os = badgeForOrderStatus(o.status);
              const ss = badgeForStockState(o.stockState);
              const total = orderTotal(o);
              const isLate = o.promisedDate < new Date().toISOString().slice(0, 10) && o.status !== "Delivered" && o.status !== "Closed";

              return (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{o.orderNo}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3"><Badge variant={os.variant}>{os.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{o.promisedDate}</span>
                      {isLate ? <Badge variant="danger">Late</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={ss.variant}>{ss.label}</Badge></td>
                  <td className="px-4 py-3">{total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" className="py-1.5" onClick={() => openDetails(o)}>
                        View
                      </Button>
                      {o.status === "Confirmed" ? (
                        <Button className="py-1.5" onClick={() => dispatch({ type: "ORDER_RESERVE", payload: { orderId: o.id } })}>
                          Reserve
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>

          {filtered.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">No orders match your filters.</div>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title={selected ? `Order ${selected.orderNo}` : "Order"}
        onClose={() => setOpen(false)}
        footer={selected ? actionBar(selected) : undefined}
      >
        {!selected ? null : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-500 dark:text-slate-400">Customer</div>
                <div className="mt-1 font-semibold">{selected.customerName}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-500 dark:text-slate-400">Promised (SLA)</div>
                <div className="mt-1 font-semibold">{selected.promisedDate}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
                <div className="mt-1 font-semibold">{orderTotal(selected).toLocaleString()}</div>
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
                      <th className="px-4 py-3 text-left font-semibold">Backorder</th>
                      <th className="px-4 py-3 text-left font-semibold">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selected.lines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{l.productName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{l.productRef}</div>
                        </td>
                        <td className="px-4 py-3">{l.qty}</td>
                        <td className="px-4 py-3">{l.reservedQty}</td>
                        <td className="px-4 py-3">{l.backorderQty}</td>
                        <td className="px-4 py-3">{l.unitPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Reservation and backorder are shown at line level, as required by the sales/logistics specification.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
