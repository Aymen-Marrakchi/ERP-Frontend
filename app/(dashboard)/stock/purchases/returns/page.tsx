"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PurchasesReturnsPage() {
  return (
    <div className="space-y-6">
      <Topbar
        title="Purchase Returns"
        subtitle="Supplier return workflow (placeholder page)"
        right={<Button variant="secondary">Export</Button>}
      />

      <Card>
        <CardHeader title="Returns" subtitle="This module page is ready for implementation" />
        <CardBody>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Create and manage supplier returns here (RTV), linked to goods receipts and supplier invoices.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
