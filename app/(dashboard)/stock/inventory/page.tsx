"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { useMemo, useState } from "react";
import { InventorySession, useStock } from "../store";

export default function StockInventoryPage() {
  const { state, dispatch } = useStock();

  const categories = useMemo(() => {
    const existing = Array.from(new Set(state.products.map((p) => p.category)));
    return existing.length ? existing : ["Finished Goods", "Raw Materials", "Consumables"];
  }, [state.products]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    scope: "All Products" as InventorySession["scope"],
    category: categories[0] ?? "",
  });

  const [selectedId, setSelectedId] = useState<string>("");

  const selected = useMemo(() => state.inventories.find((x) => x.id === selectedId) ?? null, [state.inventories, selectedId]);

  const openCreate = () => {
    setCreateForm({
      date: new Date().toISOString().slice(0, 10),
      scope: "All Products",
      category: categories[0] ?? "",
    });
    setCreateOpen(true);
  };

  const createSession = () => {
    const scope = createForm.scope;
    const products = scope === "All Products"
      ? state.products
      : state.products.filter((p) => p.category === createForm.category);

    const session: InventorySession = {
      id: `INV-${String(Date.now()).slice(-5)}`,
      date: createForm.date,
      scope,
      category: scope === "Category" ? createForm.category : undefined,
      status: "In Progress",
      lines: products.map((p) => ({
        productId: p.id,
        expected: p.qty,
        counted: p.qty,
        note: "",
      })),
    };

    dispatch({ type: "INVENTORY_CREATE", payload: session });
    setSelectedId(session.id);
    setCreateOpen(false);
  };

  const updateCounted = (productId: string, counted: number) => {
    if (!selected) return;
    dispatch({ type: "INVENTORY_UPDATE_LINE", payload: { sessionId: selected.id, productId, counted } });
  };

  const validate = () => {
    if (!selected) return;
    dispatch({ type: "INVENTORY_VALIDATE", payload: { sessionId: selected.id } });
  };

  const productsById = useMemo(() => Object.fromEntries(state.products.map((p) => [p.id, p])), [state.products]);

  const diffSummary = useMemo(() => {
    if (!selected) return { diffs: 0, totalDiff: 0 };
    const diffs = selected.lines.filter((l) => l.counted !== l.expected);
    const totalDiff = diffs.reduce((acc, l) => acc + (l.counted - l.expected), 0);
    return { diffs: diffs.length, totalDiff };
  }, [selected]);

  return (
    <div className="space-y-6">
      <Topbar
        title="Inventory"
        subtitle="Create an inventory session, count products, validate to generate adjustments"
        right={<Button onClick={openCreate}>Create Session</Button>}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Inventory Sessions" subtitle="Select a session to work on it" />
          <CardBody>
            <div className="mb-3">
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">Select a session...</option>
                {state.inventories.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} - {inv.date} - {inv.status}
                  </option>
                ))}
              </Select>
            </div>

            <Table headers={["Session", "Date", "Scope", "Status"]}>
              {state.inventories.map((inv) => (
                <tr
                  key={inv.id}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selectedId === inv.id ? "bg-slate-50 dark:bg-slate-800/30" : ""}`}
                  onClick={() => setSelectedId(inv.id)}
                >
                  <td className="px-4 py-3 font-medium">{inv.id}</td>
                  <td className="px-4 py-3">{inv.date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {inv.scope}{inv.scope === "Category" ? ` (${inv.category})` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "Validated" ? (
                      <Badge variant="success">Validated</Badge>
                    ) : (
                      <Badge variant="info">{inv.status}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </Table>

            {state.inventories.length === 0 ? (
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No sessions yet. Create one to start counting.
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Count Sheet"
            subtitle={selected ? `Session ${selected.id} - Differences: ${diffSummary.diffs}` : "Select a session"}
            right={
              selected ? (
                <div className="flex gap-2">
                  <Button variant="secondary">Export Report</Button>
                  <Button
                    onClick={validate}
                    disabled={selected.status === "Validated"}
                    className={selected.status === "Validated" ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    Validate
                  </Button>
                </div>
              ) : null
            }
          />
          <CardBody>
            {!selected ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Select an inventory session to display the count sheet.
              </div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Lines</div>
                    <div className="mt-2 text-xl font-semibold">{selected.lines.length}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Differences</div>
                    <div className="mt-2 text-xl font-semibold">{diffSummary.diffs}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Net Adjustment</div>
                    <div className="mt-2 text-xl font-semibold">{diffSummary.totalDiff}</div>
                  </div>
                </div>

                <Table headers={["Product", "Expected", "Counted", "Difference"]}>
                  {selected.lines.map((l) => {
                    const p = productsById[l.productId];
                    const diff = l.counted - l.expected;
                    const diffCls =
                      diff === 0
                        ? "text-slate-600 dark:text-slate-300"
                        : diff > 0
                        ? "text-emerald-600"
                        : "text-rose-600";

                    return (
                      <tr key={l.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{p?.name ?? "Unknown"}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{p?.reference}</div>
                        </td>
                        <td className="px-4 py-3">{l.expected}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            value={String(l.counted)}
                            disabled={selected.status === "Validated"}
                            onChange={(e) => updateCounted(l.productId, Number(e.target.value))}
                            className="max-w-[140px]"
                          />
                        </td>
                        <td className={`px-4 py-3 font-semibold ${diffCls}`}>
                          {diff > 0 ? `+${diff}` : `${diff}`}
                        </td>
                      </tr>
                    );
                  })}
                </Table>

                <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Validating will generate adjustment movements for each product difference and update quantities immediately.
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={createOpen}
        title="Create Inventory Session"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createSession}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Date</div>
            <Input type="date" value={createForm.date} onChange={(e) => setCreateForm((s) => ({ ...s, date: e.target.value }))} />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Scope</div>
            <Select
              value={createForm.scope}
              onChange={(e) => setCreateForm((s) => ({ ...s, scope: e.target.value as any }))}
            >
              <option value="All Products">All Products</option>
              <option value="Category">Category</option>
            </Select>
          </div>

          {createForm.scope === "Category" ? (
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Category</div>
              <Select value={createForm.category} onChange={(e) => setCreateForm((s) => ({ ...s, category: e.target.value }))}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          ) : null}

          <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-400">
            The session will prefill expected quantities from current stock. You can edit counted values and validate to generate adjustments.
          </div>
        </div>
      </Modal>
    </div>
  );
}

