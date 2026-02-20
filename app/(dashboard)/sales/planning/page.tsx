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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Simple capacity model: max X orders per promised date
const DAILY_CAPACITY = 2;

export default function SalesPlanningPage() {
  const { state } = useSales();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [priority, setPriority] = useState<"" | "High" | "Normal" | "Low">("");

  const relevant = useMemo(() => {
    let list = state.orders.filter((o) => o.status !== "Delivered" && o.status !== "Closed");

    if (from) list = list.filter((o) => o.promisedDate >= from);
    if (to) list = list.filter((o) => o.promisedDate <= to);

    // Priority is simulated from notes or stockState:
    if (priority) {
      list = list.filter((o) => {
        const isHigh = (o.notes ?? "").toLowerCase().includes("urgent") || o.stockState === "Backorder";
        if (priority === "High") return isHigh;
        if (priority === "Low") return !isHigh && o.stockState === "Reserved";
        return true;
      });
    }

    return list;
  }, [state.orders, from, to, priority]);

  const capacityMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of relevant) m[o.promisedDate] = (m[o.promisedDate] ?? 0) + 1;
    return m;
  }, [relevant]);

  const rows = useMemo(() => {
    return relevant.map((o) => {
      const count = capacityMap[o.promisedDate] ?? 0;
      const conflict = count > DAILY_CAPACITY;
      const late = o.promisedDate < today();

      const suggested = conflict ? addDays(o.promisedDate, 2) : addDays(o.promisedDate, 0);

      return { o, conflict, late, count, suggested };
    });
  }, [relevant, capacityMap]);

  return (
    <div className="space-y-6">
      <Topbar title="Planning" subtitle="SLA promised dates, capacity conflicts and suggested alternatives" />

      <Card>
        <CardHeader title="Planning Board" subtitle={`Capacity model: ${DAILY_CAPACITY} orders/day (simple PFE logic)`} right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="">All Priority</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </Select>
            <Button variant="secondary">Generate Plan</Button>
          </div>

          <Table headers={["Order", "Customer", "Promised (SLA)", "Capacity Count", "Issue", "Suggested Date"]}>
            {rows.map(({ o, conflict, late, count, suggested }) => (
              <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium">{o.orderNo}</td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3">{o.promisedDate}</td>
                <td className="px-4 py-3">{count}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {late ? <Badge variant="danger">Late</Badge> : null}
                    {conflict ? <Badge variant="warning">Capacity Conflict</Badge> : <Badge variant="success">OK</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">{suggested}</td>
              </tr>
            ))}
          </Table>

          {rows.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">No orders in this period.</div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
