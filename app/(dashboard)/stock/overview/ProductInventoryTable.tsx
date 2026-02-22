"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import type { InventoryRow } from "./mock";

function statusBadge(status: InventoryRow["status"]) {
  if (status === "In Stock") return <Badge variant="success">In Stock</Badge>;
  if (status === "Low Stock") return <Badge variant="warning">Low Stock</Badge>;
  return <Badge variant="danger">Out of Stock</Badge>;
}

function trendIcon(trend: InventoryRow["trend"]) {
  if (trend === "up") return <span className="text-emerald-500">↑</span>;
  if (trend === "down") return <span className="text-rose-500">↓</span>;
  return <span className="text-slate-400">—</span>;
}

export function ProductInventoryTable({ rows }: { rows: InventoryRow[] }) {
  return (
    <Card>
      <CardHeader
        title="Product Inventory"
        subtitle={`Showing ${Math.min(8, rows.length)} of ${rows.length} products`}
      />
      <CardBody>
        <Table headers={["Product", "Category", "In Stock", "Level", "Status", "Trend"]}>
          {rows.slice(0, 8).map((r) => (
            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3">
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{r.sku}</div>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.category}</td>
              <td className="px-4 py-3 font-semibold">{r.inStock.toLocaleString()}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(0, Math.min(100, r.level))}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{r.level}%</div>
                </div>
              </td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
              <td className="px-4 py-3">{trendIcon(r.trend)}</td>
            </tr>
          ))}
        </Table>
      </CardBody>
    </Card>
  );
}