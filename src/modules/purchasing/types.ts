// Purchasing Management Module Types

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  supplierType: 'manufacturer' | 'distributor' | 'wholesaler' | 'service_provider' | 'contractor';
  category: string[];
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  rating: number;
  certifications: SupplierCertification[];
  contacts: SupplierContact[];
  addresses: SupplierAddress[];
  bankAccounts: BankAccount[];
  paymentTerms: string;
  creditLimit: number;
  currency: string;
  taxId: string;
  businessLicense?: string;
  website?: string;
  notes?: string;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  responseTime: number; // Average response time in hours
  leadTime: number; // Average lead time in days
  minimumOrderValue?: number;
  preferredSupplier: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SupplierCertification {
  id: string;
  certificationType: string;
  certificationNumber: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate: Date;
  documentUrl?: string;
  verified: boolean;
  verifiedDate?: Date;
}

export interface SupplierContact {
  id: string;
  name: string;
  title: string;
  department: string;
  phone: string;
  mobile?: string;
  email: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface SupplierAddress {
  id: string;
  addressType: 'billing' | 'shipping' | 'both';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode?: string;
  routingNumber?: string;
  currency: string;
  isDefault: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  requisitionId?: string;
  orderDate: Date;
  expectedDate: Date;
  deliveryDate?: Date;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'acknowledged' | 'partial' | 'received' | 'closed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: PurchaseOrderItem[];
  shippingAddress: SupplierAddress;
  billingAddress: SupplierAddress;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  paymentTerms: string;
  paymentMethod?: string;
  deliveryTerms?: string;
  notes?: string;
  internalNotes?: string;
  attachments?: string[];
  approvalChain?: ApprovalRecord[];
  receivedItems?: ReceivedItem[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedDate?: Date;
}

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate?: number;
  discountAmount: number;
  taxRate?: number;
  taxAmount: number;
  lineTotal: number;
  requestedDate: Date;
  promisedDate?: Date;
  specifications?: string;
  qualityRequirements?: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  pendingQuantity: number;
}

export interface PurchaseRequisition {
  id: string;
  requisitionNo: string;
  requestedBy: string;
  department: string;
  requestDate: Date;
  requiredDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: RequisitionItem[];
  justification: string;
  budgetCode?: string;
  costCenter?: string;
  project?: string;
  estimatedCost: number;
  approvalChain?: ApprovalRecord[];
  notes?: string;
  attachments?: string[];
  convertedToPoId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequisitionItem {
  id: string;
  itemId?: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  estimatedTotal?: number;
  suggestedSupplierId?: string;
  suggestedSupplierName?: string;
  specifications?: string;
  notes?: string;
}

export interface RequestForQuotation {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  requisitionId?: string;
  status: 'draft' | 'sent' | 'responded' | 'evaluated' | 'awarded' | 'cancelled' | 'expired';
  issueDate: Date;
  dueDate: Date;
  validUntil: Date;
  items: RFQItem[];
  suppliers: RFQSupplier[];
  terms: RFQTerms;
  evaluationCriteria: EvaluationCriteria;
  selectedQuoteId?: string;
  attachments?: string[];
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface RFQItem {
  id: string;
  itemId?: string;
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
  qualityRequirements?: string;
  deliveryRequirements?: string;
}

export interface RFQSupplier {
  id: string;
  supplierId: string;
  supplierName: string;
  invitedDate: Date;
  respondedDate?: Date;
  status: 'invited' | 'viewed' | 'responded' | 'declined' | 'selected' | 'rejected';
  quote?: SupplierQuote;
}

export interface SupplierQuote {
  id: string;
  quoteNumber: string;
  quoteDate: Date;
  validUntil: Date;
  items: QuoteItem[];
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryTerms: string;
  leadTime: number; // in days
  warranty?: string;
  notes?: string;
  attachments?: string[];
  score?: number;
  ranking?: number;
}

export interface QuoteItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  discountRate?: number;
  taxRate?: number;
  lineTotal: number;
  leadTime?: number;
  notes?: string;
}

export interface RFQTerms {
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyRequirements?: string;
  qualityStandards?: string;
  penaltyClause?: string;
  confidentialityClause?: string;
  additionalTerms?: string;
}

export interface EvaluationCriteria {
  priceWeight: number; // 0-100
  qualityWeight: number; // 0-100
  deliveryWeight: number; // 0-100
  serviceWeight: number; // 0-100
  otherWeight: number; // 0-100
  minimumScore?: number;
}

export interface GoodsReceipt {
  id: string;
  receiptNo: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receiptDate: Date;
  receivedBy: string;
  status: 'draft' | 'partial' | 'complete' | 'cancelled';
  items: ReceivedItem[];
  qualityCheckStatus?: 'pending' | 'passed' | 'failed' | 'partial';
  qualityCheckNotes?: string;
  warehouseId: string;
  warehouseName: string;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  createdBy: string;
}

export interface ReceivedItem {
  id: string;
  poItemId: string;
  itemId: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
  batchNo?: string;
  serialNo?: string;
  expiryDate?: Date;
  qualityCheckPassed: boolean;
  qualityCheckNotes?: string;
  storageLocation?: string;
  notes?: string;
}

export interface ApprovalRecord {
  id: string;
  level: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  comments?: string;
  approvedDate?: Date;
  escalatedTo?: string;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalOrders: number;
    completedOrders: number;
    onTimeDeliveries: number;
    qualityIssues: number;
    averageLeadTime: number;
    averageResponseTime: number;
    totalSpend: number;
    costSavings: number;
    rejectionRate: number;
    defectRate: number;
  };
  scores: {
    overall: number;
    quality: number;
    delivery: number;
    price: number;
    service: number;
    compliance: number;
  };
  trends: {
    qualityTrend: 'improving' | 'stable' | 'declining';
    deliveryTrend: 'improving' | 'stable' | 'declining';
    priceTrend: 'improving' | 'stable' | 'declining';
  };
  recommendations?: string[];
}

// Request/Response Types
export interface CreatePurchaseOrderRequest {
  supplierId: string;
  requisitionId?: string;
  expectedDate: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number;
    taxRate?: number;
    requestedDate: Date;
    specifications?: string;
  }>;
  shippingAddressId?: string;
  paymentTerms: string;
  deliveryTerms?: string;
  notes?: string;
}

export interface CreateRFQRequest {
  title: string;
  description: string;
  requisitionId?: string;
  dueDate: Date;
  validUntil: Date;
  items: Array<{
    itemId?: string;
    description: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }>;
  supplierIds: string[];
  terms: RFQTerms;
  evaluationCriteria: EvaluationCriteria;
}

export interface EvaluateQuotesRequest {
  rfqId: string;
  evaluationNotes?: string;
  overrideCriteria?: EvaluationCriteria;
}

export interface ReceiveGoodsRequest {
  poId: string;
  items: Array<{
    poItemId: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity?: number;
    rejectionReason?: string;
    batchNo?: string;
    expiryDate?: Date;
    qualityCheckPassed: boolean;
    storageLocation?: string;
  }>;
  warehouseId: string;
  notes?: string;
}

export interface SupplierSearchFilter {
  search?: string;
  supplierType?: string[];
  category?: string[];
  status?: string[];
  minRating?: number;
  preferredOnly?: boolean;
  certificationRequired?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rating' | 'leadTime' | 'lastOrder';
  sortOrder?: 'asc' | 'desc';
}