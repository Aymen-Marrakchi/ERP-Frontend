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

// --- MOCK DIRECTORIES ---
const MOCK_ENTITIES = [
  { name: "Client X", type: "IN", mf: "1234567/A/B/M/000" },
  { name: "Client Y", type: "IN", mf: "9876543/Z/Y/C/000" },
  { name: "TechCorp Tunisia", type: "IN", mf: "1122334/T/A/C/000" },
  { name: "Supplier Alpha", type: "OUT", mf: "5556667/S/B/M/000" },
  { name: "Transport Express", type: "OUT", mf: "9998887/T/R/E/000" },
];

const CATEGORIES_IN = ["Software Sales", "Consulting Services", "Maintenance Contract", "Hardware Sales"];
const CATEGORIES_OUT = ["Raw Materials", "Office Supplies", "Transport Fees", "Marketing Expenses", "IT Equipment"];

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

// Function to auto-increment the invoice number
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
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [isViewMode, setIsViewMode] = useState(false); // Controls Read-Only state

  const [form, setForm] = useState({
    invoiceNo: "",
    customerName: "",
    matriculeFiscal: "",
    type: "IN" as "IN" | "OUT",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: "TND",
    lineLabel: CATEGORIES_IN[0],
    lineQty: "1",
    lineUnitPrice: "0",
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
    setForm({
      invoiceNo: getNextInvoiceNo(state.invoices),
      customerName: "",
      matriculeFiscal: "",
      type: "IN",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      currency: "TND",
      lineLabel: CATEGORIES_IN[0],
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
    
    // If it's a Draft, we Edit. If it's Sent, Paid, or Overdue, we just View.
    setIsViewMode(inv.status !== "Draft");

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
      lineLabel: first?.label ?? (inv.type === "OUT" ? CATEGORIES_OUT[0] : CATEGORIES_IN[0]),
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
    setForm(s => ({
      ...s,
      type: newType,
      customerName: "",
      matriculeFiscal: "",
      lineLabel: newType === "IN" ? CATEGORIES_IN[0] : CATEGORIES_OUT[0]
    }));
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

  const buildInvoice = (): Invoice | null => {
    if (!form.invoiceNo.trim() || !form.customerName.trim()) return null;
    const finalTvaRate = form.applyTva ? Math.max(0, Number(form.tvaRate) || 0) : 0;
    const finalFodecRate = form.applyFodec ? Math.max(0, Number(form.fodecRate) || 0) : 0;

    return {
      id: editing?.id ?? `i-${Date.now()}`,
      invoiceNo: form.invoiceNo.trim(),
      customerName: form.customerName.trim(),
      type: form.type,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: editing?.status ?? "Draft",
      currency: form.currency,
      lines: [
        {
          id: editing?.lines?.[0]?.id ?? `il-${Date.now()}`,
          label: form.lineLabel.trim() || "Sale",
          qty: Number(form.lineQty) || 1,
          unitPrice: Number(form.lineUnitPrice) || 0,
        },
      ],
      taxes: {
        tvaRate: finalTvaRate,
        fodecRate: finalFodecRate,
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

    // We force the status to "Sent" during creation/update
    const sentInv = { ...inv, status: "Sent" as InvoiceStatus };

    if (editing) dispatch({ type: "INVOICE_UPDATE", payload: sentInv });
    else dispatch({ type: "INVOICE_CREATE", payload: sentInv });

    setOpen(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    if (confirm("Are you sure you want to delete this draft invoice?")) {
      dispatch({ type: "INVOICE_DELETE" as any, payload: { id: editing.id } });
      setOpen(false);
    }
  };

  const availableEntities = MOCK_ENTITIES.filter(e => e.type === form.type);
  const availableCategories = form.type === "IN" ? CATEGORIES_IN : CATEGORIES_OUT;

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Invoices & Billing"
        subtitle="Create invoices, track Tunisian taxes (TVA, FODEC, RS), and monitor statuses"
        right={<Button onClick={openCreate}>+ Create Invoice</Button>}
      />

      <Card>
        <CardHeader
          title="Invoice List"
          subtitle="Draft / Sent / Paid / Overdue"
          right={<Button variant="secondary">Export PDF</Button>}
        />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice/customer..." />

            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </Select>

            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="">All Types</option>
              <option value="IN">IN (Customer/Revenue)</option>
              <option value="OUT">OUT (Supplier/Expense)</option>
            </Select>

            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />

            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Date filters use Issue Date.
            </div>
          </div>

          <Table headers={["Type", "Invoice No", "Customer", "Total TTC", "Net (After RS)", "Paid", "Due Date", "Status", "Actions"]}>
            {filtered.map((i) => {
              const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(i) : financeHelpers.invoiceTotal(i);
              const st = badgeForInvoiceStatus(i.status);
              const tp = badgeForInvoiceType(i.type ?? "IN");

              const gross = typeof totals === 'number' ? totals : totals.gross;
              const net = typeof totals === 'number' ? totals : totals.net;
              
              const isDraft = i.status === "Draft";

              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3"><Badge variant={tp.variant}>{tp.label}</Badge></td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{i.invoiceNo}</td>
                  <td className="px-4 py-3">{i.customerName}</td>
                  <td className="px-4 py-3 font-semibold">{gross.toFixed(3)} {i.currency}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{net.toFixed(3)} {i.currency}</td>
                  <td className="px-4 py-3">{i.paidAmount.toFixed(3)} {i.currency}</td>
                  <td className="px-4 py-3">{i.dueDate}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">
                    {isDraft ? (
                      <Button variant="secondary" className="py-1.5" onClick={() => openEditOrView(i)}>Edit</Button>
                    ) : (
                      <Button variant="secondary" className="py-1.5" onClick={() => openEditOrView(i)}>View</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>

          {filtered.length === 0 && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No invoices match your filters.
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title={isViewMode ? `View Invoice: ${form.invoiceNo}` : (editing ? "Edit Draft Invoice" : "Create New Invoice")}
        onClose={() => setOpen(false)}
        footer={
          isViewMode ? (
            <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          ) : (
            <div className="flex w-full justify-between">
              {/* Delete button only appears if editing an existing draft */}
              {editing ? (
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg dark:hover:bg-rose-900/20"
                >
                  Delete Draft
                </button>
              ) : <div></div>}
              
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="secondary" onClick={saveDraft}>Save Draft</Button>
                <Button onClick={handleSend}>Send</Button>
              </div>
            </div>
          )
        }
      >
        <div className="max-h-[65vh] overflow-y-auto overflow-x-hidden pr-2">
          {/* FIELDSET wraps the entire form. If isViewMode is true, EVERYTHING is disabled natively by HTML */}
          <fieldset disabled={isViewMode} className="contents">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              
              {/* IN / OUT Type Selector */}
              <div className="md:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 flex gap-4 items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Transaction Type:</span>
                <div className="flex gap-2">
                  <Button variant={form.type === "IN" ? "primary" : "secondary"} className="py-1.5 px-4" onClick={() => handleTypeChange("IN")}>
                    IN (Customer Sale)
                  </Button>
                  <Button variant={form.type === "OUT" ? "primary" : "secondary"} className="py-1.5 px-4" onClick={() => handleTypeChange("OUT")}>
                    OUT (Supplier Purchase)
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice No</div>
                <Input value={form.invoiceNo} onChange={(e) => setForm((s) => ({ ...s, invoiceNo: e.target.value }))} readOnly className="bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed text-slate-500" />
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{form.type === "IN" ? "Customer" : "Supplier"}</div>
                <Select value={form.customerName} onChange={(e) => handleCustomerSelect(e.target.value)}>
                  <option value="">-- Select Entity --</option>
                  {availableEntities.map(e => (
                    <option key={e.name} value={e.name}>{e.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Matricule Fiscal</div>
                <Input value={form.matriculeFiscal} onChange={(e) => setForm(s => ({ ...s, matriculeFiscal: e.target.value }))} placeholder="1234567/A/B/M/000" />
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Currency</div>
                <Select value={form.currency} onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}>
                  <option value="TND">TND</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </Select>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Issue Date</div>
                <Input type="date" value={form.issueDate} onChange={(e) => setForm((s) => ({ ...s, issueDate: e.target.value }))} />
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Due Date</div>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <div className="mt-4 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:text-slate-100 dark:border-slate-700">Line Item</div>
              </div>

              <div className="md:col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Department / Label</div>
                <Select value={form.lineLabel} onChange={(e) => setForm((s) => ({ ...s, lineLabel: e.target.value }))}>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity</div>
                <Input type="number" min={1} value={form.lineQty} onChange={(e) => setForm((s) => ({ ...s, lineQty: e.target.value }))} />
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Unit Price HT</div>
                <Input type="number" step="0.001" min={0} value={form.lineUnitPrice} onChange={(e) => setForm((s) => ({ ...s, lineUnitPrice: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <div className="mt-4 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:text-slate-100 dark:border-slate-700">Tunisian Taxes</div>
              </div>

              {/* TVA TOGGLE */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">TVA Rate</span>
                  <button 
                    type="button"
                    onClick={() => setForm(s => ({ ...s, applyTva: !s.applyTva }))}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${form.applyTva ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {form.applyTva ? "ON" : "OFF"}
                  </button>
                </div>
                <Input type="number" step="0.01" min={0} value={form.tvaRate} disabled={!form.applyTva} onChange={(e) => setForm((s) => ({ ...s, tvaRate: e.target.value }))} />
              </div>

              {/* FODEC TOGGLE */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">FODEC Rate</span>
                  <button 
                    type="button"
                    onClick={() => setForm(s => ({ ...s, applyFodec: !s.applyFodec }))}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${form.applyFodec ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {form.applyFodec ? "ON" : "OFF"}
                  </button>
                </div>
                <Input type="number" step="0.01" min={0} value={form.fodecRate} disabled={!form.applyFodec} onChange={(e) => setForm((s) => ({ ...s, fodecRate: e.target.value }))} />
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Timbre Fiscal (Fixed Amount)</div>
                <Input type="number" step="0.1" min={0} value={form.timbre} onChange={(e) => setForm((s) => ({ ...s, timbre: e.target.value }))} />
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Retenue à la source (RS) Rate</div>
                <Input type="number" step="0.01" min={0} value={form.retenueRate} onChange={(e) => setForm((s) => ({ ...s, retenueRate: e.target.value }))} />
              </div>

              {/* LIVE SUMMARY BOX */}
              <div className="md:col-span-2 mt-2 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Live Summary</h4>
                {(() => {
                  const ht = (Number(form.lineQty) || 0) * (Number(form.lineUnitPrice) || 0);
                  const effectiveFodec = form.applyFodec ? (Number(form.fodecRate) || 0) : 0;
                  const effectiveTva = form.applyTva ? (Number(form.tvaRate) || 0) : 0;
                  
                  const fodec = ht * effectiveFodec;
                  const tvaBase = ht + fodec;
                  const tva = tvaBase * effectiveTva;
                  const timbre = Number(form.timbre) || 0;
                  const retenue = ht * (Number(form.retenueRate) || 0);
                  
                  const grossTTC = tvaBase + tva + timbre;
                  const netToPay = grossTTC - retenue;

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Amount HT:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{ht.toFixed(3)} {form.currency}</span>
                      </div>
                      {form.applyFodec && fodec > 0 && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>FODEC ({(effectiveFodec * 100).toFixed(1)}%):</span>
                          <span>{fodec.toFixed(3)} {form.currency}</span>
                        </div>
                      )}
                      {form.applyTva && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>TVA ({(effectiveTva * 100).toFixed(0)}%):</span>
                          <span>{tva.toFixed(3)} {form.currency}</span>
                        </div>
                      )}
                      {timbre > 0 && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Timbre Fiscal:</span>
                          <span>{timbre.toFixed(3)} {form.currency}</span>
                        </div>
                      )}
                      <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>Total TTC (Gross):</span>
                        <span className="text-slate-900 dark:text-slate-100">{grossTTC.toFixed(3)} {form.currency}</span>
                      </div>
                      {retenue > 0 && (
                        <div className="flex justify-between text-rose-600 dark:text-rose-400">
                          <span>Retenue à la source (-):</span>
                          <span>{retenue.toFixed(3)} {form.currency}</span>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between rounded-lg bg-slate-900 p-3 text-white dark:bg-white dark:text-slate-900">
                        <span className="font-semibold">Net to Pay:</span>
                        <span className="font-bold">{netToPay.toFixed(3)} {form.currency}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </fieldset>
        </div>
      </Modal>
    </div>
  );
}