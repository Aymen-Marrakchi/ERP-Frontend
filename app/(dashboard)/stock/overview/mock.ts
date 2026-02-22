export type StockAlert = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
  timeAgo: string;
};

export type InventoryRow = {
  id: string;
  name: string;
  sku: string;
  category: "Locks" | "Keys" | "Hardware" | "Smart";
  inStock: number;
  level: number; // 0..100
  status: "In Stock" | "Low Stock" | "Out of Stock";
  trend: "up" | "down" | "flat";
};

export type MovementDay = {
  day: string; // Mon..Sun
  inQty: number;
  outQty: number;
};

export const last7Alerts: StockAlert[] = [
  { id: "a1", title: "Security Bolt M12", message: "Fully out of stock. Reorder pending.", severity: "danger", timeAgo: "2h ago" },
  { id: "a2", title: "Cylinder Lock Core", message: "Below minimum (180).", severity: "warning", timeAgo: "4h ago" },
  { id: "a3", title: "Door Hinge Heavy", message: "Critical level (95).", severity: "warning", timeAgo: "6h ago" },
  { id: "a4", title: "Auto-reorder triggered", message: "Cylinder Lock Core > 500 units.", severity: "info", timeAgo: "1d ago" },
  { id: "a5", title: "Shipment ETA", message: "Brass Key Blank B2: 22 Feb 2026", severity: "info", timeAgo: "1d ago" },
  { id: "a6", title: "Low stock", message: "Padlock Shackle 50mm < min.", severity: "warning", timeAgo: "2d ago" },
  { id: "a7", title: "Out of stock", message: "Smart Key Module is zero.", severity: "danger", timeAgo: "3d ago" },
];

export const productInventory: InventoryRow[] = [
  { id: "p1", name: "Mortise Lock Pro", sku: "SKU-0042", category: "Locks", inStock: 2400, level: 80, status: "In Stock", trend: "up" },
  { id: "p2", name: "Brass Key Blank B2", sku: "SKU-0118", category: "Keys", inStock: 8750, level: 92, status: "In Stock", trend: "up" },
  { id: "p3", name: "Cylinder Lock Core", sku: "SKU-0231", category: "Locks", inStock: 180, level: 18, status: "Low Stock", trend: "down" },
  { id: "p4", name: "Security Bolt M12", sku: "SKU-0309", category: "Hardware", inStock: 0, level: 0, status: "Out of Stock", trend: "flat" },
  { id: "p5", name: "Smart Key Module", sku: "SKU-0477", category: "Smart", inStock: 1120, level: 56, status: "In Stock", trend: "up" },
  { id: "p6", name: "Door Hinge Heavy", sku: "SKU-0512", category: "Hardware", inStock: 95, level: 9, status: "Low Stock", trend: "down" },
  { id: "p7", name: "Padlock Shackle 50mm", sku: "SKU-0689", category: "Locks", inStock: 3600, level: 72, status: "In Stock", trend: "up" },
  { id: "p8", name: "RFID Tag Sticker", sku: "SKU-0901", category: "Smart", inStock: 5200, level: 65, status: "In Stock", trend: "up" },
];

export const movements7d: MovementDay[] = [
  { day: "Mon", inQty: 120, outQty: 90 },
  { day: "Tue", inQty: 80, outQty: 70 },
  { day: "Wed", inQty: 110, outQty: 85 },
  { day: "Thu", inQty: 150, outQty: 120 },
  { day: "Fri", inQty: 95, outQty: 110 },
  { day: "Sat", inQty: 140, outQty: 90 },
  { day: "Sun", inQty: 160, outQty: 130 },
];