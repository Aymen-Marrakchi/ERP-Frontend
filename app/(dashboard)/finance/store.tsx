"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type PaymentMethod = "Bank" | "Cash" | "Cheque" | "Card" | "Kimbial";

export type InvoiceLine = {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
};

export type InvoiceTaxes = {
  tvaRate: number;
  fodecRate: number;
  timbre: number;
  retenueRate: number;
};

export type Invoice = {
  id: string;
  invoiceNo: string;
  customerName: string;
  type?: "IN" | "OUT";
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  status: InvoiceStatus;
  currency: string;  // "TND", "EUR" etc (UI)
  notes?: string;
  lines: InvoiceLine[];
  taxes?: InvoiceTaxes;
  paidAmount: number; // accumulated payments
};

export type Payment = {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  termPreset?: "1M" | "3M" | "CUSTOM";
  customTermDays?: number;
};

export type ReminderLog = {
  id: string;
  invoiceId: string;
  date: string;
  channel: "Email" | "Phone" | "WhatsApp";
  note?: string;
};

export type TxType = "Income" | "Expense";
export type TxStatus = "Posted" | "Pending";

export type Transaction = {
  id: string;
  date: string;
  type: TxType;
  category: "Sales" | "Suppliers" | "Transport" | "Payroll" | "Other";
  amount: number;
  reference?: string;
  status: TxStatus;
};

type State = {
  invoices: Invoice[];
  payments: Payment[];
  reminders: ReminderLog[];
  transactions: Transaction[];
};

type Action =
  | { type: "INVOICE_CREATE"; payload: Invoice }
  | { type: "INVOICE_UPDATE"; payload: Invoice }
  | { type: "INVOICE_SEND"; payload: { invoiceId: string } }
  | { type: "INVOICE_DELETE"; payload: { id: string } } // NEW ACTION ADDED
  | { type: "PAYMENT_ADD"; payload: Payment }
  | { type: "REMINDER_ADD"; payload: ReminderLog }
  | { type: "TX_ADD"; payload: Transaction };

const initial: State = {
  invoices: [
    {
      id: "i1",
      invoiceNo: "INV-1032",
      customerName: "Client X",
      issueDate: "2026-02-10",
      dueDate: "2026-02-18",
      status: "Overdue",
      currency: "TND",
      lines: [
        { id: "il1", label: "Order SO-00021", qty: 1, unitPrice: 3420 },
      ],
      paidAmount: 0,
    },
    {
      id: "i2",
      invoiceNo: "INV-1033",
      customerName: "Client Y",
      issueDate: "2026-02-15",
      dueDate: "2026-02-25",
      status: "Sent",
      currency: "TND",
      lines: [
        { id: "il2", label: "Order SO-00018", qty: 1, unitPrice: 800 },
      ],
      paidAmount: 200,
    },
  ],
  payments: [
    { id: "p1", invoiceId: "i2", date: "2026-02-18", amount: 200, method: "Bank", reference: "TRX-881" },
  ],
  reminders: [
    { id: "r1", invoiceId: "i1", date: "2026-02-19", channel: "Email", note: "First reminder" },
  ],
  transactions: [
    { id: "t1", date: "2026-02-18", type: "Income", category: "Sales", amount: 200, reference: "INV-1033", status: "Posted" },
    { id: "t2", date: "2026-02-16", type: "Expense", category: "Transport", amount: 90, reference: "Delivery costs", status: "Posted" },
  ],
};

function invoiceTotal(inv: Invoice) {
  return invoiceTotals(inv).gross;
}

function invoiceTotals(inv: Invoice) {
  const ht = inv.lines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);
  const taxes = inv.taxes;

  if (!taxes) {
    const net = ht;
    return { ht, gross: ht, net, due: Math.max(0, net - (inv.paidAmount ?? 0)) };
  }

  const fodec = ht * Math.max(0, taxes.fodecRate || 0);
  const tvaBase = ht + fodec;
  const tva = tvaBase * Math.max(0, taxes.tvaRate || 0);
  const timbre = Math.max(0, taxes.timbre || 0);
  const retenue = ht * Math.max(0, taxes.retenueRate || 0);

  const gross = ht + fodec + tva + timbre;
  const net = gross - retenue;
  const due = Math.max(0, net - (inv.paidAmount ?? 0));

  return { ht, gross, net, due };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function computeStatus(inv: Invoice): InvoiceStatus {
  const total = invoiceTotal(inv);
  if (inv.paidAmount >= total && total > 0) return "Paid";
  if (inv.status === "Draft") return "Draft";
  // Sent/Overdue based on due date
  return inv.dueDate < today() ? "Overdue" : "Sent";
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INVOICE_CREATE":
      return { ...state, invoices: [action.payload, ...state.invoices] };

    case "INVOICE_UPDATE":
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };

    case "INVOICE_SEND":
      return {
        ...state,
        invoices: state.invoices.map((i) => {
          if (i.id !== action.payload.invoiceId) return i;
          const updated = { ...i, status: "Sent" as const };
          return { ...updated, status: computeStatus(updated) };
        }),
      };

    // NEW CASE ADDED HERE
    case "INVOICE_DELETE":
      return {
        ...state,
        invoices: state.invoices.filter((i) => i.id !== action.payload.id),
      };

    case "PAYMENT_ADD": {
      const pay = action.payload;

      const invoices = state.invoices.map((i) => {
        if (i.id !== pay.invoiceId) return i;
        const updated = { ...i, paidAmount: i.paidAmount + pay.amount };
        return { ...updated, status: computeStatus(updated) };
      });

      // Auto-create a posted income transaction for the payment (PFE-friendly)
      const inv = state.invoices.find((x) => x.id === pay.invoiceId);
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        date: pay.date,
        type: "Income",
        category: "Sales",
        amount: pay.amount,
        reference: inv?.invoiceNo ?? "Invoice Payment",
        status: "Posted",
      };

      return {
        ...state,
        invoices,
        payments: [pay, ...state.payments],
        transactions: [tx, ...state.transactions],
      };
    }

    case "REMINDER_ADD":
      return { ...state, reminders: [action.payload, ...state.reminders] };

    case "TX_ADD":
      return { ...state, transactions: [action.payload, ...state.transactions] };

    default:
      return state;
  }
}

const FinanceCtx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceCtx);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}

export const financeHelpers = { invoiceTotal, invoiceTotals };