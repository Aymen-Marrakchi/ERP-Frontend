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
import { Movement, MovementType, useStock } from "../store";

function badgeForType(t: MovementType) {
  if (t === "IN") return { label: "IN", variant: "info" as const };
  if (t === "OUT") return { label: "OUT", variant: "warning" as const };
  return { label: "ADJUSTMENT", variant: "neutral" as const };
}

export default function StockMovementsPage() {
  const { state, dispatch } = useStock();

  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | MovementType>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "IN" as MovementType,
    productId: state.products[0]?.id ?? "",
    qty: "1",
    source: "Purchase" as Movement["source"],
    refDoc: "",
  });

  const productsById = useMemo(() => {
    return Object.fromEntries(state.products.map((p) => [p.id, p]));
  }, [state.products]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return state.movements.filter((m) => {
      const product = productsById[m.productId];
      const text = `${product?.name ?? ""} ${product?.reference ?? ""} ${m.refDoc ?? ""}`.toLowerCase();

      const matchQ = !query || text.includes(query);
      const matchT = !type || m.type === type;

      const matchFrom = !from || m.date >= from;
      const matchTo = !to || m.date <= to;

      return matchQ && matchT && matchFrom && matchTo;
    });
  }, [state.movements, productsById, q, type, from, to]);

  const openCreate = () => {
    setForm((s) => ({
      ...s,
      date: new Date().toISOString().slice(0, 10),
      type: "IN",
      productId: state.products[0]?.id ?? "",
      qty: "1",
      source: "Purchase",
      refDoc: "",
    }));
    setOpen(true);
  };

  const saveMovement = () => {
    const qtyNum = Number(form.qty);
    if (!form.productId || !qtyNum || qtyNum <= 0) return;

    const mv: Movement = {
      id: `m-${Date.now()}`,
      date: form.date,
      type: form.type,
      productId: form.productId,
      qty: Math.abs(qtyNum),
      source: form.source,
      refDoc: form.refDoc.trim() || undefined,
    };

    dispatch({ type: "MOVEMENT_ADD", payload: mv });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Topbar
        title="Stock Movements"
        subtitle="Entries and exits with traceability (updates quantities)"
        right={<Button onClick={openCreate}>Create Movement</Button>}
      />

      <Card>
        <CardHeader
          title="Movements"
          subtitle="Filter by date, type and product"
          right={<Button variant="secondary">Export</Button>}
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product/reference/doc..." />
            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="">All Types</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <Table headers={["Date", "Type", "Product", "Qty", "Source", "Reference"]}>
            {filtered.map((m) => {
              const product = productsById[m.productId];
              const badge = badgeForType(m.type);
              return (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">{m.date}</td>
                  <td className="px-4 py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{product?.name ?? "Unknown"}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{product?.reference}</div>
                  </td>
                  <td className="px-4 py-3">{m.type === "OUT" ? `-${m.qty}` : `+${m.qty}`}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.source}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.refDoc ?? "—"}</td>
                </tr>
              );
            })}
          </Table>
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Create Movement"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveMovement}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date</div>
            <Input type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Type</div>
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as MovementType }))}>
              <option value="IN">IN (Entry)</option>
              <option value="OUT">OUT (Exit)</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Product</div>
            <Select value={form.productId} onChange={(e) => setForm((s) => ({ ...s, productId: e.target.value }))}>
              {state.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} - {p.name} (Qty: {p.qty})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity</div>
            <Input type="number" min={1} value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} />
            {form.type === "OUT" ? (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">OUT decreases stock quantity.</div>
            ) : (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">IN increases stock quantity.</div>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Source</div>
            <Select value={form.source} onChange={(e) => setForm((s) => ({ ...s, source: e.target.value as any }))}>
              <option value="Purchase">Purchase</option>
              <option value="Sale">Sale</option>
              <option value="Inventory">Inventory</option>
              <option value="Manual">Manual</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reference Document (optional)</div>
            <Input value={form.refDoc} onChange={(e) => setForm((s) => ({ ...s, refDoc: e.target.value }))} placeholder="PO-101, SO-00021, INV-0003..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}

