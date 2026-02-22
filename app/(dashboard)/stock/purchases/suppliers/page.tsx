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
import { Supplier } from "../purchase-types";
import { usePurchases } from "../store";

export default function SuppliersPage() {
  const { state, dispatch } = usePurchases();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "Hardware" as Supplier["category"],
    contactName: "",
    phone: "",
    email: "",
    address: "",
    rib: "",
    paymentTerms: "30 days" as Supplier["paymentTerms"],
    rating: "4",
    notes: "",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.suppliers.filter((s) => {
      const matchQ = !query || s.name.toLowerCase().includes(query) || s.contactName.toLowerCase().includes(query);
      const matchC = !category || s.category === category;
      return matchQ && matchC;
    });
  }, [state.suppliers, q, category]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      category: "Hardware",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      rib: "",
      paymentTerms: "30 days",
      rating: "4",
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
      address: s.address,
      rib: s.rib,
      paymentTerms: s.paymentTerms,
      rating: String(s.rating),
      notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;

    const payload: Supplier = {
      id: editing?.id ?? `sup-${Date.now()}`,
      status: editing?.status ?? "Active",
      name: form.name.trim(),
      category: form.category,
      contactName: form.contactName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      rib: form.rib.trim(),
      paymentTerms: form.paymentTerms,
      rating: (Number(form.rating) as any) || 3,
      notes: form.notes.trim() || undefined,
    };

    if (editing) dispatch({ type: "SUPPLIER_UPDATE", payload });
    else dispatch({ type: "SUPPLIER_ADD", payload });

    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Topbar title="Suppliers" subtitle="Supplier profiles, categorization, evaluation and blocking" right={<Button onClick={openCreate}>Add Supplier</Button>} />

      <Card>
        <CardHeader title="Supplier List" subtitle="Manage supplier master data" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or contact..." />
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Transport">Transport</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </Select>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Blocked suppliers cannot be selected for new purchase orders (later enforced in backend).
            </div>
          </div>

          <Table headers={["Name", "Category", "Payment Terms", "Rating", "Status", "Actions"]}>
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.category}</td>
                <td className="px-4 py-3">{s.paymentTerms}</td>
                <td className="px-4 py-3">{s.rating}/5</td>
                <td className="px-4 py-3">
                  {s.status === "Active" ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Blocked</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" className="py-1.5" onClick={() => openEdit(s)}>Edit</Button>
                    <Button
                      variant="secondary"
                      className="py-1.5"
                      onClick={() => dispatch({ type: "SUPPLIER_TOGGLE_BLOCK", payload: { supplierId: s.id } })}
                    >
                      {s.status === "Active" ? "Block" : "Unblock"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </CardBody>
      </Card>

      <Modal
        open={open}
        title={editing ? "Edit Supplier" : "Add Supplier"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Supplier Name *</div>
            <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Category</div>
            <Select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as any }))}>
              <option value="Hardware">Hardware</option>
              <option value="Transport">Transport</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Terms</div>
            <Select value={form.paymentTerms} onChange={(e) => setForm((s) => ({ ...s, paymentTerms: e.target.value as any }))}>
              <option value="Cash">Cash</option>
              <option value="30 days">30 days</option>
              <option value="60 days">60 days</option>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Contact Name</div>
            <Input value={form.contactName} onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Phone</div>
            <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Email</div>
            <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">RIB</div>
            <Input value={form.rib} onChange={(e) => setForm((s) => ({ ...s, rib: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Address</div>
            <Input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Rating</div>
            <Select value={form.rating} onChange={(e) => setForm((s) => ({ ...s, rating: e.target.value }))}>
              <option value="1">1/5</option>
              <option value="2">2/5</option>
              <option value="3">3/5</option>
              <option value="4">4/5</option>
              <option value="5">5/5</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Notes</div>
            <Input value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} placeholder="Optional" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

