"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useMemo, useState } from "react";
import { Order, useSales } from "../../store";

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
  const { state, dispatch } = useSales();

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

    // Sort by promised date to see the timeline clearly
    return list.sort((a, b) => a.promisedDate.localeCompare(b.promisedDate));
  }, [state.orders, from, to, priority]);

  // Calculate how many orders are scheduled for each date
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

      // If conflict, suggest moving it 2 days forward to relieve pressure
      const suggested = conflict ? addDays(o.promisedDate, 2) : o.promisedDate;

      return { o, conflict, late, count, suggested };
    });
  }, [relevant, capacityMap]);

  // Action to accept the system's suggested date
  const acceptSuggestion = (order: Order, newDate: string) => {
    dispatch({
      type: "ORDER_UPDATE",
      payload: { ...order, promisedDate: newDate },
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Topbar 
        title="Delivery Planning & Scheduling" 
        subtitle="Manage SLA promised dates, resolve capacity conflicts, and reallocate resources" 
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Active Orders</div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{relevant.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Capacity Conflicts</div>
            <div className="mt-2 text-2xl font-bold text-warning-600 dark:text-warning-400">
              {rows.filter(r => r.conflict).length}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Late Deliveries (SLA Breach)</div>
            <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {rows.filter(r => r.late).length}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader 
          title="Planning Board" 
          subtitle={`Current Capacity Limit: ${DAILY_CAPACITY} orders/day (PFE Simulation)`} 
          right={<Button variant="secondary">Export Schedule</Button>} 
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="">All Priorities</option>
              <option value="High">High (Urgent / Backorder)</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low (Reserved Stock)</option>
            </Select>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              System auto-detects conflicts and suggests alternatives.
            </div>
          </div>

          <Table headers={["Order No", "Customer", "Promised Date (SLA)", "Daily Load", "Status", "Suggested Fix"]}>
            {rows.map(({ o, conflict, late, count, suggested }) => (
              <tr key={o.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${conflict ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{o.orderNo}</td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className={`px-4 py-3 font-medium ${late ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {o.promisedDate}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${conflict ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {count} / {DAILY_CAPACITY}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {late && <Badge variant="danger">Late</Badge>}
                    {conflict ? <Badge variant="warning">Conflict</Badge> : <Badge variant="success">OK</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {conflict ? (
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{suggested}</span>
                      <Button 
                        variant="secondary" 
                        className="py-1 px-2 text-xs" 
                        onClick={() => acceptSuggestion(o, suggested)}
                      >
                        Reschedule
                      </Button>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>

          {rows.length === 0 ? (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No orders found in the current planning period.
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}