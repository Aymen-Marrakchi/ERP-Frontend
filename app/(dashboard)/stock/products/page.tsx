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
import { Product, useStock } from "../store";

function statusFor(p: Product) {
  if (p.qty === 0) return { label: "Out of Stock", variant: "danger" as const };
  if (p.qty <= p.min) return { label: "Low Stock", variant: "warning" as const };
  return { label: "In Stock", variant: "success" as const };
}

export default function StockProducts() {
  const { state, dispatch } = useStock();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    reference: "",
    name: "",
    category: "Finished Goods",
    qty: "0",
    min: "10",
    unit: "pcs",
  });

  const categories = useMemo(() => {
    const base = ["Finished Goods", "Raw Materials", "Consumables"];
    const existing = Array.from(new Set(state.products.map(p => p.category)));
    return Array.from(new Set([...base, ...existing]));
  }, [state.products]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.products.filter(p => {
      const st = statusFor(p).label;
      const matchQ = !query || p.name.toLowerCase().includes(query) || p.reference.toLowerCase().includes(query);
      const matchC = !category || p.category === category;
      const matchS = !status || st === status;
      return matchQ && matchC && matchS;
    });
  }, [state.products, q, category, status]);

  const openCreate = () => {
    setEditing(null);
    setForm({ reference: "", name: "", category: "Finished Goods", qty: "0", min: "10", unit: "pcs" });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      reference: p.reference,
      name: p.name,
      category: p.category,
      qty: String(p.qty),
      min: String(p.min),
      unit: p.unit ?? "pcs",
    });
    setOpen(true);
  };

  const save = () => {
    const payload: Product = {
      id: editing?.id ?? `p-${Date.now()}`,
      reference: form.reference.trim(),
      name: form.name.trim(),
      category: form.category,
      qty: Number(form.qty) || 0,
      min: Number(form.min) || 0,
      unit: form.unit.trim() || "pcs",
    };

    if (!payload.reference || !payload.name) return;

    if (editing) dispatch({ type: "PRODUCT_UPDATE", payload });
    else dispatch({ type: "PRODUCT_ADD", payload });

    setOpen(false);
  };

  const totals = useMemo(() => {
    const total = state.products.length;
    const low = state.products.filter(p => p.qty > 0 && p.qty <= p.min).length;
    const out = state.products.filter(p => p.qty === 0).length;
    return { total, low, out };
  }, [state.products]);

  return (
    <div className="space-y-6">
      <Topbar
        title="Products"
        subtitle="Create/update products, thresholds and availability status"
        right={<Button onClick={openCreate}>Add Product</Button>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Total Products</div><div className="mt-2 text-xl font-semibold">{totals.total}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Low Stock</div><div className="mt-2 text-xl font-semibold text-amber-600">{totals.low}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Out of Stock</div><div className="mt-2 text-xl font-semibold text-rose-600">{totals.out}</div></CardBody></Card>
      </div>

      <Card>
        <CardHeader
          title="Product List"
          subtitle="Manage SKUs and stock thresholds"
          right={<Button variant="secondary">Export</Button>}
        />
        <CardBody>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or reference..." />
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </Select>
          </div>

          <Table headers={["Reference", "Product", "Category", "Qty", "Min", "Status", "Actions"]}>
            {filtered.map((p) => {
              const st = statusFor(p);
              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{p.reference}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.category}</td>
                  <td className="px-4 py-3">{p.qty}</td>
                  <td className="px-4 py-3">{p.min}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" className="py-1.5">View</Button>
                      <Button variant="secondary" className="py-1.5" onClick={() => openEdit(p)}>Edit</Button>
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
        title={editing ? "Edit Product" : "Add Product"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reference *</div>
            <Input value={form.reference} onChange={(e) => setForm(s => ({ ...s, reference: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Product Name *</div>
            <Input value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Category</div>
            <Select value={form.category} onChange={(e) => setForm(s => ({ ...s, category: e.target.value }))}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Unit</div>
            <Input value={form.unit} onChange={(e) => setForm(s => ({ ...s, unit: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity</div>
            <Input type="number" value={form.qty} onChange={(e) => setForm(s => ({ ...s, qty: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Min Threshold</div>
            <Input type="number" value={form.min} onChange={(e) => setForm(s => ({ ...s, min: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
