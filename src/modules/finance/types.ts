// Finance & Accounting Module Types

export interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceType: 'sales' | 'purchase' | 'credit_note' | 'debit_note';
  customerId?: string;
  supplierId?: string;
  orderId?: string;
  invoiceDate: Date;
  dueDate: Date;
  currency: string;
  exchangeRate: number;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'pending' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: string;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface InvoiceItem {
  id: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  accountCode?: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  paymentType: 'incoming' | 'outgoing';
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'e_wallet';
  referenceType: 'invoice' | 'purchase_order' | 'expense' | 'refund';
  referenceId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  localAmount: number;
  paymentDate: Date;
  bankAccount?: string;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  attachments?: string[];
  reconciledDate?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface JournalEntry {
  id: string;
  entryNo: string;
  entryDate: Date;
  description: string;
  referenceType?: string;
  referenceId?: string;
  lines: JournalLine[];
  status: 'draft' | 'posted' | 'void';
  postedDate?: Date;
  postedBy?: string;
  attachments?: string[];
  createdAt: Date;
  createdBy: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  costCenter?: string;
  project?: string;
  tags?: string[];
}

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  accountSubtype: string;
  parentAccountCode?: string;
  isActive: boolean;
  isSystemAccount: boolean;
  normalBalance: 'debit' | 'credit';
  currentBalance: number;
  description?: string;
  taxCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneralLedger {
  id: string;
  accountCode: string;
  transactionDate: Date;
  referenceType: string;
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  journalEntryId: string;
  reconciled: boolean;
  reconciledDate?: Date;
  createdAt: Date;
}

export interface TaxRate {
  id: string;
  taxCode: string;
  taxName: string;
  taxType: 'sales' | 'purchase' | 'both';
  rate: number;
  isCompound: boolean;
  isInclusive: boolean;
  accountCode: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  description?: string;
}

export interface BudgetPlan {
  id: string;
  budgetName: string;
  fiscalYear: number;
  fiscalPeriod: string;
  department?: string;
  costCenter?: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'approved' | 'active' | 'closed';
  lines: BudgetLine[];
  totalBudget: number;
  totalActual: number;
  variance: number;
  approvedBy?: string;
  approvedDate?: Date;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface BudgetLine {
  id: string;
  accountCode: string;
  accountName: string;
  budgetAmount: number;
  actualAmount: number;
  committedAmount: number;
  availableAmount: number;
  variance: number;
  variancePercentage: number;
  notes?: string;
}

export interface FinancialReport {
  id: string;
  reportType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'general_ledger' | 'aged_receivables' | 'aged_payables';
  reportName: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  generatedDate: Date;
  generatedBy: string;
  data: any;
  format: 'json' | 'pdf' | 'excel' | 'csv';
  fileUrl?: string;
  parameters?: Record<string, any>;
}

export interface CashFlow {
  id: string;
  date: Date;
  accountId: string;
  accountName: string;
  flowType: 'operating' | 'investing' | 'financing';
  direction: 'inflow' | 'outflow';
  amount: number;
  balance: number;
  category: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
}

export interface AccountsReceivable {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: Date;
  dueDate: Date;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  daysOverdue: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '91-120' | '120+';
  status: 'current' | 'overdue' | 'disputed' | 'written_off';
  lastPaymentDate?: Date;
  notes?: string;
}

export interface AccountsPayable {
  id: string;
  supplierId: string;
  supplierName: string;
  billId: string;
  billNo: string;
  billDate: Date;
  dueDate: Date;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  daysUntilDue: number;
  status: 'pending' | 'scheduled' | 'paid' | 'overdue' | 'disputed';
  scheduledPaymentDate?: Date;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  notes?: string;
}

// Request/Response Types
export interface CreateInvoiceRequest {
  invoiceType: 'sales' | 'purchase';
  customerId?: string;
  supplierId?: string;
  orderId?: string;
  invoiceDate: Date;
  dueDate: Date;
  items: Array<{
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number;
    taxRate?: number;
    accountCode?: string;
  }>;
  paymentTerms: string;
  notes?: string;
  attachments?: string[];
}

export interface ProcessPaymentRequest {
  invoiceId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'e_wallet';
  paymentDate: Date;
  bankAccount?: string;
  transactionId?: string;
  notes?: string;
}

export interface ReconciliationRequest {
  accountCode: string;
  statementDate: Date;
  statementBalance: number;
  transactions: Array<{
    transactionId: string;
    amount: number;
    cleared: boolean;
  }>;
}

export interface FinancialReportRequest {
  reportType: string;
  startDate: Date;
  endDate: Date;
  format?: 'json' | 'pdf' | 'excel' | 'csv';
  filters?: {
    departments?: string[];
    costCenters?: string[];
    accounts?: string[];
    tags?: string[];
  };
}

export interface TaxCalculationRequest {
  items: Array<{
    amount: number;
    taxCode: string;
    quantity?: number;
  }>;
  isInclusive?: boolean;
}

export interface TaxCalculationResponse {
  subtotal: number;
  taxDetails: Array<{
    taxCode: string;
    taxName: string;
    rate: number;
    taxAmount: number;
  }>;
  totalTax: number;
  totalAmount: number;
}