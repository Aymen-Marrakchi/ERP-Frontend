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
import { Shipment, ShipmentStatus, useSales } from "../../store";

function badgeForShipmentStatus(s: ShipmentStatus) {
  if (s === "Prepared") return { variant: "info" as const, label: "Prepared" };
  if (s === "Shipped") return { variant: "warning" as const, label: "In Transit" };
  if (s === "Delayed") return { variant: "danger" as const, label: "Delayed" };
  return { variant: "success" as const, label: "Delivered" };
}

export default function SalesShipmentsPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ShipmentStatus>("");

  const [open, setOpen] = useState(false);
  
  // Filter for orders that are actually ready to be shipped
  const preparedOrders = useMemo(() => {
    return state.orders.filter(o => o.status === "Prepared");
  }, [state.orders]);

  const [form, setForm] = useState({
    orderId: preparedOrders[0]?.id ?? "",
    transporter: "Carrier A",
    trackingNo: "",
  });

  const orderById = useMemo(() => Object.fromEntries(state.orders.map((o) => [o.id, o])), [state.orders]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.shipments.filter((s) => {
      const order = orderById[s.orderId];
      const text = `${s.shipmentNo} ${s.trackingNo} ${order?.orderNo ?? ""} ${s.transporter}`.toLowerCase();
      const matchQ = !query || text.includes(query);
      const matchS = !status || s.status === status;
      return matchQ && matchS;
    });
  }, [state.shipments, q, status, orderById]);

  const handleOpenCreate = () => {
    setForm(s => ({
      ...s,
      orderId: preparedOrders[0]?.id ?? "",
      trackingNo: ""
    }));
    setOpen(true);
  };

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
    
    // Automatically update the order status to "Shipped" since a shipment was generated
    dispatch({ type: "ORDER_UPDATE", payload: { ...orderById[form.orderId], status: "Shipped" }});
    
    setOpen(false);
  };

  const updateStatus = (shipmentId: string, orderId: string, newStatus: ShipmentStatus) => {
    dispatch({ type: "SHIPMENT_UPDATE_STATUS", payload: { shipmentId, status: newStatus } });
    
    // Cross-module sync: If logistics marks it delivered, sales needs to see it delivered!
    if (newStatus === "Delivered") {
      dispatch({ type: "ORDER_MARK_DELIVERED", payload: { orderId } });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Shipments & Dispatch"
        subtitle="Manage carrier assignments, tracking numbers, and delivery states"
        right={<Button onClick={handleOpenCreate}>+ Create Shipment</Button>}
      />

      <Card>
        <CardHeader
          title="Active Shipments"
          subtitle="Monitor packages from warehouse dispatch to customer delivery"
          right={<Button variant="secondary">Export Manifest</Button>}
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tracking, order, carrier..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Statuses</option>
              <option value="Prepared">Prepared (Awaiting Pickup)</option>
              <option value="Shipped">In Transit</option>
              <option value="Delayed">Delayed</option>
              <option value="Delivered">Delivered</option>
            </Select>
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Timely status updates are critical for calculating accurate SLA performance.
            </div>
          </div>

          <Table headers={["Shipment ID", "Order No", "Transporter", "Tracking No", "Status", "Actions"]}>
            {filtered.map((s) => {
              const st = badgeForShipmentStatus(s.status);
              const order = orderById[s.orderId];
              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.shipmentNo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{order?.orderNo ?? "Unknown"}</td>
                  <td className="px-4 py-3 font-medium">{s.transporter}</td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    {s.trackingNo}
                  </td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {/* Progressive workflow actions */}
                      {s.status === "Prepared" && (
                        <Button className="py-1.5" onClick={() => updateStatus(s.id, s.orderId, "Shipped")}>
                          Dispatch Package
                        </Button>
                      )}
                      
                      {(s.status === "Shipped" || s.status === "Delayed") && (
                        <>
                          <Button className="py-1.5" onClick={() => updateStatus(s.id, s.orderId, "Delivered")}>
                            Mark Delivered
                          </Button>
                          {s.status !== "Delayed" && (
                            <Button variant="secondary" className="py-1.5 text-rose-600" onClick={() => updateStatus(s.id, s.orderId, "Delayed")}>
                              Report Delay
                            </Button>
                          )}
                        </>
                      )}

                      {s.status === "Delivered" && (
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
              No shipments found matching your criteria.
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Create Outbound Shipment"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createShipment}>Generate Shipment</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Prepared Order (Ready to Ship)</div>
            <Select value={form.orderId} onChange={(e) => setForm((s) => ({ ...s, orderId: e.target.value }))} disabled={preparedOrders.length === 0}>
              {preparedOrders.length === 0 ? (
                <option value="">No prepared orders available</option>
              ) : (
                preparedOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo} — {o.customerName}
                  </option>
                ))
              )}
            </Select>
            {preparedOrders.length === 0 && (
              <div className="mt-1 text-xs text-rose-500">
                You must validate the packing of an order in the Preparation queue before shipping it.
              </div>
            )}
          </div>
          
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Carrier / Transporter</div>
            <Select value={form.transporter} onChange={(e) => setForm((s) => ({ ...s, transporter: e.target.value }))}>
              <option value="Carrier A">Carrier A (Standard)</option>
              <option value="Carrier B">Carrier B (Express)</option>
              <option value="In-House Fleet">In-House Fleet</option>
            </Select>
          </div>
          
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Tracking Number</div>
            <Input value={form.trackingNo} onChange={(e) => setForm((s) => ({ ...s, trackingNo: e.target.value }))} placeholder="e.g. TRK-998234..." />
          </div>
          
          <div className="md:col-span-2 mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <strong>Note:</strong> Generating a shipment will automatically update the selected Sales Order's status from "Prepared" to "Shipped".
          </div>
        </div>
      </Modal>
    </div>
  );
}