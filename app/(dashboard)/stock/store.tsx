"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

// --- PRODUCT & INVENTORY TYPES ---
export type Product = {
  id: string;
  reference: string;
  name: string;
  category: string;
  qty: number;
  min: number;
  unit?: string;
};

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";
export type Movement = {
  id: string;
  date: string;
  type: MovementType;
  productId: string;
  qty: number;
  source: "Purchase" | "Sale" | "Inventory" | "Manual";
  refDoc?: string;
};

export type InventoryLine = {
  productId: string;
  expected: number;
  counted: number;
  note?: string;
};

export type InventorySession = {
  id: string;
  date: string;
  scope: "All Products" | "Category";
  category?: string;
  status: "Draft" | "In Progress" | "Validated";
  lines: InventoryLine[];
};

// --- PURCHASE TYPES ---
export type SupplierCategory = "Hardware" | "Transport" | "Services" | "Raw Materials" | "Packaging" | "Other";
export type SupplierStatus = "Active" | "Blacklisted" | "Pending";

export type Supplier = {
  id: string;
  name: string;
  category: SupplierCategory;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  rib: string;
  taxId?: string;
  paymentTerms: "Cash" | "30 days" | "60 days" | "90 days";
  rating: number;
  status: SupplierStatus;
  notes?: string;
};

export type PurchasePriority = "Low" | "Normal" | "Urgent";
export type PurchaseRequestStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
export type PurchaseRequestLine = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  estUnitPrice: number;
};
export type PurchaseRequest = {
  id: string;
  daNo: string;
  department: "Stock" | "Maintenance" | "Production" | "Admin";
  priority: PurchasePriority;
  status: PurchaseRequestStatus;
  createdAt: string;
  neededDate: string;
  budgetCode?: string;
  rejectionReason?: string;
  lines: PurchaseRequestLine[];
};

export type PurchaseOrderStatus = "Draft" | "Validated" | "Sent" | "Partially Received" | "Received" | "Closed";
export type PurchaseOrderLine = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  unitPriceHT: number;
  taxRate: number;
  discount: number;
};
export type PurchaseOrder = {
  id: string;
  poNo: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  expectedDelivery: string;
  paymentTerms: string;
  deliveryTerms: string;
  currency: "TND" | "EUR" | "USD";
  lines: PurchaseOrderLine[];
  notes?: string;
};

export type ReceiptStatus = "Draft" | "Validated";
export type ReceiptLine = {
  id: string;
  poLineId: string;
  item: string;
  orderedQty: number;
  receivedQty: number;
  quality: "Accepted" | "Rejected";
  note?: string;
};
export type GoodsReceipt = {
  id: string;
  grNo: string;
  poId: string;
  supplierId: string;
  status: ReceiptStatus;
  date: string;
  lines: ReceiptLine[];
  disputeNote?: string;
};

// --- INVOICE TYPES ---
export type SupplierInvoiceStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Posted";
export type SupplierInvoiceLine = {
  id: string;
  poLineId?: string;
  item: string;
  qty: number;
  unitPriceHT: number;
  taxRate: number;
};
export type SupplierInvoice = {
  id: string;
  invNo: string;
  supplierId: string;
  poId?: string;
  receiptIds: string[];
  issueDate: string;
  dueDate: string;
  status: SupplierInvoiceStatus;
  notes?: string;
  currency: "TND" | "EUR" | "USD";
  lines: SupplierInvoiceLine[];
  totalPaid: number;
  rejectionReason?: string;
};

// --- STATE & ACTIONS ---
type State = {
  products: Product[];
  movements: Movement[];
  inventories: InventorySession[];
  suppliers: Supplier[];
  requests: PurchaseRequest[]; // Added Requests
  orders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  invoices: SupplierInvoice[]; // Added Invoices
};

type Action =
  // Product & Inventory
  | { type: "PRODUCT_ADD"; payload: Product }
  | { type: "PRODUCT_UPDATE"; payload: Product }
  | { type: "MOVEMENT_ADD"; payload: Movement }
  | { type: "INVENTORY_CREATE"; payload: InventorySession }
  | { type: "INVENTORY_UPDATE_LINE"; payload: { sessionId: string; productId: string; counted: number; note?: string } }
  | { type: "INVENTORY_VALIDATE"; payload: { sessionId: string } }
  // Suppliers
  | { type: "SUPPLIER_ADD"; payload: Supplier }
  | { type: "SUPPLIER_UPDATE"; payload: Supplier }
  | { type: "SUPPLIER_DELETE"; payload: { id: string } }
  | { type: "SUPPLIER_TOGGLE_BLOCK"; payload: { supplierId: string } }
  // Requests
  | { type: "REQUEST_ADD"; payload: PurchaseRequest }
  | { type: "REQUEST_UPDATE_STATUS"; payload: { id: string; status: PurchaseRequestStatus; reason?: string } }
  // Orders
  | { type: "PO_CREATE"; payload: PurchaseOrder }
  | { type: "PO_UPDATE"; payload: PurchaseOrder }
  | { type: "PO_SET_STATUS"; payload: { poId: string; status: PurchaseOrderStatus } }
  // Receipts
  | { type: "GR_CREATE"; payload: GoodsReceipt }
  | { type: "GR_VALIDATE"; payload: { grId: string } }
  // Invoices
  | { type: "SINV_CREATE"; payload: SupplierInvoice }
  | { type: "SINV_UPDATE"; payload: SupplierInvoice }
  | { type: "SINV_SET_STATUS"; payload: { invId: string; status: SupplierInvoiceStatus; rejectionReason?: string } }
  | { type: "SINV_ADD_PAYMENT"; payload: { invId: string; amount: number } };

const initial: State = {
  products: [
    { id: "p1", reference: "SKU-001", name: "Product A", category: "Finished Goods", qty: 45, min: 10, unit: "pcs" },
  ],
  movements: [],
  inventories: [],
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
  requests: [],
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
      lines: [
        { id: "l1", item: "Laptop Dell", qty: 5, unit: "pcs", unitPriceHT: 2500, taxRate: 0.19, discount: 0 },
      ],
    },
  ],
  receipts: [],
  invoices: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    // --- PRODUCT LOGIC ---
    case "PRODUCT_ADD": return { ...state, products: [...state.products, action.payload] };
    case "PRODUCT_UPDATE": return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
    case "MOVEMENT_ADD": {
      const mv = action.payload;
      const products = state.products.map(p => {
        if (p.id !== mv.productId) return p;
        let nextQty = p.qty;
        if (mv.type === "IN") nextQty = p.qty + mv.qty;
        if (mv.type === "OUT") nextQty = Math.max(0, p.qty - mv.qty);
        if (mv.type === "ADJUSTMENT") nextQty = p.qty + mv.qty;
        return { ...p, qty: nextQty };
      });
      return { ...state, products, movements: [mv, ...state.movements] };
    }
    
    // --- INVENTORY LOGIC ---
    case "INVENTORY_CREATE": return { ...state, inventories: [action.payload, ...state.inventories] };
    case "INVENTORY_UPDATE_LINE": {
      const { sessionId, productId, counted, note } = action.payload;
      return {
        ...state,
        inventories: state.inventories.map(inv => inv.id === sessionId ? { ...inv, lines: inv.lines.map(l => l.productId === productId ? { ...l, counted, note } : l) } : inv)
      };
    }
    case "INVENTORY_VALIDATE": {
      const { sessionId } = action.payload;
      const inv = state.inventories.find(x => x.id === sessionId);
      if (!inv) return state;
      let nextState = { ...state };
      const diffs = inv.lines.map(l => ({ ...l, diff: l.counted - l.expected })).filter(x => x.diff !== 0);
      for (const d of diffs) {
        const mv: Movement = {
          id: `adj-${Date.now()}-${d.productId}`, date: inv.date, type: "ADJUSTMENT", productId: d.productId, qty: d.diff, source: "Inventory", refDoc: inv.id
        };
        nextState = reducer(nextState, { type: "MOVEMENT_ADD", payload: mv });
      }
      return { ...nextState, inventories: nextState.inventories.map(x => x.id === sessionId ? { ...x, status: "Validated" } : x) };
    }

    // --- SUPPLIER LOGIC ---
    case "SUPPLIER_ADD": return { ...state, suppliers: [action.payload, ...state.suppliers] };
    case "SUPPLIER_UPDATE": return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case "SUPPLIER_DELETE": return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload.id) };
    case "SUPPLIER_TOGGLE_BLOCK": return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.supplierId ? { ...s, status: s.status === "Blacklisted" ? "Active" : "Blacklisted" as SupplierStatus } : s) };

    // --- REQUEST LOGIC ---
    case "REQUEST_ADD": return { ...state, requests: [action.payload, ...state.requests] };
    case "REQUEST_UPDATE_STATUS": return { ...state, requests: state.requests.map(r => r.id === action.payload.id ? { ...r, status: action.payload.status, rejectionReason: action.payload.reason } : r) };

    // --- PURCHASE ORDER LOGIC ---
    case "PO_CREATE": return { ...state, orders: [action.payload, ...state.orders] };
    case "PO_UPDATE": return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o) };
    case "PO_SET_STATUS": return { ...state, orders: state.orders.map(o => o.id === action.payload.poId ? { ...o, status: action.payload.status } : o) };

    // --- GOODS RECEIPT LOGIC ---
    case "GR_CREATE": {
      const gr = action.payload;
      const orders = state.orders.map(o => o.id === gr.poId ? { ...o, status: "Partially Received" as PurchaseOrderStatus } : o);
      return { ...state, orders, receipts: [gr, ...state.receipts] };
    }
    case "GR_VALIDATE": {
      const gr = state.receipts.find(x => x.id === action.payload.grId);
      if (!gr) return state;
      const receipts = state.receipts.map(x => x.id === gr.id ? { ...x, status: "Validated" as ReceiptStatus } : x);
      const po = state.orders.find(o => o.id === gr.poId);
      let orders = state.orders;
      if (po) {
        const receivedMap: Record<string, number> = {};
        receipts.filter(r => r.poId === po.id && r.status === "Validated").forEach(r => r.lines.forEach(l => receivedMap[l.poLineId] = (receivedMap[l.poLineId] || 0) + l.receivedQty));
        const fullyReceived = po.lines.every(l => (receivedMap[l.id] || 0) >= l.qty);
        const nextStatus = fullyReceived ? "Received" : "Partially Received";
        orders = state.orders.map(o => o.id === po.id ? { ...o, status: nextStatus as PurchaseOrderStatus } : o);
      }
      return { ...state, receipts, orders };
    }

    // --- INVOICE LOGIC ---
    case "SINV_CREATE": return { ...state, invoices: [action.payload, ...state.invoices] };
    case "SINV_UPDATE": return { ...state, invoices: state.invoices.map(i => i.id === action.payload.id ? action.payload : i) };
    case "SINV_SET_STATUS": return { ...state, invoices: state.invoices.map(i => i.id === action.payload.invId ? { ...i, status: action.payload.status, rejectionReason: action.payload.rejectionReason } : i) };
    case "SINV_ADD_PAYMENT": return { ...state, invoices: state.invoices.map(i => i.id === action.payload.invId ? { ...i, totalPaid: i.totalPaid + action.payload.amount } : i) };

    default: return state;
  }
}

const StockCtx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StockCtx.Provider value={value}>{children}</StockCtx.Provider>;
}

export function useStock() {
  const ctx = useContext(StockCtx);
  if (!ctx) throw new Error("useStock must be used inside StockProvider");
  return ctx;
}

// --- HELPERS ---
export function poTotals(po: PurchaseOrder) {
  const ht = po.lines.reduce((a, l) => a + l.qty * l.unitPriceHT * (1 - l.discount), 0);
  const tva = po.lines.reduce((a, l) => a + l.qty * l.unitPriceHT * (1 - l.discount) * l.taxRate, 0);
  const ttc = ht + tva;
  return { ht, tva, ttc };
}