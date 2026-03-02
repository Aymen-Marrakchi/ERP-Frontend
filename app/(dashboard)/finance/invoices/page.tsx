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
import { Invoice, InvoiceStatus, financeHelpers, useFinance } from "../store";

// --- MOCK DATA ---
const MOCK_ENTITIES = [
  { name: "Client X", type: "IN", mf: "1234567/A/B/M/000" },
  { name: "Client Y", type: "IN", mf: "9876543/Z/Y/C/000" },
  { name: "TechCorp Tunisia", type: "IN", mf: "1122334/T/A/C/000" },
  { name: "Supplier Alpha", type: "OUT", mf: "5556667/S/B/M/000" },
  { name: "Transport Express", type: "OUT", mf: "9998887/T/R/E/000" },
];

const MOCK_PRODUCTS = [
  { name: "Software License", price: 1200 },
  { name: "Consulting Day", price: 800 },
  { name: "Maintenance Year", price: 2500 },
  { name: "Hardware Server", price: 15000 },
  { name: "Setup Fee", price: 300 },
];

const CATEGORIES_IN = ["Software Sales", "Consulting Services", "Maintenance Contract", "Hardware Sales"];
const CATEGORIES_OUT = ["Raw Materials", "Office Supplies", "Transport Fees", "Marketing Expenses", "IT Equipment"];

const PAYMENT_METHODS = ["Virement", "Chèque", "Espèces", "Kimbial"];

// --- HELPERS ---
function badgeForInvoiceStatus(s: InvoiceStatus) {
  if (s === "Draft") return { variant: "neutral" as const, label: "Draft" };
  if (s === "Sent") return { variant: "info" as const, label: "Sent" };
  if (s === "Overdue") return { variant: "warning" as const, label: "Overdue" };
  return { variant: "success" as const, label: "Paid" };
}

function badgeForInvoiceType(t: "IN" | "OUT") {
  if (t === "IN") return { variant: "success" as const, label: "IN" };
  return { variant: "warning" as const, label: "OUT" };
}

function getNextInvoiceNo(invoices: Invoice[]) {
  let max = 1000;
  invoices.forEach(i => {
    const match = i.invoiceNo.match(/INV-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  });
  return `INV-${max + 1}`;
}

export default function FinanceInvoicesPage() {
  const { state, dispatch } = useFinance();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | InvoiceStatus>("");
  const [type, setType] = useState<"" | "IN" | "OUT">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"invoice" | "settings">("invoice");
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [form, setForm] = useState({
    invoiceNo: "",
    customerName: "",
    matriculeFiscal: "",
    type: "IN" as "IN" | "OUT",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: "TND",
    paymentMethod: "Virement",
    lineLabel: "",
    lineQty: "1",
    lineUnitPrice: "0", // Stores HT
    applyTva: true,
    tvaRate: "0.19",
    applyFodec: false,
    fodecRate: "0.01",
    timbre: "1.000",
    retenueRate: "0",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.invoices
      .filter((i) => {
        const matchQ = !query || i.invoiceNo.toLowerCase().includes(query) || i.customerName.toLowerCase().includes(query);
        const matchS = !status || i.status === status;
        const matchT = !type || i.type === type;
        const matchFrom = !from || i.issueDate >= from;
        const matchTo = !to || i.issueDate <= to;
        return matchQ && matchS && matchT && matchFrom && matchTo;
      })
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [state.invoices, q, status, type, from, to]);

  const openCreate = () => {
    setEditing(null);
    setIsViewMode(false);
    setActiveTab("invoice");
    setForm({
      invoiceNo: getNextInvoiceNo(state.invoices),
      customerName: "",
      matriculeFiscal: "",
      type: "IN",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      currency: "TND",
      paymentMethod: "Virement",
      lineLabel: "",
      lineQty: "1",
      lineUnitPrice: "0",
      applyTva: true,
      tvaRate: "0.19",
      applyFodec: false,
      fodecRate: "0.01",
      timbre: "1.000",
      retenueRate: "0",
    });
    setOpen(true);
  };

  const openEditOrView = (inv: Invoice) => {
    setEditing(inv);
    setIsViewMode(inv.status !== "Draft");
    setActiveTab("invoice");

    const first = inv.lines[0];
    const hasTva = (inv.taxes?.tvaRate ?? 0) > 0;
    const hasFodec = (inv.taxes?.fodecRate ?? 0) > 0;

    setForm({
      invoiceNo: inv.invoiceNo,
      customerName: inv.customerName,
      matriculeFiscal: "",
      type: inv.type ?? "IN",
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      currency: inv.currency,
      paymentMethod: (inv as any).paymentMethod || "Virement", // Load saved method
      lineLabel: first?.label ?? "",
      lineQty: String(first?.qty ?? 1),
      lineUnitPrice: String(first?.unitPrice ?? 0),
      applyTva: hasTva,
      tvaRate: String(inv.taxes?.tvaRate || 0.19),
      applyFodec: hasFodec,
      fodecRate: String(inv.taxes?.fodecRate || 0.01),
      timbre: String(inv.taxes?.timbre ?? 1.000),
      retenueRate: String(inv.taxes?.retenueRate ?? 0),
    });
    setOpen(true);
  };

  const handleTypeChange = (newType: "IN" | "OUT") => {
    if (isViewMode) return;
    setForm(s => ({ ...s, type: newType }));
  };

  const handleCustomerSelect = (name: string) => {
    if (isViewMode) return;
    const entity = MOCK_ENTITIES.find(e => e.name === name);
    setForm(s => ({
      ...s,
      customerName: name,
      matriculeFiscal: entity ? entity.mf : ""
    }));
  };

  const handleProductSelect = (name: string) => {
    if (isViewMode) return;
    const prod = MOCK_PRODUCTS.find(p => p.name === name);
    setForm(s => ({
      ...s,
      lineLabel: name,
      lineUnitPrice: prod ? String(prod.price) : s.lineUnitPrice
    }));
  };

  const buildInvoice = (): Invoice | null => {
    if (!form.invoiceNo.trim() || !form.customerName.trim()) return null;
    
    // Get Rates
    const tvaVal = form.applyTva ? Number(form.tvaRate) || 0 : 0;
    const fodecVal = form.applyFodec ? Number(form.fodecRate) || 0 : 0;
    
    // Store Unit Price as HT (Standard)
    const unitHT = Number(form.lineUnitPrice) || 0;

    return {
      id: editing?.id ?? `i-${Date.now()}`,
      invoiceNo: form.invoiceNo.trim(),
      customerName: form.customerName.trim(),
      type: form.type,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: editing?.status ?? "Draft",
      currency: form.currency,
      // Save payment method (Cast as any if strict typing complains, ideally add to store type)
      ...({ paymentMethod: form.paymentMethod } as any),
      lines: [
        {
          id: editing?.lines?.[0]?.id ?? `il-${Date.now()}`,
          label: form.lineLabel.trim() || "Sale",
          qty: Number(form.lineQty) || 1,
          unitPrice: unitHT, 
        },
      ],
      taxes: {
        tvaRate: tvaVal,
        fodecRate: fodecVal,
        timbre: Math.max(0, Number(form.timbre) || 0),
        retenueRate: Math.max(0, Number(form.retenueRate) || 0),
      },
      paidAmount: editing?.paidAmount ?? 0,
      notes: editing?.notes,
    };
  };

  const saveDraft = () => {
    const inv = buildInvoice();
    if (!inv) return;
    if (editing) dispatch({ type: "INVOICE_UPDATE", payload: inv });
    else dispatch({ type: "INVOICE_CREATE", payload: inv });
    setOpen(false);
  };

  const handleSend = () => {
    const inv = buildInvoice();
    if (!inv) return;
    const sentInv = { ...inv, status: "Sent" as InvoiceStatus };
    if (editing) dispatch({ type: "INVOICE_UPDATE", payload: sentInv });
    else dispatch({ type: "INVOICE_CREATE", payload: sentInv });
    setOpen(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    if (confirm("Delete this draft invoice?")) {
      dispatch({ type: "INVOICE_DELETE" as any, payload: { id: editing.id } });
      setOpen(false);
    }
  };

  const availableEntities = MOCK_ENTITIES.filter(e => e.type === form.type);

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Invoices & Billing"
        subtitle="Manage customer invoices and supplier bills"
        right={<Button onClick={openCreate}>+ Create Invoice</Button>}
      />

      <Card>
        <CardHeader title="Invoice List" subtitle="Recent transactions" right={<Button variant="secondary">Export PDF</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." />
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="">All Types</option>
              <option value="IN">IN (Sale)</option>
              <option value="OUT">OUT (Expense)</option>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          {/* UPDATED TABLE HEADERS: Added "Method" */}
          <Table headers={["Type", "Invoice No", "Entity", "Total TTC", "Method", "Status", "Actions"]}>
            {filtered.map((i) => {
              const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(i) : financeHelpers.invoiceTotal(i);
              const gross = typeof totals === 'number' ? totals : totals.gross;
              const st = badgeForInvoiceStatus(i.status);
              const tp = badgeForInvoiceType(i.type ?? "IN");
              const isDraft = i.status === "Draft";
              
              // Retrieve payment method safely
              const paymentMethod = (i as any).paymentMethod || "-";

              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3"><Badge variant={tp.variant}>{tp.label}</Badge></td>
                  <td className="px-4 py-3 font-medium">{i.invoiceNo}</td>
                  <td className="px-4 py-3">{i.customerName}</td>
                  <td className="px-4 py-3 font-semibold">{gross.toFixed(3)} {i.currency}</td>
                  
                  {/* NEW COLUMN: Payment Method */}
                  <td className="px-4 py-3 text-sm text-slate-500">{paymentMethod}</td>
                  
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" className="py-1.5" onClick={() => openEditOrView(i)}>
                      {isDraft ? "Edit" : "View"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Invoice Manager"
        onClose={() => setOpen(false)}
        headerContent={
          <div className="flex gap-2 mt-4 border-b border-slate-200 dark:border-slate-700 w-full">
            <button
              onClick={() => setActiveTab("invoice")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "invoice"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              📄 Invoice
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "settings"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              ⚙️ Settings
            </button>
          </div>
        }
        footer={
          isViewMode ? (
            <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          ) : (
            <div className="flex w-full justify-between">
              {editing ? (
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  Delete Draft
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="secondary" onClick={saveDraft}>Save Draft</Button>
                <Button onClick={handleSend}>Send Invoice</Button>
              </div>
            </div>
          )
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 pt-2">
          <fieldset disabled={isViewMode} className="contents">
            
            {activeTab === "invoice" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                
                <div className="md:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 flex gap-4 items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant={form.type === "IN" ? "primary" : "secondary"} className="py-1 px-3 text-xs" onClick={() => handleTypeChange("IN")}>
                      IN (Sale)
                    </Button>
                    <Button variant={form.type === "OUT" ? "primary" : "secondary"} className="py-1 px-3 text-xs" onClick={() => handleTypeChange("OUT")}>
                      OUT (Expense)
                    </Button>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {form.invoiceNo}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Customer / Supplier</div>
                  <Select value={form.customerName} onChange={(e) => handleCustomerSelect(e.target.value)}>
                    <option value="">-- Select Entity --</option>
                    {availableEntities.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                  </Select>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Matricule Fiscal</div>
                  <Input value={form.matriculeFiscal} onChange={(e) => setForm(s => ({ ...s, matriculeFiscal: e.target.value }))} />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Issue Date</div>
                  <Input type="date" value={form.issueDate} onChange={(e) => setForm((s) => ({ ...s, issueDate: e.target.value }))} />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Method</div>
                  <Select value={form.paymentMethod} onChange={(e) => setForm(s => ({ ...s, paymentMethod: e.target.value }))}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>

                <div className="md:col-span-2 border-t pt-2 mt-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Line Items</div>

                <div className="md:col-span-2">
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Product / Service</div>
                  <Select value={form.lineLabel} onChange={(e) => handleProductSelect(e.target.value)}>
                    <option value="">-- Select Product --</option>
                    {MOCK_PRODUCTS.map(p => <option key={p.name} value={p.name}>{p.name} ({p.price} TND)</option>)}
                  </Select>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity</div>
                  <Input type="number" min={1} value={form.lineQty} onChange={(e) => setForm((s) => ({ ...s, lineQty: e.target.value }))} />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Unit Price (HT)</div>
                  <Input type="number" min={0} value={form.lineUnitPrice} onChange={(e) => setForm((s) => ({ ...s, lineUnitPrice: e.target.value }))} />
                </div>

                {/* Live Summary */}
                <div className="md:col-span-2 mt-2 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm">
                  {(() => {
                    const qty = Number(form.lineQty) || 0;
                    const unitHT = Number(form.lineUnitPrice) || 0;
                    const totalHT = unitHT * qty;

                    const rateTva = form.applyTva ? Number(form.tvaRate) || 0 : 0;
                    const rateFodec = form.applyFodec ? Number(form.fodecRate) || 0 : 0;
                    
                    const tvaVal = totalHT * rateTva;
                    const fodecVal = totalHT * rateFodec;
                    const timbre = Number(form.timbre) || 0;
                    
                    const grandTotal = totalHT + tvaVal + fodecVal + timbre;

                    return (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Total HT:</span>
                          <span>{totalHT.toFixed(3)}</span>
                        </div>
                        {form.applyTva && (
                          <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>TVA ({(rateTva * 100).toFixed(0)}%):</span>
                            <span>{tvaVal.toFixed(3)}</span>
                          </div>
                        )}
                        {form.applyFodec && (
                          <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>FODEC ({(rateFodec * 100).toFixed(0)}%):</span>
                            <span>{fodecVal.toFixed(3)}</span>
                          </div>
                        )}
                        {timbre > 0 && (
                          <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Timbre:</span>
                            <span>{timbre.toFixed(3)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center font-bold border-t border-slate-300 pt-1 mt-1">
                          <span>Total TTC:</span>
                          <span className="text-lg text-emerald-600 dark:text-emerald-400">{grandTotal.toFixed(3)} TND</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4">
                <div className="text-sm text-slate-500">Configure tax rates and fiscal stamps.</div>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Apply TVA</div>
                      <div className="text-xs text-slate-500">Value Added Tax (19%)</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={form.tvaRate} onChange={(e) => setForm(s => ({ ...s, tvaRate: e.target.value }))} className="w-20 text-right" disabled={!form.applyTva} />
                      <button type="button" onClick={() => setForm(s => ({ ...s, applyTva: !s.applyTva }))} className={`w-12 h-6 rounded-full transition-colors relative ${form.applyTva ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.applyTva ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Apply FODEC</div>
                      <div className="text-xs text-slate-500">Development Fund (1%)</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={form.fodecRate} onChange={(e) => setForm(s => ({ ...s, fodecRate: e.target.value }))} className="w-20 text-right" disabled={!form.applyFodec} />
                      <button type="button" onClick={() => setForm(s => ({ ...s, applyFodec: !s.applyFodec }))} className={`w-12 h-6 rounded-full transition-colors relative ${form.applyFodec ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.applyFodec ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Timbre Fiscal</div>
                      <div className="text-xs text-slate-500">Fixed</div>
                    </div>
                    <Input value={form.timbre} readOnly className="w-20 text-right bg-slate-100 text-slate-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>
            )}

          </fieldset>
        </div>
      </Modal>
    </div>
  );
}