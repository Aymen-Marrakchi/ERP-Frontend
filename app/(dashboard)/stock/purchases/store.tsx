"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import { poTotals, type GoodsReceipt, type PurchaseOrder, type PurchaseRequest, type Supplier, type SupplierInvoice, type SupplierInvoiceStatus } from "../store";

type PurchasesState = {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  requests: PurchaseRequest[];
  invoices: SupplierInvoice[];
};

type Action =
  | { type: "SUPPLIER_ADD"; payload: Supplier }
  | { type: "SUPPLIER_UPDATE"; payload: Supplier }
  | { type: "SUPPLIER_TOGGLE_BLOCK"; payload: { supplierId: string } }
  | { type: "REQUEST_ADD"; payload: PurchaseRequest }
  | { type: "REQUEST_UPDATE_STATUS"; payload: { id: string; status: "Draft" | "Submitted" | "Approved" | "Rejected"; reason?: string } }
  | { type: "PO_CREATE"; payload: PurchaseOrder }
  | { type: "PO_UPDATE"; payload: PurchaseOrder }
  | { type: "PO_SET_STATUS"; payload: { poId: string; status: PurchaseOrder["status"] } }
  | { type: "GR_CREATE"; payload: GoodsReceipt }
  | { type: "GR_VALIDATE"; payload: { grId: string } }
  | { type: "SINV_CREATE"; payload: SupplierInvoice }
  | { type: "SINV_SET_STATUS"; payload: { invId: string; status: SupplierInvoiceStatus; rejectionReason?: string } }
  | { type: "SINV_ADD_PAYMENT"; payload: { invId: string; amount: number } };

const initial: PurchasesState = {
  suppliers: [
    {
      id: "s1",
      name: "Tech Solutions S.A.",
      category: "Hardware",
      contactName: "Sami Ben Ali",
      phone: "71 123 456",
      email: "contact@techsol.tn",
      address: "Charguia 1",
      rib: "00000000000000000000",
      taxId: "1234567/A/A/M/000",
      paymentTerms: "30 days",
      rating: 5,
      status: "Active",
    },
  ],
  orders: [
    {
      id: "po1",
      poNo: "PO-2026-001",
      supplierId: "s1",
      status: "Sent",
      createdAt: "2026-02-20",
      expectedDelivery: "2026-02-28",
      paymentTerms: "30 days",
      deliveryTerms: "Warehouse",
      currency: "TND",
      lines: [{ id: "l1", item: "Laptop Dell", qty: 5, unit: "pcs", unitPriceHT: 2500, taxRate: 0.19, discount: 0 }],
    },
  ],
  receipts: [],
  requests: [],
  invoices: [],
};

function reducer(state: PurchasesState, action: Action): PurchasesState {
  switch (action.type) {
    case "SUPPLIER_ADD":
      return { ...state, suppliers: [action.payload, ...state.suppliers] };
    case "SUPPLIER_UPDATE":
      return { ...state, suppliers: state.suppliers.map((s) => (s.id === action.payload.id ? action.payload : s)) };
    case "SUPPLIER_TOGGLE_BLOCK":
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === action.payload.supplierId
            ? { ...s, status: s.status === "Blacklisted" ? "Active" : "Blacklisted" }
            : s
        ),
      };
    case "REQUEST_ADD":
      return { ...state, requests: [action.payload, ...state.requests] };
    case "REQUEST_UPDATE_STATUS":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.payload.id
            ? { ...r, status: action.payload.status, rejectionReason: action.payload.reason }
            : r
        ),
      };
    case "PO_CREATE":
      return { ...state, orders: [action.payload, ...state.orders] };
    case "PO_UPDATE":
      return { ...state, orders: state.orders.map((o) => (o.id === action.payload.id ? action.payload : o)) };
    case "PO_SET_STATUS":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.poId ? { ...o, status: action.payload.status } : o
        ),
      };
    case "GR_CREATE": {
      const gr = action.payload;
      const orders = state.orders.map((o) =>
        o.id === gr.poId ? { ...o, status: "Partially Received" as PurchaseOrder["status"] } : o
      );
      return { ...state, orders, receipts: [gr, ...state.receipts] };
    }
    case "GR_VALIDATE": {
      const gr = state.receipts.find((x) => x.id === action.payload.grId);
      if (!gr) return state;
      const receipts = state.receipts.map((x) =>
        x.id === gr.id ? { ...x, status: "Validated" as GoodsReceipt["status"] } : x
      );
      const po = state.orders.find((o) => o.id === gr.poId);
      let orders = state.orders;
      if (po) {
        const receivedMap: Record<string, number> = {};
        receipts
          .filter((r) => r.poId === po.id && r.status === "Validated")
          .forEach((r) =>
            r.lines.forEach((l) => {
              receivedMap[l.poLineId] = (receivedMap[l.poLineId] || 0) + l.receivedQty;
            })
          );
        const fullyReceived = po.lines.every((l) => (receivedMap[l.id] || 0) >= l.qty);
        orders = state.orders.map((o) =>
          o.id === po.id ? { ...o, status: fullyReceived ? "Received" : "Partially Received" } : o
        );
      }
      return { ...state, receipts, orders };
    }
    case "SINV_CREATE":
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case "SINV_SET_STATUS":
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload.invId
            ? {
                ...inv,
                status: action.payload.status,
                rejectionReason: action.payload.status === "Rejected" ? action.payload.rejectionReason : undefined,
              }
            : inv
        ),
      };
    case "SINV_ADD_PAYMENT":
      return {
        ...state,
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload.invId ? { ...inv, totalPaid: Math.max(0, inv.totalPaid + action.payload.amount) } : inv
        ),
      };
    default:
      return state;
  }
}

const PurchasesCtx = createContext<{ state: PurchasesState; dispatch: React.Dispatch<Action> } | null>(null);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <PurchasesCtx.Provider value={value}>{children}</PurchasesCtx.Provider>;
}

export function usePurchases() {
  const ctx = useContext(PurchasesCtx);
  if (!ctx) throw new Error("usePurchases must be used inside PurchasesProvider");
  return ctx;
}

export function supplierInvoiceTotals(inv: SupplierInvoice) {
  const ht = inv.lines.reduce((a, l) => a + l.qty * l.unitPriceHT, 0);
  const tva = inv.lines.reduce((a, l) => a + l.qty * l.unitPriceHT * l.taxRate, 0);
  const ttc = ht + tva;
  return { ht, tva, ttc };
}

type MatchLine = {
  item: string;
  poQty: number;
  receivedQty: number;
  invoicedQty: number;
  status: "OK" | "Mismatch";
};

type MatchResult = {
  status: "OK" | "Missing PO" | "Missing Receipt" | "Mismatch";
  lines: MatchLine[];
};

export function threeWayMatch(args: {
  po?: PurchaseOrder;
  receipts: GoodsReceipt[];
  inv: SupplierInvoice;
}): MatchResult {
  const { po, receipts, inv } = args;

  const poQtyByItem: Record<string, number> = {};
  const recQtyByItem: Record<string, number> = {};
  const invQtyByItem: Record<string, number> = {};

  if (po) {
    po.lines.forEach((l) => {
      poQtyByItem[l.item] = (poQtyByItem[l.item] ?? 0) + l.qty;
    });
  }

  receipts.forEach((r) => {
    r.lines.forEach((l) => {
      recQtyByItem[l.item] = (recQtyByItem[l.item] ?? 0) + l.receivedQty;
    });
  });

  inv.lines.forEach((l) => {
    invQtyByItem[l.item] = (invQtyByItem[l.item] ?? 0) + l.qty;
  });

  const items = Array.from(new Set([...Object.keys(poQtyByItem), ...Object.keys(recQtyByItem), ...Object.keys(invQtyByItem)]));

  const lines: MatchLine[] = items.map((item) => {
    const poQty = poQtyByItem[item] ?? 0;
    const receivedQty = recQtyByItem[item] ?? 0;
    const invoicedQty = invQtyByItem[item] ?? 0;

    const poOk = !po || invoicedQty <= poQty;
    const recOk = receipts.length === 0 || invoicedQty <= receivedQty;

    return {
      item,
      poQty,
      receivedQty,
      invoicedQty,
      status: poOk && recOk ? "OK" : "Mismatch",
    };
  });

  if (!po) return { status: "Missing PO", lines };
  if (receipts.length === 0) return { status: "Missing Receipt", lines };

  const allOk = lines.every((l) => l.status === "OK");
  return { status: allOk ? "OK" : "Mismatch", lines };
}

export { poTotals };
export type {
  Supplier,
  SupplierCategory,
  SupplierStatus,
  PurchaseOrder,
  PurchaseOrderStatus,
  GoodsReceipt,
  ReceiptStatus,
  PurchaseRequest,
  PurchaseRequestStatus,
  PurchasePriority,
  SupplierInvoice,
  SupplierInvoiceStatus,
} from "../store";
