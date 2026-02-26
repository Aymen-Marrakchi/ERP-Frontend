import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

// --- Mock Data ---
const kpis = [
  { id: 1, title: "Chiffre d'Affaires", value: "145 200,00 DT", trend: "+12.5%", isPositive: true },
  { id: 2, title: "Dépenses", value: "38 450,00 DT", trend: "-2.4%", isPositive: true }, // Decrease in expenses is good
  { id: 3, title: "Factures en Attente", value: "12 800,00 DT", trend: "8 factures", isPositive: false },
  { id: 4, title: "Trésorerie Nette", value: "93 950,00 DT", trend: "+8.2%", isPositive: true },
];

const recentTransactions = [
  { id: "TRX-1092", date: "26 Fév 2026", desc: "Paiement Client - STE Alpha", type: "Revenu", amount: "+ 4 500,00 DT", status: "success", statusLabel: "Complété" },
  { id: "TRX-1091", date: "25 Fév 2026", desc: "Achat Matières Premières", type: "Dépense", amount: "- 1 250,00 DT", status: "success", statusLabel: "Complété" },
  { id: "TRX-1090", date: "24 Fév 2026", desc: "Facture F-2026-042 (En attente RS)", type: "Revenu", amount: "+ 8 200,00 DT", status: "warning", statusLabel: "En Attente" },
  { id: "TRX-1089", date: "22 Fév 2026", desc: "Paiement Fournisseur - TechGros", type: "Dépense", amount: "- 3 100,00 DT", status: "neutral", statusLabel: "Traité" },
  { id: "TRX-1088", date: "20 Fév 2026", desc: "Frais Bancaires", type: "Dépense", amount: "- 45,00 DT", status: "danger", statusLabel: "Rejeté" },
];

export default function FinanceDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de Bord Financier</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Aperçu général de la trésorerie, des revenus et des dépenses.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id}>
            <CardBody>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.title}</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    kpi.isPositive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  }`}
                >
                  {kpi.trend}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Transactions Table (Takes up 2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Transactions Récentes"
              subtitle="Historique des derniers mouvements financiers"
            />
            <CardBody>
              <Table headers={["ID", "Date", "Description", "Montant", "Statut"]}>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {tx.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {tx.desc}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 font-medium ${tx.type === 'Revenu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {tx.amount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={tx.status as any}>{tx.statusLabel}</Badge>
                    </td>
                  </tr>
                ))}
              </Table>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions / Side Panel (Takes up 1/3 width) */}
        <div className="space-y-3">
                <Link href="/finance/invoices" className="block w-full text-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  + Nouvelle Facture
                </Link>
                <Link href="/finance/transactions" className="block w-full text-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                  Enregistrer une Dépense
                </Link>
                <Link href="/finance/reports" className="block w-full text-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                  Voir les Rapports Financiers
                </Link>
              </div>
      </div>
    </div>
  );
}