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
import { useStock, Supplier, SupplierCategory, SupplierStatus } from "./../../store";


// Helper for Star Ratings
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function SuppliersPage() {
  const { state, dispatch } = useStock();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<"" | SupplierCategory>("");
  const [status, setStatus] = useState<"" | SupplierStatus>("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  // Form State
  const [form, setForm] = useState<Omit<Supplier, "id" | "status">>({
    name: "",
    category: "Hardware",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    rib: "",
    paymentTerms: "30 days",
    rating: 3, // Default rating
    notes: "",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.suppliers.filter((s) => {
      const matchQ =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.contactName.toLowerCase().includes(query);
      const matchC = !category || s.category === category;
      const matchS = !status || s.status === status;
      return matchQ && matchC && matchS;
    });
  }, [state.suppliers, q, category, status]);

  const handleOpen = (supplier?: Supplier) => {
    if (supplier) {
      setEditing(supplier);
      setForm({
        name: supplier.name,
        category: supplier.category,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        rib: supplier.rib,
        paymentTerms: supplier.paymentTerms,
        rating: supplier.rating,
        notes: supplier.notes || "",
      });
    } else {
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
        rating: 3,
        notes: "",
      });
    }
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;

    const supplierData: Supplier = {
      id: editing?.id ?? `sup-${Date.now()}`,
      status: editing?.status ?? "Active",
      ...form,
      notes: form.notes?.trim() || undefined,
    };

    if (editing) {
      dispatch({ type: "SUPPLIER_UPDATE", payload: supplierData });
    } else {
      dispatch({ type: "SUPPLIER_ADD", payload: supplierData });
    }
    setOpen(false);
  };

  const toggleBlock = (id: string) => {
    dispatch({ type: "SUPPLIER_TOGGLE_BLOCK", payload: { supplierId: id } });
  };

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Supplier Management"
        subtitle="Manage vendor profiles, ratings, and active status"
        right={<Button onClick={() => handleOpen()}>+ New Supplier</Button>}
      />

      <Card>
        <CardHeader title="Supplier Database" subtitle="List of approved vendors" />
        <CardBody>
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or contact..."
            />
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              <option value="">All Categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Transport">Transport</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </Select>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Blacklisted">Blacklisted</option>
            </Select>
          </div>

          <Table headers={["Company", "Category", "Contact", "Rating", "Terms", "Status", "Actions"]}>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  s.status === "Blacklisted" ? "bg-rose-50 dark:bg-rose-900/10" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {s.name}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {s.category}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{s.contactName}</div>
                  <div className="text-xs text-slate-500">{s.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <StarRating rating={s.rating} />
                </td>
                <td className="px-4 py-3 text-sm">{s.paymentTerms}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.status === "Active" ? "success" : "danger"}>
                    {s.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="py-1.5"
                      onClick={() => handleOpen(s)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      className={`py-1.5 ${
                        s.status === "Blacklisted" ? "text-emerald-600" : "text-rose-600"
                      }`}
                      onClick={() => toggleBlock(s.id)}
                    >
                      {s.status === "Blacklisted" ? "Unblock" : "Block"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          {filtered.length === 0 && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No suppliers found.
            </div>
          )}
        </CardBody>
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Modal
        open={open}
        title={editing ? "Edit Supplier Profile" : "Register New Supplier"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save Supplier</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2">
          
          <div className="md:col-span-2 text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 mb-2">
            Company Information
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Company Name *
            </div>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Supplies"
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Category
            </div>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            >
              <option value="Hardware">Hardware</option>
              <option value="Transport">Transport</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Address
            </div>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full business address"
            />
          </div>

          <div className="md:col-span-2 text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 mb-2 mt-2">
            Contact Person
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Contact Name
            </div>
            <Input
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Phone
            </div>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Email
            </div>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 text-sm font-semibold text-slate-900 dark:text-white border-b pb-2 mb-2 mt-2">
            Financial & Rating
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Payment Terms
            </div>
            <Select
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value as any })}
            >
              <option value="Cash">Cash</option>
              <option value="30 days">30 days</option>
              <option value="60 days">60 days</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              RIB (Bank Account)
            </div>
            <Input
              value={form.rib}
              onChange={(e) => setForm({ ...form, rib: e.target.value })}
              placeholder="Bank RIB (20 digits)"
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Internal Rating (1-5)
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setForm({ ...form, rating: num as any })}
                  className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
                    form.rating === num
                      ? "bg-amber-100 border-amber-400 text-amber-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {num} ★
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Notes / Comments
            </div>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal remarks..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
