"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

export type OrderStatus =
  | "New"
  | "Confirmed"
  | "Reserved"
  | "Prepared"
  | "Shipped"
  | "Delivered"
  | "Closed";

export type StockState = "Reserved" | "Partial" | "Backorder" | "None";

export type OrderLine = {
  id: string;
  productRef: string;
  productName: string;
  qty: number;
  unitPrice: number;

  availableQty: number;
  reservedQty: number;
  backorderQty: number;
};

export type Order = {
  id: string;
  orderNo: string;
  customerName: string;
  createdAt: string; // YYYY-MM-DD
  promisedDate: string; // SLA
  status: OrderStatus;
  stockState: StockState;
  notes?: string;
  lines: OrderLine[];
};

export type ShipmentStatus = "Prepared" | "Shipped" | "Delivered" | "Delayed";

export type Shipment = {
  id: string;
  shipmentNo: string;
  orderId: string;
  transporter: string;
  trackingNo: string;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
};

export type RmaStatus = "Created" | "Received" | "Inspected" | "Closed";
export type RmaDecision = "Restock" | "Destroy" | "Credit Note";

export type RMA = {
  id: string;
  rmaNo: string;
  orderId: string;
  productRef: string;
  reason: string;
  decision: RmaDecision;
  status: RmaStatus;
  createdAt: string;
};

type State = {
  orders: Order[];
  shipments: Shipment[];
  rmas: RMA[];
};

type Action =
  | { type: "ORDER_CREATE"; payload: Order }
  | { type: "ORDER_UPDATE"; payload: Order }
  | { type: "ORDER_CONFIRM"; payload: { orderId: string } }
  | { type: "ORDER_RESERVE"; payload: { orderId: string } }
  | { type: "ORDER_MARK_PREPARED"; payload: { orderId: string } }
  | { type: "ORDER_MARK_DELIVERED"; payload: { orderId: string } }
  | { type: "ORDER_CLOSE"; payload: { orderId: string } }

  | { type: "SHIPMENT_CREATE"; payload: Shipment }
  | { type: "SHIPMENT_UPDATE_STATUS"; payload: { shipmentId: string; status: ShipmentStatus } }

  | { type: "RMA_CREATE"; payload: RMA }
  | { type: "RMA_UPDATE_STATUS"; payload: { rmaId: string; status: RmaStatus } };

const initial: State = {
  orders: [
    {
      id: "o1",
      orderNo: "SO-00021",
      customerName: "Client X",
      createdAt: "2026-02-20",
      promisedDate: "2026-02-26",
      status: "Confirmed",
      stockState: "Backorder",
      lines: [
        {
          id: "l1",
          productRef: "SKU-002",
          productName: "Product B",
          qty: 10,
          unitPrice: 120,
          availableQty: 3,
          reservedQty: 3,
          backorderQty: 7,
        },
        {
          id: "l2",
          productRef: "SKU-001",
          productName: "Product A",
          qty: 2,
          unitPrice: 220,
          availableQty: 45,
          reservedQty: 2,
          backorderQty: 0,
        },
      ],
      notes: "Urgent delivery",
    },
    {
      id: "o2",
      orderNo: "SO-00018",
      customerName: "Client Y",
      createdAt: "2026-02-19",
      promisedDate: "2026-02-24",
      status: "Reserved",
      stockState: "Reserved",
      lines: [
        {
          id: "l3",
          productRef: "SKU-001",
          productName: "Product A",
          qty: 4,
          unitPrice: 200,
          availableQty: 45,
          reservedQty: 4,
          backorderQty: 0,
        },
      ],
    },
  ],
  shipments: [
    {
      id: "s1",
      shipmentNo: "SHP-0092",
      orderId: "o2",
      transporter: "Carrier A",
      trackingNo: "TRK123456",
      status: "Shipped",
      shippedAt: "2026-02-20",
    },
  ],
  rmas: [
    {
      id: "r1",
      rmaNo: "RMA-0012",
      orderId: "o2",
      productRef: "SKU-001",
      reason: "Damaged",
      decision: "Restock",
      status: "Received",
      createdAt: "2026-02-20",
    },
  ],
};

function calcStockState(lines: OrderLine[]): StockState {
  const total = lines.reduce((a, l) => a + l.qty, 0);
  const reserved = lines.reduce((a, l) => a + l.reservedQty, 0);
  const back = lines.reduce((a, l) => a + l.backorderQty, 0);
  if (total === 0) return "None";
  if (back === total) return "Backorder";
  if (back > 0) return "Partial";
  if (reserved === total) return "Reserved";
  return "None";
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ORDER_CREATE":
      return { ...state, orders: [action.payload, ...state.orders] };

    case "ORDER_UPDATE":
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.payload.id ? action.payload : o)),
      };

    case "ORDER_CONFIRM": {
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId ? { ...o, status: "Confirmed" } : o
        ),
      };
    }

    case "ORDER_RESERVE": {
      // UI simulation: after reserve, set status Reserved and compute stockState already in lines
      return {
        ...state,
        orders: state.orders.map((o) => {
          if (o.id !== action.payload.orderId) return o;
          const stockState = calcStockState(o.lines);
          return { ...o, status: "Reserved", stockState };
        }),
      };
    }

    case "ORDER_MARK_PREPARED":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId ? { ...o, status: "Prepared" } : o
        ),
      };

    case "ORDER_MARK_DELIVERED":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId ? { ...o, status: "Delivered" } : o
        ),
      };

    case "ORDER_CLOSE":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.orderId ? { ...o, status: "Closed" } : o
        ),
      };

    case "SHIPMENT_CREATE":
      return { ...state, shipments: [action.payload, ...state.shipments] };

    case "SHIPMENT_UPDATE_STATUS":
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.id === action.payload.shipmentId ? { ...s, status: action.payload.status } : s
        ),
      };

    case "RMA_CREATE":
      return { ...state, rmas: [action.payload, ...state.rmas] };

    case "RMA_UPDATE_STATUS":
      return {
        ...state,
        rmas: state.rmas.map((r) =>
          r.id === action.payload.rmaId ? { ...r, status: action.payload.status } : r
        ),
      };

    default:
      return state;
  }
}

const SalesCtx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <SalesCtx.Provider value={value}>{children}</SalesCtx.Provider>;
}

export function useSales() {
  const ctx = useContext(SalesCtx);
  if (!ctx) throw new Error("useSales must be used inside SalesProvider");
  return ctx;
}
