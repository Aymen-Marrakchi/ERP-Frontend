"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

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
  date: string; // YYYY-MM-DD
  type: MovementType;
  productId: string;
  qty: number; // positive number
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

type State = {
  products: Product[];
  movements: Movement[];
  inventories: InventorySession[];
};

type Action =
  | { type: "PRODUCT_ADD"; payload: Product }
  | { type: "PRODUCT_UPDATE"; payload: Product }
  | { type: "MOVEMENT_ADD"; payload: Movement }
  | { type: "INVENTORY_CREATE"; payload: InventorySession }
  | { type: "INVENTORY_UPDATE_LINE"; payload: { sessionId: string; productId: string; counted: number; note?: string } }
  | { type: "INVENTORY_VALIDATE"; payload: { sessionId: string } };

const initial: State = {
  products: [
    { id: "p1", reference: "SKU-001", name: "Product A", category: "Finished Goods", qty: 45, min: 10, unit: "pcs" },
    { id: "p2", reference: "SKU-002", name: "Product B", category: "Finished Goods", qty: 3, min: 10, unit: "pcs" },
    { id: "p3", reference: "SKU-003", name: "Product C", category: "Consumables", qty: 0, min: 5, unit: "pcs" },
  ],
  movements: [
    { id: "m1", date: "2026-02-20", type: "IN", productId: "p1", qty: 50, source: "Purchase", refDoc: "PO-101" },
    { id: "m2", date: "2026-02-20", type: "OUT", productId: "p2", qty: 10, source: "Sale", refDoc: "SO-00018" },
  ],
  inventories: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PRODUCT_ADD":
      return { ...state, products: [...state.products, action.payload] };

    case "PRODUCT_UPDATE":
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };

    case "MOVEMENT_ADD": {
      const mv = action.payload;
      const products = state.products.map((p) => {
        if (p.id !== mv.productId) return p;

        let nextQty = p.qty;
        if (mv.type === "IN") nextQty = p.qty + mv.qty;
        if (mv.type === "OUT") nextQty = Math.max(0, p.qty - mv.qty);
        if (mv.type === "ADJUSTMENT") nextQty = p.qty + mv.qty; // adjustment can be + or -
        return { ...p, qty: nextQty };
      });

      return { ...state, products, movements: [mv, ...state.movements] };
    }

    case "INVENTORY_CREATE":
      return { ...state, inventories: [action.payload, ...state.inventories] };

    case "INVENTORY_UPDATE_LINE": {
      const { sessionId, productId, counted, note } = action.payload;
      return {
        ...state,
        inventories: state.inventories.map((inv) => {
          if (inv.id !== sessionId) return inv;
          return {
            ...inv,
            lines: inv.lines.map((l) =>
              l.productId === productId ? { ...l, counted, note } : l
            ),
          };
        }),
      };
    }

    case "INVENTORY_VALIDATE": {
      const { sessionId } = action.payload;
      const inv = state.inventories.find((x) => x.id === sessionId);
      if (!inv) return state;

      // Generate adjustment movements for differences
      const diffs = inv.lines
        .map((l) => ({ ...l, diff: l.counted - l.expected }))
        .filter((x) => x.diff !== 0);

      let nextState = { ...state };

      for (const d of diffs) {
        const mv: Movement = {
          id: `adj-${Date.now()}-${d.productId}`,
          date: inv.date,
          type: "ADJUSTMENT",
          productId: d.productId,
          qty: d.diff, // can be negative here
          source: "Inventory",
          refDoc: inv.id,
        };
        // apply adjustment (reuse MOVEMENT_ADD logic by dispatching in place)
        nextState = reducer(nextState, { type: "MOVEMENT_ADD", payload: mv });
      }

      nextState = {
        ...nextState,
        inventories: nextState.inventories.map((x) =>
          x.id === sessionId ? { ...x, status: "Validated" } : x
        ),
      };

      return nextState;
    }

    default:
      return state;
  }
}

const StockCtx = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

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
