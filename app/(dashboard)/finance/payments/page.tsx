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
  if (s === "Overdue") return { variant: "warning" as const, label: "En Retard" };
  if (s === "Paid") return { variant: "success" as const, label: "Payé" };
  if (s === "Sent") return { variant: "info" as const, label: "Envoyée" };
  return { variant: "neutral" as const, label: s };
}

function badgeForMethod(m: PaymentMethod) {
  if (m === "Cheque") return { variant: "warning" as const, label: "Chèque" };
  if (m === "Cash") return { variant: "neutral" as const, label: "Espèces" };
  if (m === "Kimbial") return { variant: "info" as const, label: "Traite (Kimbial)" };
  if (m === "Bank") return { variant: "info" as const, label: "Virement" };
  return { variant: "success" as const, label: "Carte" };
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

  const [payFrom, setPayFrom] = useState("");
  const [payTo, setPayTo] = useState("");

  const [payForm, setPayForm] = useState({
    invoiceId: state.invoices[0]?.id ?? "",
    amount: "0",
    method: "Cheque" as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
    reference: "",
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
      method: "Cheque",
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

    const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(inv) : null;
    const due = totals?.due ?? Math.max(0, financeHelpers.invoiceTotal(inv) - (inv.paidAmount ?? 0));

    const applied = Math.min(amt, due); // avoid overpay in UI

    // Only apply terms if the method is delayed (Cheque, Kimbial, Bank)
    const isDelayed = ["Cheque", "Kimbial", "Bank"].includes(payForm.method);

    const p: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: payForm.invoiceId,
      date: payForm.date,
      amount: applied,
      method: payForm.method,
      reference: payForm.reference.trim() || undefined,
      termPreset: isDelayed ? payForm.termPreset : undefined,
      customTermDays: (isDelayed && payForm.termPreset === "CUSTOM") ? Math.max(1, Number(payForm.customDays) || 1) : undefined,
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

  // Determine if current selected payment method requires a term
  const requiresTerm = ["Cheque", "Kimbial", "Bank"].includes(payForm.method);

  return (
    <div className="space-y-6 p-6">
      <Topbar title="Paiements & Relances" subtitle="Gestion des factures impayées, méthodes de paiement et historique des relances" />

      <Card>
        <CardHeader title="Factures en Retard" subtitle="Enregistrer des paiements ou effectuer des relances" />
        <CardBody>
          <Table headers={["Facture", "Client", "Échéance", "Reste à Payer", "Déjà Payé", "Statut", "Relances", "Actions"]}>
            {overdue.map((i) => {
              const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(i) : null;
              const due = totals?.due ?? Math.max(0, financeHelpers.invoiceTotal(i) - (i.paidAmount ?? 0));
              const st = badgeForSimple(i.status);

              return (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{i.invoiceNo}</td>
                  <td className="px-4 py-3">{i.customerName}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">{i.dueDate}</td>
                  <td className="px-4 py-3 font-bold">{due.toFixed(3)} {i.currency}</td>
                  <td className="px-4 py-3 text-slate-500">{i.paidAmount.toFixed(3)} {i.currency}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-4 py-3 font-medium text-slate-500">{reminderCount(i.id)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button className="py-1.5" onClick={() => openPaymentFor(i.id)}>Payer</Button>
                      <Button variant="secondary" className="py-1.5" onClick={() => openReminderFor(i.id)}>Relancer</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>

          {overdue.length === 0 ? (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Aucune facture en retard pour le moment.
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historique des Paiements" subtitle="Filtrer par date d'encaissement" />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input type="date" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
            <Input type="date" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
            <div className="md:col-span-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Affiche tous les encaissements (Chèque, Traite, Espèces, Virement).
            </div>
          </div>

          <Table headers={["Date", "Facture", "Client", "Montant", "Méthode", "Échéance", "Référence"]}>
            {filteredPayments.map((p) => {
              const inv = invoiceById[p.invoiceId];
              const mb = badgeForMethod(p.method);

              const term = p.termPreset === "CUSTOM"
                ? `Custom ${p.customTermDays ?? ""}j`
                : p.termPreset === "3M" ? "90 jours"
                : p.termPreset === "1M" ? "30 jours" : "Immédiat";

              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{inv?.invoiceNo ?? "Inconnue"}</td>
                  <td className="px-4 py-3">{inv?.customerName ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">+ {p.amount.toFixed(3)} {inv?.currency ?? "TND"}</td>
                  <td className="px-4 py-3"><Badge variant={mb.variant}>{mb.label}</Badge></td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{term}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.reference ?? "—"}</td>
                </tr>
              );
            })}
          </Table>
        </CardBody>
      </Card>

      {/* REMINDER LOG CARD */}
      <Card>
        <CardHeader title="Journal des Relances" subtitle="Traçabilité des communications (Email, Téléphone, WhatsApp)" />
        <CardBody>
          <div className="mb-4 max-w-sm">
            <Select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
              <option value="">-- Sélectionner une facture --</option>
              {state.invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNo} — {i.customerName}
                </option>
              ))}
            </Select>
          </div>

          <Table headers={["Date", "Facture", "Canal", "Note"]}>
            {state.reminders
              .filter((r) => r.invoiceId === selectedInvoiceId)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((r) => {
                const inv = invoiceById[r.invoiceId];
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3 font-medium">{inv?.invoiceNo ?? "Inconnue"}</td>
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
        title="Enregistrer un Paiement"
        onClose={() => setOpenPay(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenPay(false)}>Annuler</Button>
            <Button onClick={savePayment}>Confirmer Paiement</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Facture Associée</div>
            <Select value={payForm.invoiceId} onChange={(e) => setPayForm((s) => ({ ...s, invoiceId: e.target.value }))}>
              {state.invoices.map((i) => {
                const totals = financeHelpers.invoiceTotals ? financeHelpers.invoiceTotals(i) : null;
                const due = totals?.due ?? Math.max(0, financeHelpers.invoiceTotal(i) - (i.paidAmount ?? 0));
                return (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNo} — {i.customerName} (Reste: {due.toFixed(3)} {i.currency})
                  </option>
                );
              })}
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Montant Reçu</div>
            <Input type="number" step="0.001" min={0.001} value={payForm.amount} onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Méthode</div>
            <Select value={payForm.method} onChange={(e) => setPayForm((s) => ({ ...s, method: e.target.value as any }))}>
              <option value="Cheque">Chèque</option>
              <option value="Kimbial">Traite (Kimbial)</option>
              <option value="Bank">Virement</option>
              <option value="Cash">Espèces</option>
              <option value="Card">Carte Bancaire</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date du Paiement</div>
            <Input type="date" value={payForm.date} onChange={(e) => setPayForm((s) => ({ ...s, date: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Référence (N° Chèque/Traite)</div>
            <Input value={payForm.reference} onChange={(e) => setPayForm((s) => ({ ...s, reference: e.target.value }))} placeholder="N°..." />
          </div>

          {/* DYNAMIC TERM DISPLAY: Only show if Cheque, Kimbial, or Bank */}
          {requiresTerm && (
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Échéance de l'effet</div>
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
                <option value="1M">30 Jours</option>
                <option value="3M">90 Jours</option>
                <option value="CUSTOM">Personnalisée</option>
              </Select>

              {payForm.termPreset === "CUSTOM" && (
                <div className="mt-3">
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Durée personnalisée (en jours)</div>
                  <Input
                    type="number"
                    min={1}
                    value={payForm.customDays}
                    onChange={(e) => setPayForm((s) => ({ ...s, customDays: e.target.value }))}
                    placeholder="Ex: 45"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* REMINDER MODAL */}
      <Modal
        open={openReminder}
        title="Nouvelle Relance"
        onClose={() => setOpenReminder(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenReminder(false)}>Annuler</Button>
            <Button onClick={saveReminder}>Enregistrer</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Facture Concernée</div>
            <Select value={remForm.invoiceId} onChange={(e) => setRemForm((s) => ({ ...s, invoiceId: e.target.value }))}>
              {state.invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNo} — {i.customerName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Canal de Communication</div>
            <Select value={remForm.channel} onChange={(e) => setRemForm((s) => ({ ...s, channel: e.target.value as any }))}>
              <option value="Email">Email</option>
              <option value="Phone">Téléphone</option>
              <option value="WhatsApp">WhatsApp</option>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Notes / Compte Rendu</div>
            <Input value={remForm.note} onChange={(e) => setRemForm((s) => ({ ...s, note: e.target.value }))} placeholder="Le client promet de payer demain..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}