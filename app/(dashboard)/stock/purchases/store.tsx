"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import type {
  Supplier,
  PurchaseOrder,
  GoodsReceipt,
  PurchaseRequest,
  PurchaseOrderStatus,
} from "./purchase-types";
import type { SupplierInvoice, ThreeWayMatchResult } from "./types";

type State = {
  suppliers: Supplier[];
  requests: PurchaseRequest[];
  orders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  invoices: import("./types").SupplierInvoice[];
};

type Action =
  | { type: "SUPPLIER_ADD"; payload: Supplier }
  | { type: "SUPPLIER_UPDATE"; payload: Supplier }
  | { type: "SUPPLIER_TOGGLE_BLOCK"; payload: { supplierId: string } }

  | { type: "PO_CREATE"; payload: PurchaseOrder }
  | { type: "PO_UPDATE"; payload: PurchaseOrder }
  | { type: "PO_SET_STATUS"; payload: { poId: string; status: PurchaseOrderStatus } }

  | { type: "GR_CREATE"; payload: GoodsReceipt }
  | { type: "GR_VALIDATE"; payload: { grId: string } }

  | { type: "SINV_CREATE"; payload: import("./types").SupplierInvoice }
  | { type: "SINV_UPDATE"; payload: import("./types").SupplierInvoice }
  | {
      type: "SINV_SET_STATUS";
      payload: { invId: string; status: import("./types").SupplierInvoiceStatus; rejectionReason?: string };
    }
  | { type: "SINV_ADD_PAYMENT"; payload: { invId: string; amount: number } };

const initial: State = {
  suppliers: [
    {
      id: "sup1",
      name: "Supplier A",
      category: "Hardware",
      contactName: "Ahmed",
      phone: "+216 00 000 000",
      email: "supplierA@mail.com",
      address: "Sfax, Tunisia",
      rib: "TN59 0000 0000 0000 0000 0000",
      paymentTerms: "30 days",
      rating: 4,
      status: "Active",
    },
    {
      id: "sup2",
      name: "Supplier B",
      category: "Transport",
      contactName: "Sami",
      phone: "+216 00 000 001",
      email: "supplierB@mail.com",
      address: "Tunis, Tunisia",
      rib: "TN59 1111 1111 1111 1111 1111",
      paymentTerms: "Cash",
      rating: 3,
      status: "Blocked",
      notes: "Repeated delays",
    },
  ],
  requests: [],
  orders: [
    {
      id: "po1",
      poNo: "PO-0102",
      supplierId: "sup1",
      status: "Sent",
      createdAt: "2026-02-18",
      expectedDelivery: "2026-02-24",
      paymentTerms: "30 days",
      deliveryTerms: "Delivery to warehouse",
      currency: "TND",
      lines: [
        { id: "pol1", item: "Product A", qty: 20, unit: "pcs", unitPriceHT: 50, taxRate: 0.19, discount: 0 },
        { id: "pol2", item: "Product B", qty: 10, unit: "pcs", unitPriceHT: 120, taxRate: 0.19, discount: 0.05 },
      ],
    },
  ],
  receipts: [
    {
      id: "gr1",
      grNo: "GR-0048",
      poId: "po1",
      supplierId: "sup1",
      status: "Validated",
      date: "2026-02-20",
      lines: [
        { id: "grl1", poLineId: "pol1", item: "Product A", orderedQty: 20, receivedQty: 20, quality: "Accepted" },
        { id: "grl2", poLineId: "pol2", item: "Product B", orderedQty: 10, receivedQty: 6, quality: "Accepted", note: "Partial delivery" },
      ],
      disputeNote: "Missing 4 pcs of Product B",
    },
  ],
  invoices: [
    {
      id: "sinv1",
      invNo: "SINV-0201",
      supplierId: "sup1",
      poId: "po1",
      receiptIds: ["gr1"],
      issueDate: "2026-02-20",
      dueDate: "2026-03-22",
      status: "Submitted",
      currency: "TND",
      lines: [
        { id: "sinvl1", poLineId: "pol1", item: "Product A", qty: 20, unitPriceHT: 50, taxRate: 0.19 },
        { id: "sinvl2", poLineId: "pol2", item: "Product B", qty: 6, unitPriceHT: 120, taxRate: 0.19 },
      ],
      totalPaid: 0,
      notes: "Invoice based on partial delivery",
    },
  ],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SUPPLIER_ADD":
      return { ...state, suppliers: [action.payload, ...state.suppliers] };

    case "SUPPLIER_UPDATE":
      return {
        ...state,
        suppliers: state.suppliers.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };

    case "SUPPLIER_TOGGLE_BLOCK":
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === action.payload.supplierId ? { ...s, status: s.status === "Active" ? "Blocked" : "Active" } : s
        ),
      };

    case "PO_CREATE":
      return { ...state, orders: [action.payload, ...state.orders] };

    case "PO_UPDATE":
      return { ...state, orders: state.orders.map((o) => (o.id === action.payload.id ? action.payload : o)) };

    case "PO_SET_STATUS":
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.payload.poId ? { ...o, status: action.payload.status } : o)),
      };

    case "GR_CREATE": {
      // If receipt is created, mark PO as partially received (until validated / full check)
      const gr = action.payload;
      const orders: PurchaseOrder[] = state.orders.map((o) =>
        o.id === gr.poId ? { ...o, status: "Partially Received" } : o
      );
      return { ...state, orders, receipts: [gr, ...state.receipts] };
    }

    case "GR_VALIDATE": {
      const gr = state.receipts.find((x) => x.id === action.payload.grId);
      if (!gr) return state;

      const receipts: GoodsReceipt[] = state.receipts.map((x) =>
        x.id === gr.id ? { ...x, status: "Validated" } : x
      );

      // If all PO lines are fully received, mark PO as Received
      const po = state.orders.find((o) => o.id === gr.poId);
      if (!po) return { ...state, receipts };

      const receivedMap: Record<string, number> = {};
      receipts
        .filter((r) => r.poId === po.id && r.status === "Validated")
        .forEach((r) =>
          r.lines.forEach((l) => {
            receivedMap[l.poLineId] = (receivedMap[l.poLineId] ?? 0) + l.receivedQty;
          })
        );

      const fullyReceived = po.lines.every((l) => (receivedMap[l.id] ?? 0) >= l.qty);
      const nextStatus: PurchaseOrderStatus = fullyReceived ? "Received" : "Partially Received";

      const orders = state.orders.map((o) => (o.id === po.id ? { ...o, status: nextStatus } : o));
      return { ...state, receipts, orders };
    }

    case "SINV_CREATE":
      return { ...state, invoices: [action.payload, ...state.invoices] };

    case "SINV_UPDATE":
      return {
        ...state,
        invoices: state.invoices.map((x) => (x.id === action.payload.id ? action.payload : x)),
      };

    case "SINV_SET_STATUS":
      return {
        ...state,
        invoices: state.invoices.map((x) =>
          x.id === action.payload.invId
            ? {
                ...x,
                status: action.payload.status,
                rejectionReason:
                  action.payload.status === "Rejected" ? action.payload.rejectionReason ?? "Rejected" : undefined,
              }
            : x
        ),
      };

    case "SINV_ADD_PAYMENT":
      return {
        ...state,
        invoices: state.invoices.map((x) =>
          x.id === action.payload.invId ? { ...x, totalPaid: x.totalPaid + action.payload.amount } : x
        ),
      };

    default:
      return state;
  }
}

const PurchCtx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <PurchCtx.Provider value={value}>{children}</PurchCtx.Provider>;
}

export function usePurchases() {
  const ctx = useContext(PurchCtx);
  if (!ctx) throw new Error("usePurchases must be used inside PurchasesProvider");
  return ctx;
}

export function poTotals(po: PurchaseOrder) {
  const ht = po.lines.reduce((a, l) => a + l.qty * l.unitPriceHT * (1 - l.discount), 0);
  const tva = po.lines.reduce((a, l) => a + l.qty * l.unitPriceHT * (1 - l.discount) * l.taxRate, 0);
  const ttc = ht + tva;
  return { ht, tva, ttc };
}

export function supplierInvoiceTotals(inv: SupplierInvoice) {
  const ht = inv.lines.reduce((a, l) => a + l.qty * l.unitPriceHT, 0);
  const tva = inv.lines.reduce((a, l) => a + l.qty * l.unitPriceHT * l.taxRate, 0);
  return { ht, tva, ttc: ht + tva };
}

export function threeWayMatch(args: {
  po?: PurchaseOrder;
  receipts: GoodsReceipt[];
  inv: SupplierInvoice;
}): ThreeWayMatchResult {
  const { po, receipts, inv } = args;

  if (!po) return { status: "Missing PO", lines: [] };
  if (!receipts.length) return { status: "Missing Receipt", lines: [] };

  const poMap: Record<string, { item: string; qty: number }> = {};
  po.lines.forEach((l) => (poMap[l.id] = { item: l.item, qty: l.qty }));

  const receivedMap: Record<string, number> = {};
  receipts
    .filter((r) => r.status === "Validated")
    .forEach((r) =>
      r.lines.forEach((l) => {
        receivedMap[l.poLineId] = (receivedMap[l.poLineId] ?? 0) + l.receivedQty;
      })
    );

  const invMap: Record<string, number> = {};
  inv.lines.forEach((l) => {
    const key = l.poLineId ?? l.item;
    invMap[key] = (invMap[key] ?? 0) + l.qty;
  });

  const lines = po.lines.map((l) => {
    const poQty = l.qty;
    const recQty = receivedMap[l.id] ?? 0;
    const invQty = invMap[l.id] ?? 0;
    const status: "OK" | "Mismatch" = poQty >= invQty && recQty >= invQty ? "OK" : "Mismatch";
    return { item: l.item, poQty, receivedQty: recQty, invoicedQty: invQty, status };
  });

  const hasMismatch = lines.some((x) => x.status === "Mismatch");
  return { status: hasMismatch ? "Mismatch" : "OK", lines };
}

