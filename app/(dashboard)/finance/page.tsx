"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

// --- Mock Data for Charts ---
const monthlyData = [
  { name: "Sep", revenue: 45000, expenses: 32000, cashIn: 41000 },
  { name: "Oct", revenue: 52000, expenses: 34000, cashIn: 48000 },
  { name: "Nov", revenue: 48000, expenses: 31000, cashIn: 46000 },
  { name: "Dec", revenue: 61000, expenses: 42000, cashIn: 58000 },
  { name: "Jan", revenue: 55000, expenses: 38000, cashIn: 52000 },
  { name: "Feb", revenue: 68000, expenses: 39500, cashIn: 64000 },
];

// Transaction Data
const recentTransactions = [
  { id: "TRX-1092", date: "26 Fév 2026", desc: "Paiement Client - STE Alpha", type: "Revenu", amount: "+ 4 500,000 DT", status: "success", statusLabel: "Complété" },
  { id: "TRX-1091", date: "25 Fév 2026", desc: "Achat Matières Premières", type: "Dépense", amount: "- 1 250,000 DT", status: "success", statusLabel: "Complété" },
  { id: "TRX-1090", date: "24 Fév 2026", desc: "Facture F-2026-042 (En attente RS)", type: "Revenu", amount: "+ 8 200,000 DT", status: "warning", statusLabel: "En Attente" },
  { id: "TRX-1089", date: "22 Fév 2026", desc: "Paiement Fournisseur - TechGros", type: "Dépense", amount: "- 3 100,000 DT", status: "neutral", statusLabel: "Traité" },
];

// Helper to format currency
const formatMoney = (value: number) => `${(value / 1000).toFixed(1)}k DT`;
const formatTooltipMoney = (value: unknown, label: string): [string, string] => {
  const raw = Array.isArray(value) ? value[0] : value;
  return [`${Number(raw ?? 0).toLocaleString()} DT`, label];
};

export default function FinanceDashboardPage() {
  // Calculate Expense Trend (Current Month vs Last Month)
  const currentMonthExp = monthlyData[monthlyData.length - 1].expenses;
  const lastMonthExp = monthlyData[monthlyData.length - 2].expenses;
  const expenseTrend = ((currentMonthExp - lastMonthExp) / lastMonthExp) * 100;
  const isExpenseUp = expenseTrend > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de Bord Financier</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aperçu de la performance, trésorerie et rentabilité.
          </p>
        </div>
        <div className="flex gap-2">
           <Link href="/finance/invoices" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
             + Nouvelle Facture
           </Link>
        </div>
      </div>

      {/* KPI Grid (Summary) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chiffre d'Affaires (Fév)</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">68 000 DT</p>
            <span className="inline-flex items-center text-xs font-medium text-emerald-600 mt-1">
              +23.6% vs Janvier
            </span>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Dépenses (Fév)</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">39 500 DT</p>
            <span className={`inline-flex items-center text-xs font-medium mt-1 ${isExpenseUp ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isExpenseUp ? '+' : ''}{expenseTrend.toFixed(1)}% vs Janvier
            </span>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Trésorerie Nette</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">93 950 DT</p>
            <span className="text-xs text-slate-500">Disponible en banque</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Encaissements (Cash In)</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">64 000 DT</p>
            <span className="text-xs text-slate-500">Reçu ce mois-ci</span>
          </CardBody>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* 1. COURBE CA (Revenue Evolution) */}
        <Card>
          <CardHeader title="Évolution du Chiffre d'Affaires (CA)" subtitle="6 derniers mois" />
          <CardBody>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    tickFormatter={formatMoney}
                  />
                  <Tooltip 
                    formatter={(value) => formatTooltipMoney(value, "CA")}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* 2. DEPENSES TREND (Expenses Bar Chart) */}
        <Card>
          <CardHeader 
            title="Tendance des Dépenses" 
            subtitle="Comparatif mensuel des charges" 
            right={
              <Badge variant={isExpenseUp ? "warning" : "success"}>
                {isExpenseUp ? "Tendance Hausse" : "Tendance Baisse"}
              </Badge>
            }
          />
          <CardBody>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    tickFormatter={formatMoney}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    formatter={(value) => formatTooltipMoney(value, "Dépenses")}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="#334155" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* 3. MONEY IN (Cash Flow Chart) */}
        <Card>
          <CardHeader title="Flux Entrants (Cash In)" subtitle="Encaissements réels par mois" />
          <CardBody>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    width={40}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    formatter={(value) => formatTooltipMoney(value, "Encaissements")}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="cashIn" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]} 
                    barSize={20} 
                    background={{ fill: '#f1f5f9' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Recent Transactions Table */}
        <Card>
          <CardHeader title="Transactions Récentes" subtitle="Derniers mouvements bancaires" />
          <CardBody>
            <Table headers={["Date", "Description", "Type", "Montant", "Statut"]}>
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{tx.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{tx.desc}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={tx.type === "Revenu" ? "success" : "neutral"}>{tx.type}</Badge>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm font-bold ${tx.type === 'Revenu' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
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
    </div>
  );
}
