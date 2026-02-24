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
import { Payment, PaymentMethod, ReminderLog, useFinance, financeHelpers } from "../store";

type TermPreset = "1M" | "3M" | "CUSTOM";

function badgeForSimple(s: string) {
  if (s === "Overdue") return { variant: "warning" as const, label: "Overdue" };
  if (s === "Paid") return { variant: "success" as const, label: "Paid" };
  if (s === "Sent") return { variant: "info" as const, label: "Sent" };
  return { variant: "neutral" as const, label: s };
}

function badgeForMethod(m: PaymentMethod) {
  if (m === "Cheque") return { variant: "warning" as const, label: "Cheque" };
  if (m === "Cash") return { variant: "neutral" as const, label: "Cash" };
  // company wording "kimbyl" → we use "Kimbial"
  if (m === "Kimbial") return { variant: "info" as const, label: "Kimbial" };
  if (m === "Bank") return { variant: "info" as const, label: "Bank" };
  return { variant: "success" as const, label: "Card" };
}

export default function FinancePaymentsPage() {
  const { state, dispatch } = useFinance();

  const invoiceById = useMemo(() => Object.fromEntries(state.invoices.map((i) => [i.id, i])), [state.invoices]);

  // Overdue = status Overdue OR dueDate < today AND still due > 0
  const overdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.invoices
      .map((i) => ({ i, totals: financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(i) : null }))
      .filter(({ i, totals }) => {
        const due = totals?.due ?? Math.max(0, financeHelpers.invoiceTotal(i) - (i.paidAmount ?? 0));
        const isLate = i.dueDate < today;
        return (i.status === "Overdue" || isLate) && due > 0;
      })
      .map((x) => x.i);
  }, [state.invoices]);

  const [openPay, setOpenPay] = useState(false);
  const [openReminder, setOpenReminder] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(state.invoices[0]?.id ?? "");

  // Date filter for payments list
  const [payFrom, setPayFrom] = useState("");
  const [payTo, setPayTo] = useState("");

  const [payForm, setPayForm] = useState({
    invoiceId: state.invoices[0]?.id ?? "",
    amount: "0",
    method: "Cheque" as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
    reference: "",

    // NEW
    termPreset: "1M" as TermPreset,
    customDays: "30",
  });

  const [remForm, setRemForm] = useState({
    invoiceId: "",
    channel: "Email" as ReminderLog["channel"],
    note: "",
  });

  const openPaymentFor = (invoiceId: string) => {
    setPayForm((s) => ({
      ...s,
      invoiceId,
      date: new Date().toISOString().slice(0, 10),
      amount: "0",
      reference: "",
      termPreset: "1M",
      customDays: "30",
    }));
    setOpenPay(true);
  };

  const savePayment = () => {
    const amt = Number(payForm.amount);
    if (!payForm.invoiceId || !amt || amt <= 0) return;

    const inv = invoiceById[payForm.invoiceId];
    if (!inv) return;

    // If you have invoiceTotals helper with taxes, use due from there
    const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(inv) : null;
    const due = totals?.due ?? Math.max(0, financeHelpers.invoiceTotal(inv) - (inv.paidAmount ?? 0));

    const applied = Math.min(amt, due); // avoid overpay in UI

    const p: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: payForm.invoiceId,
      date: payForm.date,
      amount: applied,
      method: payForm.method,
      reference: payForm.reference.trim() || undefined,

      // NEW fields (requires Payment type update)
      termPreset: payForm.termPreset,
      customTermDays: payForm.termPreset === "CUSTOM" ? Math.max(1, Number(payForm.customDays) || 1) : undefined,
    };

    dispatch({ type: "PAYMENT_ADD", payload: p });

    setOpenPay(false);
  };

  const openReminderFor = (invoiceId: string) => {
    setRemForm({ invoiceId, channel: "Email", note: "" });
    setOpenReminder(true);
  };

  const saveReminder = () => {
    if (!remForm.invoiceId) return;

    const r: ReminderLog = {
      id: `rem-${Date.now()}`,
      invoiceId: remForm.invoiceId,
      date: new Date().toISOString().slice(0, 10),
      channel: remForm.channel,
      note: remForm.note.trim() || undefined,
    };

    dispatch({ type: "REMINDER_ADD", payload: r });
    setOpenReminder(false);
  };

  const reminderCount = (invoiceId: string) =>
    state.reminders.filter((r) => r.invoiceId === invoiceId).length;

  const filteredPayments = useMemo(() => {
    return [...state.payments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((p) => {
        const matchFrom = !payFrom || p.date >= payFrom;
        const matchTo = !payTo || p.date <= payTo;
        return matchFrom && matchTo;
      });
  }, [state.payments, payFrom, payTo]);

  return (
    <div className="space-y-6">
      <Topbar title="Payments & Reminders" subtitle="Overdue invoices, payment methods, terms and reminder logs" />

      <Card>
        <CardHeader title="Overdue Invoices" subtitle="Record payments and log reminders" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <Table headers={["Invoice", "Customer", "Due Date", "Net Due", "Paid", "Status", "Reminders", "Actions"]}>
            {overdue.map((i) => {
              const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(i) : null;
              const due = totals?.due ?? Math.max(0, financeHelpers.invoiceTotal(i) - (i.paidAmount ?? 0));

              const st = badgeForSimple(i.status);
              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{i.invoiceNo}</td>
                  <td className="px-4 py-3">{i.customerName}</td>
                  <td className="px-4 py-3">{i.dueDate}</td>
                  <td className="px-4 py-3 font-semibold">{due.toLocaleString()} {i.currency}</td>
                  <td className="px-4 py-3">{i.paidAmount.toLocaleString()} {i.currency}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3">{reminderCount(i.id)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button className="py-1.5" onClick={() => openPaymentFor(i.id)}>Record Payment</Button>
                      <Button variant="secondary" className="py-1.5" onClick={() => openReminderFor(i.id)}>Log Reminder</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>

          {overdue.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No overdue invoices right now.
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recent Payments" subtitle="Filter by payment date (from/to)" />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input type="date" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
            <Input type="date" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Payment methods include Cheque, Cash, Kimbial. Terms: 1M, 3M, Custom.
            </div>
          </div>

          <Table headers={["Date", "Invoice", "Customer", "Amount", "Method", "Term", "Reference"]}>
            {filteredPayments.map((p) => {
              const inv = invoiceById[p.invoiceId];
              const mb = badgeForMethod(p.method);

              const term =
                p.termPreset === "CUSTOM"
                  ? `Custom ${p.customTermDays ?? ""}d`
                  : p.termPreset === "3M"
                    ? "3 months"
                    : p.termPreset === "1M"
                      ? "1 month"
                      : "—";

              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">{p.date}</td>
                  <td className="px-4 py-3 font-medium">{inv?.invoiceNo ?? "Unknown"}</td>
                  <td className="px-4 py-3">{inv?.customerName ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{p.amount.toLocaleString()} {inv?.currency ?? "TND"}</td>
                  <td className="px-4 py-3"><Badge variant={mb.variant}>{mb.label}</Badge></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{term}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.reference ?? "—"}</td>
                </tr>
              );
            })}
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reminder Log" subtitle="Traceability of reminder actions (email/phone/WhatsApp)" />
        <CardBody>
          <div className="mb-3">
            <Select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
              {state.invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNo} — {i.customerName}
                </option>
              ))}
            </Select>
          </div>

          <Table headers={["Date", "Invoice", "Channel", "Note"]}>
            {state.reminders
              .filter((r) => r.invoiceId === selectedInvoiceId)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((r) => {
                const inv = invoiceById[r.invoiceId];
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3 font-medium">{inv?.invoiceNo ?? "Unknown"}</td>
                    <td className="px-4 py-3">{r.channel}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.note ?? "—"}</td>
                  </tr>
                );
              })}
          </Table>
        </CardBody>
      </Card>

      {/* PAYMENT MODAL */}
      <Modal
        open={openPay}
        title="Record Payment"
        onClose={() => setOpenPay(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenPay(false)}>Cancel</Button>
            <Button onClick={savePayment}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice</div>
            <Select value={payForm.invoiceId} onChange={(e) => setPayForm((s) => ({ ...s, invoiceId: e.target.value }))}>
              {state.invoices.map((i) => {
                const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(i) : null;
                const due = totals?.due ?? Math.max(0, financeHelpers.invoiceTotal(i) - (i.paidAmount ?? 0));
                return (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNo} — {i.customerName} (Due {due.toLocaleString()} {i.currency})
                  </option>
                );
              })}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Amount</div>
            <Input type="number" min={1} value={payForm.amount} onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Method</div>
            <Select value={payForm.method} onChange={(e) => setPayForm((s) => ({ ...s, method: e.target.value as any }))}>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
              <option value="Kimbial">Kimbial</option>
              <option value="Bank">Bank</option>
              <option value="Card">Card</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Date</div>
            <Input type="date" value={payForm.date} onChange={(e) => setPayForm((s) => ({ ...s, date: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reference</div>
            <Input value={payForm.reference} onChange={(e) => setPayForm((s) => ({ ...s, reference: e.target.value }))} placeholder="TRX-..." />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Term</div>
            <Select
              value={payForm.termPreset}
              onChange={(e) => {
                const v = e.target.value as TermPreset;
                setPayForm((s) => ({
                  ...s,
                  termPreset: v,
                  customDays: v === "CUSTOM" ? s.customDays : v === "1M" ? "30" : "90",
                }));
              }}
            >
              <option value="1M">1 month</option>
              <option value="3M">3 months</option>
              <option value="CUSTOM">Custom</option>
            </Select>
          </div>

          {payForm.termPreset === "CUSTOM" ? (
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Custom duration (days)</div>
              <Input
                type="number"
                min={1}
                value={payForm.customDays}
                onChange={(e) => setPayForm((s) => ({ ...s, customDays: e.target.value }))}
                placeholder="e.g. 45"
              />
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use custom duration for payment plans or negotiated terms.
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* REMINDER MODAL */}
      <Modal
        open={openReminder}
        title="Log Reminder"
        onClose={() => setOpenReminder(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenReminder(false)}>Cancel</Button>
            <Button onClick={saveReminder}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice</div>
            <Select value={remForm.invoiceId} onChange={(e) => setRemForm((s) => ({ ...s, invoiceId: e.target.value }))}>
              {state.invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNo} — {i.customerName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Channel</div>
            <Select value={remForm.channel} onChange={(e) => setRemForm((s) => ({ ...s, channel: e.target.value as any }))}>
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="WhatsApp">WhatsApp</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Note</div>
            <Input value={remForm.note} onChange={(e) => setRemForm((s) => ({ ...s, note: e.target.value }))} placeholder="Short note..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
