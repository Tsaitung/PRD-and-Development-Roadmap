export interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  customerNameEn?: string;
  customerType: CustomerType;
  tierLevel: number;
  status: CustomerStatus;
  
  // Business Information
  taxId?: string;
  businessLicense?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  establishedDate?: Date;
  
  // Contact Information
  primaryContact: ContactPerson;
  secondaryContacts?: ContactPerson[];
  billingAddress: Address;
  shippingAddresses: Address[];
  
  // Financial Information
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  paymentTerms: PaymentTerms;
  paymentMethod?: PaymentMethod;
  bankAccount?: BankAccount;
  
  // Business Rules
  pricingTier?: string;
  discountRate?: number;
  specialTerms?: string[];
  blacklisted: boolean;
  blacklistReason?: string;
  
  // Preferences
  preferredDeliveryTime?: string;
  preferredCarrier?: string;
  specialInstructions?: string;
  marketingOptIn: boolean;
  
  // Relationship
  salesRepId?: string;
  accountManagerId?: string;
  parentCustomerId?: string; // For subsidiaries
  relatedCustomerIds?: string[];
  
  // Analytics
  firstPurchaseDate?: Date;
  lastPurchaseDate?: Date;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  orderFrequency?: number; // days
  churnRisk?: ChurnRisk;
  
  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactPerson {
  id?: string;
  name: string;
  title?: string;
  phone: string;
  mobile?: string;
  email?: string;
  department?: string;
  isDecisionMaker?: boolean;
  preferredContactMethod?: 'phone' | 'email' | 'sms' | 'whatsapp';
  notes?: string;
}

export interface Address {
  id?: string;
  addressType?: 'billing' | 'shipping' | 'both';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
  deliveryInstructions?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

export type CustomerType = 
  | 'individual'
  | 'retailer'
  | 'wholesaler'
  | 'distributor'
  | 'chain'
  | 'online'
  | 'export';

export type CustomerStatus = 
  | 'prospect'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'blacklisted';

export type PaymentTerms = 
  | 'COD'
  | 'NET7'
  | 'NET15'
  | 'NET30'
  | 'NET45'
  | 'NET60'
  | 'EOM'; // End of month

export type PaymentMethod = 
  | 'cash'
  | 'check'
  | 'bank_transfer'
  | 'credit_card'
  | 'e_wallet';

export type ChurnRisk = 'low' | 'medium' | 'high' | 'churned';

export interface CustomerCredit {
  id: string;
  customerId: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  temporaryLimit?: number;
  temporaryLimitExpiry?: Date;
  
  // Risk Assessment
  riskScore: number;
  riskCategory: 'low' | 'medium' | 'high' | 'very_high';
  paymentHistory: PaymentHistoryItem[];
  
  // Credit Control
  creditStatus: 'active' | 'on_hold' | 'suspended' | 'closed';
  creditHoldReason?: string;
  lastReviewDate: Date;
  nextReviewDate: Date;
  
  // Overdue Management
  overdueAmount: number;
  overdueInvoices: number;
  oldestOverdueDays: number;
  averagePaymentDays: number;
  
  // Approval
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentHistoryItem {
  invoiceNo: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  paidDate?: Date;
  daysOverdue: number;
  status: 'paid' | 'partial' | 'overdue' | 'written_off';
}

export interface CustomerTier {
  id: string;
  tierCode: string;
  tierName: string;
  level: number;
  
  // Benefits
  discountRate: number;
  freeShipping: boolean;
  prioritySupport: boolean;
  exclusiveProducts: boolean;
  
  // Requirements
  minAnnualSpend?: number;
  minOrderCount?: number;
  minYearsActive?: number;
  
  // Auto-upgrade/downgrade
  autoUpgrade: boolean;
  autoDowngrade: boolean;
  evaluationPeriod: number; // months
  
  benefits: string[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CustomerSegment {
  id: string;
  segmentCode: string;
  segmentName: string;
  description?: string;
  
  // Criteria
  criteria: SegmentCriteria;
  
  // Marketing
  marketingStrategy?: string;
  communicationPreference?: string[];
  campaignIds?: string[];
  
  // Analytics
  customerCount: number;
  averageValue: number;
  totalRevenue: number;
  growthRate: number;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCriteria {
  customerTypes?: CustomerType[];
  tierLevels?: number[];
  minSpend?: number;
  maxSpend?: number;
  minOrders?: number;
  maxOrders?: number;
  lastPurchaseDays?: number;
  location?: {
    cities?: string[];
    states?: string[];
    countries?: string[];
  };
  products?: string[];
  tags?: string[];
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  interactionType: InteractionType;
  channel: InteractionChannel;
  subject: string;
  description?: string;
  
  // Context
  relatedOrderId?: string;
  relatedInvoiceId?: string;
  relatedTicketId?: string;
  
  // Outcome
  outcome?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  followUpRequired: boolean;
  followUpDate?: Date;
  
  // Assignment
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  
  attachments?: string[];
  tags?: string[];
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InteractionType = 
  | 'call'
  | 'email'
  | 'meeting'
  | 'support'
  | 'complaint'
  | 'feedback'
  | 'quote'
  | 'visit';

export type InteractionChannel = 
  | 'phone'
  | 'email'
  | 'in_person'
  | 'website'
  | 'social_media'
  | 'chat';

export interface CustomerAnalytics {
  customerId: string;
  
  // Purchase Behavior
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  orderFrequency: number; // days between orders
  lastOrderDays: number;
  
  // Product Preferences
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    orderCount: number;
    totalSpent: number;
  }>;
  
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  
  // Seasonality
  monthlySpend: Array<{
    month: string;
    amount: number;
    orderCount: number;
  }>;
  
  peakSeason?: string;
  
  // Engagement
  marketingResponseRate: number;
  supportTickets: number;
  satisfactionScore?: number;
  npsScore?: number;
  
  // Risk Indicators
  churnProbability: number;
  paymentRisk: number;
  clv: number; // Customer Lifetime Value
  
  // Comparison
  percentileRank: number; // Among all customers
  segmentRank: number; // Within segment
  
  calculatedAt: Date;
}

// Request/Response DTOs
export interface CreateCustomerRequest {
  customerName: string;
  customerType: CustomerType;
  taxId?: string;
  primaryContact: ContactPerson;
  billingAddress: Address;
  shippingAddress?: Address;
  creditLimit?: number;
  paymentTerms?: PaymentTerms;
  salesRepId?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateCustomerRequest {
  customerName?: string;
  customerType?: CustomerType;
  tierLevel?: number;
  status?: CustomerStatus;
  primaryContact?: ContactPerson;
  billingAddress?: Address;
  creditLimit?: number;
  paymentTerms?: PaymentTerms;
  discountRate?: number;
  tags?: string[];
  notes?: string;
}

export interface CustomerFilter {
  search?: string;
  customerType?: CustomerType[];
  status?: CustomerStatus[];
  tierLevel?: number[];
  minSpend?: number;
  maxSpend?: number;
  salesRepId?: string;
  tags?: string[];
  hasOverdue?: boolean;
  lastPurchaseDays?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreditAdjustmentRequest {
  customerId: string;
  adjustmentType: 'increase' | 'decrease' | 'set';
  amount: number;
  isTemporary?: boolean;
  expiryDate?: Date;
  reason: string;
  approvedBy?: string;
}