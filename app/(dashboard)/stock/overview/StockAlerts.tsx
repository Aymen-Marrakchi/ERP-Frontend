"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { StockAlert } from "./mock";

function dotClass(sev: StockAlert["severity"]) {
  if (sev === "danger") return "bg-rose-500";
  if (sev === "warning") return "bg-amber-500";
  return "bg-blue-500";
}

function badgeVariant(sev: StockAlert["severity"]) {
  if (sev === "danger") return "danger";
  if (sev === "warning") return "warning";
  return "info";
}

export function StockAlerts({ alerts }: { alerts: StockAlert[] }) {
  return (
    <Card>
      <CardHeader
        title="Stock Alerts"
        subtitle={`${Math.min(7, alerts.length)} latest alerts`}
        right={<Badge variant="neutral">{Math.min(7, alerts.length)}</Badge>}
      />
      <CardBody>
        <div className="space-y-2">
          {alerts.slice(0, 7).map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClass(a.severity)}`} aria-hidden />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{a.timeAgo}</span>
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.message}</div>
                <div className="mt-2">
                  <Badge variant={badgeVariant(a.severity)}>
                    {a.severity === "danger" ? "Critical" : a.severity === "warning" ? "Warning" : "Info"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
