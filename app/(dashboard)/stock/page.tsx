import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";

export default function StockOverview() {
  return (
    <div className="space-y-6">
      <Topbar
        title="Stock Overview"
        subtitle="Real-time visibility, alerts, inventory and traceability"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Total Products</div><div className="mt-2 text-2xl font-bold">128</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Low Stock</div><div className="mt-2 text-2xl font-bold text-amber-600">18</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Out of Stock</div><div className="mt-2 text-2xl font-bold text-rose-600">8</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-slate-500 dark:text-slate-400">Movements (7d)</div><div className="mt-2 text-2xl font-bold">312</div></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Threshold Alerts"
            subtitle="Products under minimum threshold (reorder needed)"
            right={<Button variant="secondary">Open Alerts</Button>}
          />
          <CardBody>
            <Table headers={["Product", "Qty", "Min", "Status", "Action"]}>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">Item A</td>
                <td className="px-4 py-3">3</td>
                <td className="px-4 py-3">10</td>
                <td className="px-4 py-3"><Badge variant="warning">Low</Badge></td>
                <td className="px-4 py-3">
                  <Button className="py-1.5" variant="primary">Create Restock</Button>
                </td>
              </tr>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Movements"
            subtitle="Entries / exits with traceability"
            right={<Button variant="secondary">Open Movements</Button>}
          />
          <CardBody>
            <Table headers={["Date", "Type", "Product", "Qty", "Source"]}>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">2026-02-20</td>
                <td className="px-4 py-3"><Badge variant="info">IN</Badge></td>
                <td className="px-4 py-3 font-medium">Item B</td>
                <td className="px-4 py-3">+50</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Purchase</td>
              </tr>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
