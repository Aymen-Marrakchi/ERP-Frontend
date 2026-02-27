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
import type { GoodsReceipt, ReceiptStatus } from "../../store";
import { usePurchases } from "../store";

export default function GoodsReceiptsPage() {
  const { state, dispatch } = usePurchases();

  const supplierById = useMemo(() => Object.fromEntries(state.suppliers.map((s) => [s.id, s])), [state.suppliers]);
  const poById = useMemo(() => Object.fromEntries(state.orders.map((o) => [o.id, o])), [state.orders]);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  // Fallback to first PO if available
  const [form, setForm] = useState({
    poId: state.orders[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10),
    disputeNote: "",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const receipts = state.receipts || []; // Safe fallback
    return receipts.filter((gr) => {
      const po = poById[gr.poId];
      const sup = supplierById[gr.supplierId];
      const text = `${gr.grNo} ${po?.poNo ?? ""} ${sup?.name ?? ""}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [state.receipts, q, poById, supplierById]);

  // Local state for the lines in the modal (quantities being received)
  const [draftLines, setDraftLines] = useState<Record<string, { receivedQty: string; quality: "Accepted" | "Rejected"; note: string }>>({});

  const openCreate = () => {
    const po = poById[form.poId] ?? state.orders[0];
    if (!po) return;

    // Initialize lines with ordered quantities
    const init: Record<string, any> = {};
    po.lines.forEach((l) => {
      init[l.id] = { receivedQty: String(l.qty), quality: "Accepted", note: "" };
    });
    setDraftLines(init);

    setForm((s) => ({
      ...s,
      poId: po.id,
      date: new Date().toISOString().slice(0, 10),
      disputeNote: "",
    }));
    setOpen(true);
  };

  const createReceipt = () => {
    const po = poById[form.poId];
    if (!po) return;

    const gr: GoodsReceipt = {
      id: `gr-${Date.now()}`,
      grNo: `GR-${String(Date.now()).slice(-4)}`,
      poId: po.id,
      supplierId: po.supplierId,
      status: "Draft",
      date: form.date,
      disputeNote: form.disputeNote.trim() || undefined,
      lines: po.lines.map((l) => ({
        id: `grl-${Date.now()}-${l.id}`,
        poLineId: l.id,
        item: l.item,
        orderedQty: l.qty,
        receivedQty: Math.max(0, Number(draftLines[l.id]?.receivedQty ?? l.qty) || 0),
        quality: draftLines[l.id]?.quality ?? "Accepted",
        note: draftLines[l.id]?.note?.trim() || undefined,
      })),
    };

    dispatch({ type: "GR_CREATE", payload: gr });
    setOpen(false);
  };

  const validate = (grId: string) => dispatch({ type: "GR_VALIDATE", payload: { grId } });

  return (
    <div className="space-y-6">
      <Topbar
        title="Goods Receipts (BR)"
        subtitle="Receive goods against POs, check quality, and update stock"
        right={<Button onClick={openCreate}>+ Receive Goods</Button>}
      />

      <Card>
        <CardHeader title="Receipt History" subtitle="Draft → Validated" right={<Button variant="secondary">Export List</Button>} />
        <CardBody>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search GR / PO / Supplier..." />
            <Select value={form.poId} onChange={(e) => setForm((s) => ({ ...s, poId: e.target.value }))}>
              {state.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.poNo} — {supplierById[o.supplierId]?.name ?? "Unknown"} ({o.status})
                </option>
              ))}
            </Select>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              Validating a receipt updates the PO status and should update Inventory.
            </div>
          </div>

          <Table headers={["GR No", "PO No", "Supplier", "Date", "Status", "Actions"]}>
            {filtered.map((gr) => {
              const po = poById[gr.poId];
              const sup = supplierById[gr.supplierId];
              return (
                <tr key={gr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{gr.grNo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{po?.poNo ?? "Unknown"}</td>
                  <td className="px-4 py-3">{sup?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3">{gr.date}</td>
                  <td className="px-4 py-3">
                    {gr.status === "Validated" ? <Badge variant="success">Validated</Badge> : <Badge variant="neutral">Draft</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {gr.status !== "Validated" ? (
                        <Button className="py-1.5" onClick={() => validate(gr.id)}>
                          Validate
                        </Button>
                      ) : (
                        <Button variant="secondary" className="py-1.5">View</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
          
          {filtered.length === 0 && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No receipts found.
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        title="Create Goods Receipt"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createReceipt}>Create Receipt</Button>
          </>
        }
      >
        {(() => {
          const po = poById[form.poId];
          if (!po) return <div className="text-sm text-slate-500 dark:text-slate-400">Please select a PO first.</div>;
          const sup = supplierById[po.supplierId];

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Purchase Order</div>
                  <Input value={po.poNo} disabled className="bg-slate-100 dark:bg-slate-800" />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Supplier</div>
                  <Input value={sup?.name ?? "Unknown"} disabled className="bg-slate-100 dark:bg-slate-800" />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reception Date</div>
                  <Input type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
                </div>
              </div>

              <div className="text-sm font-semibold">Line Items (Receive Quantities)</div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Item</th>
                      <th className="px-4 py-3 text-left font-semibold">Ordered</th>
                      <th className="px-4 py-3 text-left font-semibold w-24">Received</th>
                      <th className="px-4 py-3 text-left font-semibold">Quality</th>
                      <th className="px-4 py-3 text-left font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {po.lines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium">{l.item}</td>
                        <td className="px-4 py-3 text-slate-500">{l.qty}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            value={draftLines[l.id]?.receivedQty ?? String(l.qty)}
                            onChange={(e) =>
                              setDraftLines((m) => ({ ...m, [l.id]: { ...(m[l.id] ?? {}), receivedQty: e.target.value } }))
                            }
                            className="max-w-[100px]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={draftLines[l.id]?.quality ?? "Accepted"}
                            onChange={(e) =>
                              setDraftLines((m) => ({ ...m, [l.id]: { ...(m[l.id] ?? {}), quality: e.target.value as any } }))
                            }
                          >
                            <option value="Accepted">OK</option>
                            <option value="Rejected">Bad</option>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={draftLines[l.id]?.note ?? ""}
                            onChange={(e) =>
                              setDraftLines((m) => ({ ...m, [l.id]: { ...(m[l.id] ?? {}), note: e.target.value } }))
                            }
                            placeholder="..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">General Note / Dispute</div>
                <Input value={form.disputeNote} onChange={(e) => setForm((s) => ({ ...s, disputeNote: e.target.value }))} placeholder="E.g. Pallet damaged, missing box..." />
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
