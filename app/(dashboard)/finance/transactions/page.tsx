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
import { Transaction, TxType, useFinance } from "../store";

type PeriodPreset = "1M" | "3M" | "CUSTOM";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Fixed for Tunisian Dinar (3 decimals)
function money(n: number) {
  return n.toFixed(3) + " TND";
}

// Translations maps for UI display
const categoryLabel: Record<Transaction["category"], string> = {
  Sales: "Ventes",
  Suppliers: "Fournisseurs",
  Transport: "Transport",
  Payroll: "Salaires",
  Other: "Autre",
};

export default function FinanceTransactionsPage() {
  const { state, dispatch } = useFinance();

  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | TxType>("");
  const [category, setCategory] = useState<"" | Transaction["category"]>("");
  const [status, setStatus] = useState<"" | Transaction["status"]>("");

  const [preset, setPreset] = useState<PeriodPreset>("CUSTOM");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const applyPreset = (p: PeriodPreset) => {
    const t = todayISO();
    if (p === "1M") {
      setTo(t);
      setFrom(addMonthsISO(t, -1));
      return;
    }
    if (p === "3M") {
      setTo(t);
      setFrom(addMonthsISO(t, -3));
      return;
    }
  };

  const onPresetChange = (p: PeriodPreset) => {
    setPreset(p);
    applyPreset(p);
  };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "Expense" as TxType,
    category: "Other" as Transaction["category"],
    amount: "0",
    reference: "",
    status: "Posted" as Transaction["status"],
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return [...state.transactions]
      .filter((t) => {
        if (from && t.date < from) return false;
        if (to && t.date > to) return false;

        const matchQ =
          !query ||
          (t.reference ?? "").toLowerCase().includes(query) ||
          categoryLabel[t.category].toLowerCase().includes(query);

        const matchT = !type || t.type === type;
        const matchC = !category || t.category === category;
        const matchS = !status || t.status === status;

        return matchQ && matchT && matchC && matchS;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, q, type, category, status, from, to]);

  const totals = useMemo(() => {
    const income = filtered.filter((t) => t.type === "Income").reduce((a, t) => a + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "Expense").reduce((a, t) => a + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const save = () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return;

    const tx: Transaction = {
      id: `t-${Date.now()}`,
      date: form.date,
      type: form.type,
      category: form.category,
      amount: amt,
      reference: form.reference.trim() || undefined,
      status: form.status,
    };

    dispatch({ type: "TX_ADD", payload: tx });
    setOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Transactions Financières"
        subtitle="Suivi des revenus et dépenses, catégorisation et filtrage des mouvements de trésorerie"
        right={<Button onClick={() => setOpen(true)}>+ Nouvelle Transaction</Button>}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Revenus (période filtrée)</div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{money(totals.income)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total des encaissements</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Dépenses (période filtrée)</div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{money(totals.expense)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total des décaissements</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Résultat Net (période filtrée)</div>
            <div className={`mt-2 text-2xl font-bold ${totals.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {totals.net > 0 ? "+" : ""}{money(totals.net)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Revenus - Dépenses</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Liste des Transactions" subtitle="Historique complet des flux financiers" right={<Button variant="secondary">Exporter</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-7">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (réf, catégorie)..." />

            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="">Tous les types</option>
              <option value="Income">Revenus</option>
              <option value="Expense">Dépenses</option>
            </Select>

            <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="">Toutes catégories</option>
              <option value="Sales">Ventes</option>
              <option value="Suppliers">Fournisseurs</option>
              <option value="Transport">Transport</option>
              <option value="Payroll">Salaires</option>
              <option value="Other">Autre</option>
            </Select>

            <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">Tous statuts</option>
              <option value="Posted">Validé</option>
              <option value="Pending">En attente</option>
            </Select>

            <Select value={preset} onChange={(e) => onPresetChange(e.target.value as PeriodPreset)}>
              <option value="CUSTOM">Dates libres</option>
              <option value="1M">1 Dernier Mois</option>
              <option value="3M">3 Derniers Mois</option>
            </Select>

            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("CUSTOM"); }} />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("CUSTOM"); }} />
          </div>

          <Table headers={["Date", "Type", "Catégorie", "Montant", "Référence", "Statut"]}>
            {filtered.map((t) => (
              <tr key={t.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.date}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.type === "Income" ? "success" : "neutral"}>
                    {t.type === "Income" ? "Revenu" : "Dépense"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                  {categoryLabel[t.category]}
                </td>
                <td className={`px-4 py-3 font-semibold ${t.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {t.type === "Income" ? "+" : "-"} {money(t.amount)}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.reference ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.status === "Posted" ? "neutral" : "warning"}>
                    {t.status === "Posted" ? "Validé" : "En attente"}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>

          {filtered.length === 0 ? (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Aucune transaction trouvée pour ces critères.
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Ajouter une Transaction"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save}>Enregistrer</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date</div>
            <Input type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Type de flux</div>
            <Select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as any }))}>
              <option value="Income">Revenu (Entrée)</option>
              <option value="Expense">Dépense (Sortie)</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Catégorie</div>
            <Select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as any }))}>
              <option value="Sales">Ventes</option>
              <option value="Suppliers">Fournisseurs</option>
              <option value="Transport">Frais de Transport</option>
              <option value="Payroll">Salaires</option>
              <option value="Other">Autre / Frais Bancaires</option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Montant (TND)</div>
            <Input type="number" step="0.001" min={0.001} value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Référence (optionnel)</div>
            <Input
              value={form.reference}
              onChange={(e) => setForm((s) => ({ ...s, reference: e.target.value }))}
              placeholder="Ex: Facture Fournisseur F-902, Loyer..."
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Statut</div>
            <Select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as any }))}>
              <option value="Posted">Validé (Effectué)</option>
              <option value="Pending">En attente (Planifié)</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}