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
import { Movement, useStock } from "../store";

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

  const [open, setOpen] = useState(false);
  const [restock, setRestock] = useState<{ productId: string; qty: string }>({ productId: "", qty: "10" });

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

  const openRestock = (productId: string, suggested: number) => {
    setRestock({ productId, qty: String(Math.max(1, suggested)) });
    setOpen(true);
  };

  const saveRestock = () => {
    const qtyNum = Number(restock.qty);
    if (!restock.productId || !qtyNum || qtyNum <= 0) return;

    const mv: Movement = {
      id: `m-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: "IN",
      productId: restock.productId,
      qty: Math.abs(qtyNum),
      source: "Purchase",
      refDoc: "Restock",
    };

    dispatch({ type: "MOVEMENT_ADD", payload: mv });
    setOpen(false);
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
                  <Button className="py-1.5" onClick={() => openRestock(p.id, suggested)}>
                    Create Restock
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
        open={open}
        title="Create Restock Movement"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveRestock}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Product</div>
            <Select value={restock.productId} onChange={(e) => setRestock((s) => ({ ...s, productId: e.target.value }))}>
              <option value="">Select...</option>
              {state.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} - {p.name} (Qty: {p.qty}, Min: {p.min})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity</div>
            <Input type="number" min={1} value={restock.qty} onChange={(e) => setRestock((s) => ({ ...s, qty: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date</div>
            <Input type="date" value={new Date().toISOString().slice(0, 10)} disabled />
          </div>

          <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">
            This will create an IN movement with source "Purchase” and update product quantity immediately.
          </div>
        </div>
      </Modal>
    </div>
  );
}

