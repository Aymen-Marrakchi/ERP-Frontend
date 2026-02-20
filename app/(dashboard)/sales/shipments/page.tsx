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
import { Shipment, ShipmentStatus, useSales } from "../store";

function badgeForShipmentStatus(s: ShipmentStatus) {
  if (s === "Prepared") return { variant: "info" as const, label: "Prepared" };
  if (s === "Shipped") return { variant: "warning" as const, label: "Shipped" };
  if (s === "Delayed") return { variant: "danger" as const, label: "Delayed" };
  return { variant: "success" as const, label: "Delivered" };
}

export default function SalesShipmentsPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ShipmentStatus>("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    orderId: state.orders[0]?.id ?? "",
    transporter: "Carrier A",
    trackingNo: "",
  });

  const orderById = useMemo(() => Object.fromEntries(state.orders.map((o) => [o.id, o])), [state.orders]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.shipments.filter((s) => {
      const order = orderById[s.orderId];
      const text = `${s.shipmentNo} ${s.trackingNo} ${order?.orderNo ?? ""}`.toLowerCase();
      const matchQ = !query || text.includes(query);
      const matchS = !status || s.status === status;
      return matchQ && matchS;
    });
  }, [state.shipments, q, status, orderById]);

  const createShipment = () => {
    if (!form.orderId || !form.trackingNo.trim()) return;
    const sh: Shipment = {
      id: `s-${Date.now()}`,
      shipmentNo: `SHP-${String(Date.now()).slice(-4)}`,
      orderId: form.orderId,
      transporter: form.transporter.trim() || "Carrier",
      trackingNo: form.trackingNo.trim(),
      status: "Prepared",
    };
    dispatch({ type: "SHIPMENT_CREATE", payload: sh });
    setOpen(false);
    setForm((s) => ({ ...s, trackingNo: "" }));
  };

  const updateStatus = (shipmentId: string, newStatus: ShipmentStatus) => {
    dispatch({ type: "SHIPMENT_UPDATE_STATUS", payload: { shipmentId, status: newStatus } });
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Shipments"
        subtitle="Tracking numbers and delivery status updates"
        right={<Button onClick={() => setOpen(true)}>Create Shipment</Button>}
      />

      <Card>
        <CardHeader
          title="Shipment List"
          subtitle="Manual updates (transporter API can be connected later)"
          right={<Button variant="secondary">Export</Button>}
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shipment/order/tracking..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Status</option>
              <option value="Prepared">Prepared</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
            </Select>
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Use status updates for SLA monitoring.
            </div>
          </div>

          <Table headers={["Shipment", "Order", "Transporter", "Tracking", "Status", "Actions"]}>
            {filtered.map((s) => {
              const st = badgeForShipmentStatus(s.status);
              const order = orderById[s.orderId];
              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{s.shipmentNo}</td>
                  <td className="px-4 py-3">{order?.orderNo ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.transporter}</td>
                  <td className="px-4 py-3">{s.trackingNo}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" className="py-1.5" onClick={() => updateStatus(s.id, "Shipped")}>
                        Mark Shipped
                      </Button>
                      <Button variant="secondary" className="py-1.5" onClick={() => updateStatus(s.id, "Delivered")}>
                        Mark Delivered
                      </Button>
                      <Button variant="secondary" className="py-1.5" onClick={() => updateStatus(s.id, "Delayed")}>
                        Mark Delayed
                      </Button>
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
        title="Create Shipment"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createShipment}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Order</div>
            <Select value={form.orderId} onChange={(e) => setForm((s) => ({ ...s, orderId: e.target.value }))}>
              {state.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNo} — {o.customerName} ({o.status})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Transporter</div>
            <Input value={form.transporter} onChange={(e) => setForm((s) => ({ ...s, transporter: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Tracking Number</div>
            <Input value={form.trackingNo} onChange={(e) => setForm((s) => ({ ...s, trackingNo: e.target.value }))} placeholder="TRK..." />
          </div>
          <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">
            Shipment starts as “Prepared”, then you update status as it moves through transport.
          </div>
        </div>
      </Modal>
    </div>
  );
}
