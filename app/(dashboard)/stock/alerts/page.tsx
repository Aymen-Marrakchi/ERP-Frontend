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
import { Movement, PurchasePriority, PurchaseRequest, PurchaseRequestLine, useStock } from "../store";

type AlertType = "Low Stock" | "Out of Stock";

function alertTypeFor(qty: number, min: number): AlertType | null {
  if (qty === 0) return "Out of Stock";
  if (qty <= min) return "Low Stock";
  return null;
}

export default function StockAlertsPage() {
  const { state, dispatch } = useStock();

  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | AlertType>("");

  const [openReq, setOpenReq] = useState(false);
const [reqForm, setReqForm] = useState<{
  productId: string;
  qty: string;
  priority: PurchasePriority;
  neededDate: string;
}>({
  productId: "",
  qty: "10",
  priority: "Urgent",
  neededDate: new Date().toISOString().slice(0, 10),
});

  const alerts = useMemo(() => {
    const query = q.trim().toLowerCase();

    return state.products
      .map((p) => {
        const t = alertTypeFor(p.qty, p.min);
        return t ? { p, type: t } : null;
      })
      .filter(Boolean)
      .map((x) => x!)
      .filter((x) => {
        const matchQ = !query || x.p.name.toLowerCase().includes(query) || x.p.reference.toLowerCase().includes(query);
        const matchT = !type || x.type === type;
        return matchQ && matchT;
      })
      .map((x) => ({
        ...x,
        suggested: Math.max(x.p.min * 3 - x.p.qty, x.p.min), // simple reorder suggestion
      }));
  }, [state.products, q, type]);

  const openRequest = (productId: string, suggested: number) => {
  setReqForm({
    productId,
    qty: String(Math.max(1, suggested)),
    priority: "Urgent",
    neededDate: new Date().toISOString().slice(0, 10),
  });
  setOpenReq(true);
};

  const saveRequest = () => {
  const qtyNum = Number(reqForm.qty);
  if (!reqForm.productId || !qtyNum || qtyNum <= 0) return;

  const product = state.products.find((pr) => pr.id === reqForm.productId);
  if (!product) return;

  const line: PurchaseRequestLine = {
    id: `line-${Date.now()}`,
    item: product.name,
    qty: qtyNum,
    unit: product.unit ?? "",
    estUnitPrice: 0, // optional estimate; adjust as needed
  };

  const request: PurchaseRequest = {
    id: `DA-${Date.now()}`,
    daNo: `DA-${String(Date.now()).slice(-4)}`,
    department: "Stock",
    priority: reqForm.priority,
    status: "Submitted",         // you can choose "Draft" or "Submitted"
    createdAt: new Date().toISOString().slice(0, 10),
    neededDate: reqForm.neededDate,
    lines: [line],
  };

  dispatch({ type: "REQUEST_ADD", payload: request });
  setOpenReq(false);
};

  return (
    <div className="space-y-6">
      <Topbar
        title="Stock Alerts"
        subtitle="Threshold alerts derived from product quantities and minimum levels"
      />

      <Card>
        <CardHeader
          title="Alerts"
          subtitle="Low stock and out-of-stock products"
          right={<Button variant="secondary">Export</Button>}
        />
        <CardBody>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product..." />
            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="">All Alert Types</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </Select>
          </div>

          <Table headers={["Reference", "Product", "Qty", "Min", "Alert", "Suggested Reorder", "Action"]}>
            {alerts.map(({ p, type, suggested }) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium">{p.reference}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">{p.qty}</td>
                <td className="px-4 py-3">{p.min}</td>
                <td className="px-4 py-3">
                  {type === "Out of Stock" ? (
                    <Badge variant="danger">Out of Stock</Badge>
                  ) : (
                    <Badge variant="warning">Low Stock</Badge>
                  )}
                </td>
                <td className="px-4 py-3">{suggested}</td>
                <td className="px-4 py-3">
  <Button className="py-1.5" onClick={() => openRequest(p.id, suggested)}>
    Create Purchase Request
  </Button>
</td>
              </tr>
            ))}
          </Table>

          {alerts.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No alerts. All products are above their minimum thresholds.
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Modal
  open={openReq}
  title="Create Purchase Request"
  onClose={() => setOpenReq(false)}
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpenReq(false)}>Cancel</Button>
      <Button onClick={saveRequest}>Save</Button>
    </>
  }
>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div className="md:col-span-2">
      <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Product</div>
      <Select value={reqForm.productId} onChange={(e) => setReqForm((s) => ({ ...s, productId: e.target.value }))}>
        <option value="">Select…</option>
        {state.products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.reference} - {p.name} (Qty: {p.qty}, Min: {p.min})
          </option>
        ))}
      </Select>
    </div>

    <div>
      <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity</div>
      <Input
        type="number"
        min={1}
        value={reqForm.qty}
        onChange={(e) => setReqForm((s) => ({ ...s, qty: e.target.value }))}
      />
    </div>

    <div>
      <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Priority</div>
      <Select
        value={reqForm.priority}
        onChange={(e) => setReqForm((s) => ({ ...s, priority: e.target.value as PurchasePriority }))}
      >
        <option value="Urgent">Urgent</option>
        <option value="Normal">Normal</option>
        <option value="Low">Low</option>
      </Select>
    </div>

    <div>
      <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Needed by</div>
      <Input
        type="date"
        value={reqForm.neededDate}
        onChange={(e) => setReqForm((s) => ({ ...s, neededDate: e.target.value }))}
      />
    </div>

    <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">
      This will create a purchase request for the selected product and quantity. You can later add more lines or send it for approval.
    </div>
  </div>
</Modal>
    </div>
  );
}

