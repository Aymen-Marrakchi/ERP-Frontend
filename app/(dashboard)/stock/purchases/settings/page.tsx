"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default function PurchasesSettingsPage() {
  return (
    <div className="space-y-6">
      <Topbar title="Purchases Settings" subtitle="Master parameters (UI-only for PFE scope)" />

      <Card>
        <CardHeader title="Numbering" subtitle="Auto numbering rules (DA / PO / GR / Supplier Invoice)" right={<Button variant="secondary">Save</Button>} />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">DA Prefix</div>
              <Input defaultValue="DA-" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">PO Prefix</div>
              <Input defaultValue="PO-" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">GR Prefix</div>
              <Input defaultValue="GR-" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Supplier Invoice Prefix</div>
              <Input defaultValue="SINV-" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Units, Taxes, Currency" subtitle="Reference lists for purchasing lines" right={<Button variant="secondary">Save</Button>} />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Default Unit</div>
              <Select defaultValue="pcs">
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="m">m</option>
                <option value="box">box</option>
              </Select>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Default Tax Rate</div>
              <Select defaultValue="0.19">
                <option value="0">0</option>
                <option value="0.07">0.07</option>
                <option value="0.19">0.19</option>
              </Select>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Default Currency</div>
              <Select defaultValue="TND">
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Approval Workflow" subtitle="Configurable workflow (UI-only placeholder)" right={<Button variant="secondary">Save</Button>} />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">PO approval</div>
              <Select defaultValue="2">
                <option value="1">Single level</option>
                <option value="2">Two levels</option>
                <option value="3">Three levels</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice approval</div>
              <Select defaultValue="2">
                <option value="1">Single level</option>
                <option value="2">Two levels</option>
              </Select>
            </div>

            <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">
              In backend, this configuration will control role-based approvals and required validations.
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}