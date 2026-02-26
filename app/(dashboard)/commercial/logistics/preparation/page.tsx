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
import { Order, useSales } from "../../store";

function prepEligible(o: Order) {
  return o.status === "Reserved";
}

export default function SalesPreparationPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [strategy, setStrategy] = useState<"FIFO" | "BATCH">("FIFO");
  
  // Modal state for viewing the Picking List
  const [openPicking, setOpenPicking] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const queue = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = state.orders.filter(prepEligible).filter((o) => {
      return !query || o.orderNo.toLowerCase().includes(query) || o.customerName.toLowerCase().includes(query);
    });

    if (strategy === "FIFO") {
      // FIFO: Sort by creation date (oldest first)
      return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    // BATCH: Sort by SLA / Promised date (most urgent first)
    return [...list].sort((a, b) => a.promisedDate.localeCompare(b.promisedDate));
  }, [state.orders, q, strategy]);

  const handleOpenPickingList = (o: Order) => {
    setSelectedOrder(o);
    setOpenPicking(true);
  };

  const handleValidatePreparation = (orderId: string) => {
    dispatch({ type: "ORDER_MARK_PREPARED", payload: { orderId } });
    setOpenPicking(false);
  };

  return (
    <div className="space-y-6 p-6">
      <Topbar 
        title="Warehouse Preparation" 
        subtitle="Manage picking strategies (FIFO/Batch), picking lists, and packing validation" 
      />

      <Card>
        <CardHeader
          title="Preparation Queue"
          subtitle="Orders with reserved stock ready for picking and packing"
          right={<Button variant="secondary">Print All Picking Lists</Button>}
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order or customer..." />
            <Select value={strategy} onChange={(e) => setStrategy(e.target.value as any)}>
              <option value="FIFO">Picking Strategy: FIFO (Creation Date)</option>
              <option value="BATCH">Picking Strategy: Batch (Urgency/SLA)</option>
            </Select>
            <div className="text-sm text-slate-500 dark:text-slate-400 md:col-span-2 flex items-center">
              Review the picking list and validate packing to move the order to "Prepared".
            </div>
          </div>

          <Table headers={["Order No", "Customer", "Promised (SLA)", "Items to Pick", "Status", "Actions"]}>
            {queue.map((o) => {
              const totalItems = o.lines.reduce((sum, line) => sum + line.reservedQty, 0);
              const isLate = o.promisedDate < new Date().toISOString().slice(0, 10);

              return (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{o.orderNo}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{o.promisedDate}</span>
                      {isLate && <Badge variant="danger">Urgent</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                    {totalItems} units ({o.lines.length} SKUs)
                  </td>
                  <td className="px-4 py-3"><Badge variant="info">Ready to Pick</Badge></td>
                  <td className="px-4 py-3">
                    <Button
                      variant="secondary"
                      className="py-1.5"
                      onClick={() => handleOpenPickingList(o)}
                    >
                      View Picking List
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>

          {queue.length === 0 ? (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No reserved orders in the preparation queue right now.
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* PICKING LIST MODAL */}
      <Modal
        open={openPicking}
        title={selectedOrder ? `Picking List: ${selectedOrder.orderNo}` : "Picking List"}
        onClose={() => setOpenPicking(false)}
        footer={
          selectedOrder ? (
            <>
              <Button variant="secondary" onClick={() => setOpenPicking(false)}>Cancel</Button>
              <Button onClick={() => handleValidatePreparation(selectedOrder.id)}>Validate Packing</Button>
            </>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-sm text-slate-500 dark:text-slate-400">Customer</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{selectedOrder.customerName}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Promised Date</div>
                  <div className="mt-1 font-semibold text-slate-900 dark:text-white">{selectedOrder.promisedDate}</div>
                </div>
                <Button variant="secondary" className="py-1 px-3 text-xs">Print Slip</Button>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Items to Pick</div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">SKU / Ref</th>
                      <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-emerald-600 dark:text-emerald-400">Qty to Pick</th>
                      <th className="px-4 py-3 text-left font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedOrder.lines.map((l) => {
                      // Only show lines that actually have reserved quantities to pick
                      if (l.reservedQty <= 0) return null;
                      
                      return (
                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{l.productRef}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{l.productName}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-lg">{l.reservedQty}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">Zone A</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                Only items with reserved stock are shown on the picking list. Backordered items will be processed separately when stock arrives.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}