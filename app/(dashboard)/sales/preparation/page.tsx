"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useMemo, useState } from "react";
import { Order, useSales } from "../store";

function prepEligible(o: Order) {
  return o.status === "Reserved";
}

export default function SalesPreparationPage() {
  const { state, dispatch } = useSales();

  const [q, setQ] = useState("");
  const [strategy, setStrategy] = useState<"FIFO" | "BATCH">("FIFO");

  const queue = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = state.orders.filter(prepEligible).filter((o) => {
      return !query || o.orderNo.toLowerCase().includes(query) || o.customerName.toLowerCase().includes(query);
    });

    if (strategy === "FIFO") {
      return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    // batch: group by promised date
    return [...list].sort((a, b) => a.promisedDate.localeCompare(b.promisedDate));
  }, [state.orders, q, strategy]);

  return (
    <div className="space-y-6">
      <Topbar title="Preparation" subtitle="Picking strategy, packing validation, documents" />

      <Card>
        <CardHeader
          title="Preparation Queue"
          subtitle="Orders with reserved stock ready for picking"
          right={<Button variant="secondary">Print Picking List</Button>}
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order/customer..." />
            <Select value={strategy} onChange={(e) => setStrategy(e.target.value as any)}>
              <option value="FIFO">Picking Strategy: FIFO</option>
              <option value="BATCH">Picking Strategy: Batch</option>
            </Select>
            <div className="text-sm text-slate-500 dark:text-slate-400 md:col-span-2 flex items-center">
              Validate preparation to move order to “Prepared”.
            </div>
          </div>

          <Table headers={["Order", "Customer", "Promised (SLA)", "Lines", "Status", "Action"]}>
            {queue.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium">{o.orderNo}</td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3">{o.promisedDate}</td>
                <td className="px-4 py-3">{o.lines.length}</td>
                <td className="px-4 py-3"><Badge variant="info">Reserved</Badge></td>
                <td className="px-4 py-3">
                  <Button
                    className="py-1.5"
                    onClick={() => dispatch({ type: "ORDER_MARK_PREPARED", payload: { orderId: o.id } })}
                  >
                    Validate Preparation
                  </Button>
                </td>
              </tr>
            ))}
          </Table>

          {queue.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No reserved orders in preparation queue.
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
