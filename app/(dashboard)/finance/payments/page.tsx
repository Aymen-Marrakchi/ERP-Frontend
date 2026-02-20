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
import { Invoice, Payment, PaymentMethod, ReminderLog, useFinance, financeHelpers } from "../store";

function badgeForSimple(s: string) {
  if (s === "Overdue") return { variant: "warning" as const, label: "Overdue" };
  if (s === "Paid") return { variant: "success" as const, label: "Paid" };
  if (s === "Sent") return { variant: "info" as const, label: "Sent" };
  return { variant: "neutral" as const, label: s };
}

export default function FinancePaymentsPage() {
  const { state, dispatch } = useFinance();

  const invoiceById = useMemo(() => Object.fromEntries(state.invoices.map((i) => [i.id, i])), [state.invoices]);

  const overdue = useMemo(() => state.invoices.filter((i) => i.status === "Overdue"), [state.invoices]);

  const [openPay, setOpenPay] = useState(false);
  const [openReminder, setOpenReminder] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(state.invoices[0]?.id ?? "");

  const [payForm, setPayForm] = useState({
    invoiceId: state.invoices[0]?.id ?? "",
    amount: "0",
    method: "Bank" as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
    reference: "",
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
    }));
    setOpenPay(true);
  };

  const savePayment = () => {
    const amt = Number(payForm.amount);
    if (!payForm.invoiceId || !amt || amt <= 0) return;

    const p: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: payForm.invoiceId,
      date: payForm.date,
      amount: amt,
      method: payForm.method,
      reference: payForm.reference.trim() || undefined,
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

  return (
    <div className="space-y-6">
      <Topbar title="Payments & Reminders" subtitle="Record payments, track balances, log reminders" />

      <Card>
        <CardHeader title="Overdue Invoices" subtitle="Send reminders and record payments" right={<Button variant="secondary">Export</Button>} />
        <CardBody>
          <Table headers={["Invoice", "Customer", "Due Date", "Total", "Paid", "Status", "Reminders", "Actions"]}>
            {overdue.map((i) => {
              const total = financeHelpers.invoiceTotal(i);
              const st = badgeForSimple(i.status);
              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{i.invoiceNo}</td>
                  <td className="px-4 py-3">{i.customerName}</td>
                  <td className="px-4 py-3">{i.dueDate}</td>
                  <td className="px-4 py-3">{total.toLocaleString()} {i.currency}</td>
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
        <CardHeader title="Recent Payments" subtitle="Payments recorded and linked to invoices" />
        <CardBody>
          <Table headers={["Date", "Invoice", "Amount", "Method", "Reference"]}>
            {state.payments.map((p) => {
              const inv = invoiceById[p.invoiceId];
              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">{p.date}</td>
                  <td className="px-4 py-3 font-medium">{inv?.invoiceNo ?? "Unknown"}</td>
                  <td className="px-4 py-3">{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.method}</td>
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
              {state.invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNo} — {i.customerName} ({i.status})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Amount</div>
            <Input type="number" min={1} value={payForm.amount} onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Method</div>
            <Select value={payForm.method} onChange={(e) => setPayForm((s) => ({ ...s, method: e.target.value as any }))}>
              <option value="Bank">Bank</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date</div>
            <Input type="date" value={payForm.date} onChange={(e) => setPayForm((s) => ({ ...s, date: e.target.value }))} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reference</div>
            <Input value={payForm.reference} onChange={(e) => setPayForm((s) => ({ ...s, reference: e.target.value }))} placeholder="TRX-..." />
          </div>
        </div>
      </Modal>

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
