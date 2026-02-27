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
import type { PurchaseRequest, PurchaseRequestStatus, PurchasePriority } from "../../store";
import { usePurchases } from "../store";

function badgeForDaStatus(s: PurchaseRequestStatus) {
  if (s === "Draft") return { variant: "neutral" as const, label: "Draft" };
  if (s === "Submitted") return { variant: "info" as const, label: "Submitted" };
  if (s === "Approved") return { variant: "success" as const, label: "Approved" };
  return { variant: "danger" as const, label: "Rejected" };
}

export default function PurchaseRequestsPage() {
  const { state, dispatch } = usePurchases();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | PurchaseRequestStatus>("");

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    daNo: `DA-${String(Date.now()).slice(-4)}`,
    department: "Stock" as PurchaseRequest["department"],
    priority: "Normal" as PurchasePriority,
    createdAt: new Date().toISOString().slice(0, 10),
    neededDate: new Date().toISOString().slice(0, 10),
    budgetCode: "",
    item: "Office supplies",
    qty: "1",
    unit: "pcs",
    estUnitPrice: "0",
  });

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.requests
      .filter((da) => {
        const matchQ = !query || da.daNo.toLowerCase().includes(query) || da.department.toLowerCase().includes(query);
        const matchS = !status || da.status === status;
        return matchQ && matchS;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.requests, q, status]);

  // Minimal actions added locally (UI store currently has no DA reducer actions).
  // For now we keep DA in UI list by using local-only approach:
  // If you want DA to persist in store, tell me and I’ll add DA actions in reducer like PO/SINV.
  const [localRequests, setLocalRequests] = useState<PurchaseRequest[]>(state.requests);

  const filteredLocal = useMemo(() => {
    const query = q.trim().toLowerCase();
    return localRequests
      .filter((da) => {
        const matchQ = !query || da.daNo.toLowerCase().includes(query) || da.department.toLowerCase().includes(query);
        const matchS = !status || da.status === status;
        return matchQ && matchS;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [localRequests, q, status]);

  const create = () => {
    if (!form.daNo.trim()) return;

    const da: PurchaseRequest = {
      id: `da-${Date.now()}`,
      daNo: form.daNo.trim(),
      department: form.department,
      priority: form.priority,
      status: "Draft",
      createdAt: form.createdAt,
      neededDate: form.neededDate,
      budgetCode: form.budgetCode.trim() || undefined,
      lines: [
        {
          id: `dal-${Date.now()}`,
          item: form.item.trim(),
          qty: Number(form.qty) || 1,
          unit: form.unit.trim() || "pcs",
          estUnitPrice: Number(form.estUnitPrice) || 0,
        },
      ],
    };

    setLocalRequests((x) => [da, ...x]);
    setOpen(false);
  };

  const setDaStatus = (id: string, next: PurchaseRequestStatus, reason?: string) => {
    setLocalRequests((list) =>
      list.map((x) =>
        x.id === id
          ? { ...x, status: next, rejectionReason: next === "Rejected" ? reason ?? "Rejected" : undefined }
          : x
      )
    );
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Purchase Requests"
        subtitle="Department requests with workflow (Draft → Submitted → Approved/Rejected)"
        right={<Button onClick={() => setOpen(true)}>Create Request</Button>}
      />

      <Card>
        <CardHeader title="Requests" subtitle="Lightweight PFE workflow" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search DA..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Later: link approved DA to PO creation and budget availability checks.
            </div>
          </div>

          <Table headers={["DA", "Department", "Priority", "Created", "Needed", "Status", "Actions"]}>
            {filteredLocal.map((da) => {
              const st = badgeForDaStatus(da.status);
              return (
                <tr key={da.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{da.daNo}</td>
                  <td className="px-4 py-3">{da.department}</td>
                  <td className="px-4 py-3">{da.priority}</td>
                  <td className="px-4 py-3">{da.createdAt}</td>
                  <td className="px-4 py-3">{da.neededDate}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {da.status === "Draft" ? (
                        <Button className="py-1.5" onClick={() => setDaStatus(da.id, "Submitted")}>Submit</Button>
                      ) : null}
                      {da.status === "Submitted" ? (
                        <>
                          <Button className="py-1.5" onClick={() => setDaStatus(da.id, "Approved")}>Approve</Button>
                          <Button variant="secondary" className="py-1.5" onClick={() => setDaStatus(da.id, "Rejected", "Insufficient justification")}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {da.status === "Rejected" ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">Reason: {da.rejectionReason ?? "—"}</span>
                      ) : null}
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
        title="Create Purchase Request"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">DA No</div>
            <Input value={form.daNo} onChange={(e) => setForm((s) => ({ ...s, daNo: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Department</div>
            <Select value={form.department} onChange={(e) => setForm((s) => ({ ...s, department: e.target.value as any }))}>
              <option value="Stock">Stock</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Production">Production</option>
              <option value="Admin">Admin</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Priority</div>
            <Select value={form.priority} onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value as any }))}>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Needed Date</div>
            <Input type="date" value={form.neededDate} onChange={(e) => setForm((s) => ({ ...s, neededDate: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Budget Code (optional)</div>
            <Input value={form.budgetCode} onChange={(e) => setForm((s) => ({ ...s, budgetCode: e.target.value }))} placeholder="BUD-2026-..." />
          </div>

          <div className="md:col-span-2 mt-2 text-sm font-semibold">Single line (PFE demo)</div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Item</div>
            <Input value={form.item} onChange={(e) => setForm((s) => ({ ...s, item: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Qty</div>
            <Input type="number" min={1} value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Unit</div>
            <Input value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Estimated Unit Price</div>
            <Input type="number" min={0} value={form.estUnitPrice} onChange={(e) => setForm((s) => ({ ...s, estUnitPrice: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

