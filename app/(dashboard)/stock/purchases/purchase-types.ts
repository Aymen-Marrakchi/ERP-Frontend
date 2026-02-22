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
  createdAt: string;
  neededDate: string;
  budgetCode?: string;
  rejectionReason?: string;
  lines: PurchaseRequestLine[];
};

export type PurchaseOrderStatus =
  | "Draft"
  | "Validated"
  | "Sent"
  | "Partially Received"
  | "Received"
  | "Closed";

export type PurchaseOrderLine = {
  id: string;
  item: string;
  qty: number;
  unit: string;
  unitPriceHT: number;
  taxRate: number;
  discount: number;
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
