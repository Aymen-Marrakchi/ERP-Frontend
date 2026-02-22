export type SupplierStatus = "Active" | "Blocked";

export type SupplierCategory = "Hardware" | "Transport" | "Services" | "Other";

export type Supplier = {
  id: string;
  name: string;
  category: SupplierCategory;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  rib: string;
  paymentTerms: "Cash" | "30 days" | "60 days";
  rating: 1 | 2 | 3 | 4 | 5;
  status: SupplierStatus;
  notes?: string;
};

export type PurchaseRequestStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
export type PurchasePriority = "Low" | "Normal" | "Urgent";

export type PurchaseRequestLine = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  estUnitPrice: number;
};

export type PurchaseRequest = {
  id: string;
  daNo: string;
  department: "Stock" | "Maintenance" | "Production" | "Admin";
  priority: PurchasePriority;
  status: PurchaseRequestStatus;
  createdAt: string; // YYYY-MM-DD
  neededDate: string; // YYYY-MM-DD
  budgetCode?: string;
  rejectionReason?: string;
  lines: PurchaseRequestLine[];
};

export type PurchaseOrderStatus = "Draft" | "Validated" | "Sent" | "Partially Received" | "Received" | "Closed";

export type PurchaseOrderLine = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  unitPriceHT: number;
  taxRate: number; // 0.19, 0.07 ...
  discount: number; // 0..1
};

export type PurchaseOrder = {
  id: string;
  poNo: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  expectedDelivery: string;
  paymentTerms: string;
  deliveryTerms: string;
  currency: "TND" | "EUR" | "USD";
  notes?: string;
  lines: PurchaseOrderLine[];
};

export type ReceiptStatus = "Draft" | "Validated";

export type ReceiptLine = {
  id: string;
  poLineId: string;
  item: string;
  orderedQty: number;
  receivedQty: number;
  quality: "Accepted" | "Rejected";
  note?: string;
};

export type GoodsReceipt = {
  id: string;
  grNo: string;
  poId: string;
  supplierId: string;
  status: ReceiptStatus;
  date: string;
  lines: ReceiptLine[];
  disputeNote?: string;
};
export type SupplierInvoiceStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Posted";

export type SupplierInvoiceLine = {
  id: string;
  poLineId?: string; // optional link to PO line
  item: string;
  qty: number;
  unitPriceHT: number;
  taxRate: number;
};

export type SupplierInvoice = {
  id: string;
  invNo: string;
  supplierId: string;
  poId?: string;
  receiptIds: string[];
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  status: SupplierInvoiceStatus;
  notes?: string;
  rejectionReason?: string;
  currency: "TND" | "EUR" | "USD";
  lines: SupplierInvoiceLine[];
  totalPaid: number;
};

export type ThreeWayMatchStatus = "OK" | "Mismatch" | "Missing Receipt" | "Missing PO";

export type ThreeWayMatchLine = {
  item: string;
  poQty: number;
  receivedQty: number;
  invoicedQty: number;
  status: "OK" | "Mismatch";
};

export type ThreeWayMatchResult = {
  status: ThreeWayMatchStatus;
  lines: ThreeWayMatchLine[];
};