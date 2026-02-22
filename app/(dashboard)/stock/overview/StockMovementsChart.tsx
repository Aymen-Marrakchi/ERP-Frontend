"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { MovementDay } from "./mock";

export function StockMovementsChart({ data }: { data: MovementDay[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.inQty, d.outQty)), 1);

  return (
    <Card>
      <CardHeader title="Stock Movements" subtitle="Units in vs out — Last 7 days" />
      <CardBody>
        <div className="flex items-end justify-between gap-3">
          {data.map((d) => {
            const hIn = Math.round((d.inQty / max) * 100);
            const hOut = Math.round((d.outQty / max) * 100);

            return (
              <div key={d.day} className="flex w-full flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center gap-2">
                  <div
                    className="w-2.5 rounded-full bg-emerald-500/90"
                    style={{ height: `${hIn}%` }}
                    title={`In: ${d.inQty}`}
                  />
                  <div
                    className="w-2.5 rounded-full bg-blue-500/90"
                    style={{ height: `${hOut}%` }}
                    title={`Out: ${d.outQty}`}
                  />
                </div>

                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {d.day}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500/90" />
            In
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500/90" />
            Out
          </div>
        </div>
      </CardBody>
    </Card>
  );
}