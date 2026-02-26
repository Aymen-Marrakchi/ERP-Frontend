"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useMemo, useState } from "react";
import { useFinance, Transaction } from "../store";

type PeriodPreset = "1M" | "3M" | "CUSTOM";

function startOfTodayISO() {
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
const categoryLabel: Record<string, string> = {
  Sales: "Ventes",
  Suppliers: "Fournisseurs",
  Transport: "Transport",
  Payroll: "Salaires",
  Other: "Autre",
};

export default function FinanceReportsPage() {
  const { state } = useFinance();

  const [preset, setPreset] = useState<PeriodPreset>("1M");
  const [from, setFrom] = useState(addMonthsISO(startOfTodayISO(), -1));
  const [to, setTo] = useState(startOfTodayISO());

  // Apply preset to dates
  const applyPreset = (p: PeriodPreset) => {
    const today = startOfTodayISO();
    if (p === "1M") {
      setTo(today);
      setFrom(addMonthsISO(today, -1));
      return;
    }
    if (p === "3M") {
      setTo(today);
      setFrom(addMonthsISO(today, -3));
      return;
    }
  };

  // Posted transactions in period
  const tx = useMemo(() => {
    return state.transactions
      .filter((t) => t.status === "Posted")
      .filter((t) => {
        if (from && t.date < from) return false;
        if (to && t.date > to) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, from, to]);

  // Main numbers + simple balance sheet model
  const report = useMemo(() => {
    const revenue = tx.filter((t) => t.type === "Income").reduce((a, t) => a + t.amount, 0);
    const expenses = tx.filter((t) => t.type === "Expense").reduce((a, t) => a + t.amount, 0);
    const net = revenue - expenses;

    // PFE simple balance sheet model
    const cash = net;
    const assets = cash;
    const liabilities = 0;
    const equity = assets - liabilities;

    return { revenue, expenses, net, cash, assets, liabilities, equity };
  }, [tx]);

  const byCategory = useMemo(() => {
    const rev: Record<string, number> = {};
    const exp: Record<string, number> = {};

    for (const t of tx) {
      if (t.type === "Income") rev[t.category] = (rev[t.category] ?? 0) + t.amount;
      if (t.type === "Expense") exp[t.category] = (exp[t.category] ?? 0) + t.amount;
    }

    const revenueByCat = Object.entries(rev)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const expenseByCat = Object.entries(exp)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { revenueByCat, expenseByCat };
  }, [tx]);

  // Light “health” badges
  const netBadge = useMemo(() => {
    if (report.net > 0) return <Badge variant="success">Bénéficiaire</Badge>;
    if (report.net < 0) return <Badge variant="danger">Déficitaire</Badge>;
    return <Badge variant="neutral">À l'équilibre</Badge>;
  }, [report.net]);

  const onPresetChange = (p: PeriodPreset) => {
    setPreset(p);
    applyPreset(p);
  };

  const generate = () => {
    // UI-only button (filters already reactive)
  };

  return (
    <div className="space-y-6 p-6">
      <Topbar
        title="Rapports Financiers"
        subtitle="Compte de résultat, Bilan et résumé du grand livre (Modèle simplifié PFE)"
        right={<Button variant="secondary">Exporter PDF/Excel</Button>}
      />

      {/* Filters */}
      <Card>
        <CardHeader title="Filtres du Rapport" subtitle="Sélectionnez une période d'analyse" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <Select value={preset} onChange={(e) => onPresetChange(e.target.value as PeriodPreset)}>
              <option value="1M">1 Dernier Mois</option>
              <option value="3M">3 Derniers Mois</option>
              <option value="CUSTOM">Personnalisé</option>
            </Select>

            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("CUSTOM"); }} />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("CUSTOM"); }} />

            <div className="md:col-span-2 flex items-center gap-2">
              <Button onClick={generate}>Actualiser</Button>
              <Button variant="secondary" onClick={() => { setFrom(""); setTo(""); setPreset("CUSTOM"); }}>
                Réinitialiser
              </Button>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Transactions validées uniquement.
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Chiffre d'Affaires</div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{money(report.revenue)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total des revenus</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Dépenses</div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{money(report.expenses)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total des charges</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Résultat Net</div>
            <div className={`mt-2 text-2xl font-bold flex items-center gap-2 ${report.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {money(report.net)} {netBadge}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Revenus - Dépenses</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-xs text-slate-500 dark:text-slate-400">Trésorerie Actuelle</div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{money(report.cash)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Disponibilités (Bilan)</div>
          </CardBody>
        </Card>
      </div>

      {/* P&L + Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Card>
            <CardHeader title="Compte de Résultat" subtitle="Synthèse des performances" right={<Button variant="secondary">Exporter</Button>} />
            <CardBody>
              <Table headers={["Rubrique", "Montant"]}>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Revenus d'exploitation</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{money(report.revenue)}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Charges d'exploitation</td>
                  <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">- {money(report.expenses)}</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Résultat Net de l'Exercice</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{money(report.net)}</td>
                </tr>
              </Table>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card>
            <CardHeader title="Répartition par Catégorie" subtitle="Analyse détaillée des flux" right={<Button variant="secondary">Exporter</Button>} />
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Entrées (Revenus)
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                          <th className="px-4 py-3 text-left font-semibold">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {byCategory.revenueByCat.length ? (
                          byCategory.revenueByCat.map((r) => (
                            <tr key={r.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">{categoryLabel[r.category] || r.category}</td>
                              <td className="px-4 py-3 font-semibold">{money(r.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center" colSpan={2}>Aucun revenu.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sorties (Dépenses)
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                          <th className="px-4 py-3 text-left font-semibold">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {byCategory.expenseByCat.length ? (
                          byCategory.expenseByCat.map((r) => (
                            <tr key={r.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">{categoryLabel[r.category] || r.category}</td>
                              <td className="px-4 py-3 font-semibold">{money(r.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center" colSpan={2}>Aucune dépense.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Balance Sheet */}
      <Card>
        <CardHeader title="Bilan Comptable (Simplifié)" subtitle="Actif / Passif / Capitaux Propres" right={<Button variant="secondary">Exporter</Button>} />
        <CardBody>
          <Table headers={["Poste du Bilan", "Montant"]}>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Total Actif (Trésorerie & Équivalents)</td>
              <td className="px-4 py-3 font-semibold">{money(report.assets)}</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Total Passif (Dettes)</td>
              <td className="px-4 py-3 font-semibold">{money(report.liabilities)}</td>
            </tr>
            <tr className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Capitaux Propres</td>
              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{money(report.equity)}</td>
            </tr>
          </Table>

          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <strong>Note PFE :</strong> Modèle simplifié basé uniquement sur les flux de trésorerie validés. 
            L'intégration avec les modules d'inventaire (valorisation des stocks) et de facturation (créances/dettes) permettra de générer un bilan complet.
          </div>
        </CardBody>
      </Card>

      {/* Ledger */}
      <Card>
        <CardHeader title="Grand Livre" subtitle="Détail des écritures comptables pour la période sélectionnée" right={<Button variant="secondary">Exporter Grand Livre</Button>} />
        <CardBody>
          <Table headers={["Date", "Type", "Catégorie", "Montant", "Référence", "Statut"]}>
            {tx.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.date}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.type === "Income" ? "success" : "neutral"}>
                    {t.type === "Income" ? "Revenu" : "Dépense"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                  {categoryLabel[t.category] || t.category}
                </td>
                <td className={`px-4 py-3 font-semibold ${t.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {t.type === "Income" ? "+" : "-"} {money(t.amount)}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.reference ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="success">Validé</Badge>
                </td>
              </tr>
            ))}
          </Table>

          {tx.length === 0 ? (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Aucune transaction validée sur cette période.
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}