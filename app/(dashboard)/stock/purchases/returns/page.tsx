"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { usePurchases } from "../store";
import { useState, useMemo } from "react";

function badgeForStatus(s: "Draft" | "Submitted" | "Approved" | "Rejected" | "Completed"): { variant: "neutral" | "info" | "success" | "danger" | "warning"; label: string } {
  switch (s) {
    case "Draft": return { variant: "neutral", label: "Draft" };
    case "Submitted": return { variant: "info", label: "Submitted" };
    case "Approved": return { variant: "success", label: "Approved" };
    case "Rejected": return { variant: "danger", label: "Rejected" };
    default: return { variant: "success", label: "Completed" };
  }
}

export default function PurchasesReturnsPage() {
  const { state, dispatch } = usePurchases();
  const supplierById = useMemo(() => Object.fromEntries(state.suppliers.map((s) => [s.id, s])), [state.suppliers]);
  const poById = useMemo(() => Object.fromEntries(state.orders.map((o) => [o.id, o])), [state.orders]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "Draft" | "Submitted" | "Approved" | "Rejected" | "Completed">("");
  const [open, setOpen] = useState(false);

  // Filter returns
  const returns = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.returns
      .filter((ret) => {
        const sup = supplierById[ret.supplierId]?.name ?? "";
        return (!status || ret.status === status) &&
               (!query || ret.returnNo.toLowerCase().includes(query) || sup.toLowerCase().includes(query));
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.returns, q, status, supplierById]);

  // Example: change status handler
  const setReturnStatus = (id: string, next: Exclude<typeof status, "">, reason?: string) => {
    dispatch({ type: "RETURN_SET_STATUS", payload: { id, status: next, rejectionReason: reason } });
  };

  // Example: create return handler (fill in with actual line items from selected PO/receipt)
  const createReturn = () => {
    /* construct a SupplierReturn object with lines */
    // dispatch({ type: "RETURN_ADD", payload: newReturn });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Purchase Returns"
        subtitle="Supplier return workflow"
        right={<Button onClick={() => setOpen(true)}>New Return</Button>}
      />

      <Card>
        <CardHeader title="Returns" subtitle="Draft → Submitted → Approved/Rejected → Completed" />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search return or supplier…" />
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </Select>
          </div>

          <Table headers={["Return", "Supplier", "PO", "Status", "Actions"]}>
            {returns.map((ret) => {
              const sup = supplierById[ret.supplierId];
              const po = poById[ret.poId];
              const st = badgeForStatus(ret.status);
              return (
                <tr key={ret.id}>
                  <td className="px-4 py-3 font-medium">{ret.returnNo}</td>
                  <td className="px-4 py-3">{sup?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3">{po?.poNo ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    {/* render buttons based on ret.status, e.g. Submit, Approve, Reject, Complete */}
                  </td>
                </tr>
              );
            })}
          </Table>

          {returns.length === 0 && (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No supplier returns found.
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
              open={open}
              title="Create Supplier Return"
              onClose={() => setOpen(false)}
              footer={<>
                  <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={createReturn}>Save</Button>
              </>} children={undefined}      >
        {/* build out the return creation form here */}
      </Modal>
    </div>
  );
}
