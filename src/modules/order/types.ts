export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  orderType: 'standard' | 'urgent' | 'pre_order' | 'subscription';
  status: OrderStatus;
  orderDate: Date;
  requestedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  salesChannel: 'direct' | 'online' | 'phone' | 'wholesale';
  salesRepId?: string;
  
  // Pricing
  subtotal: number;
  discountAmount: number;
  discountRate?: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  
  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentTerms: string;
  creditUsed?: number;
  
  // Delivery
  deliveryStatus: DeliveryStatus;
  deliveryAddress: Address;
  deliveryNotes?: string;
  
  // Tracking
  internalNotes?: string;
  customerNotes?: string;
  tags?: string[];
  source?: string;
  referenceNo?: string;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  specification?: string;
  
  // Quantities
  orderedQty: number;
  confirmedQty?: number;
  allocatedQty?: number;
  shippedQty?: number;
  deliveredQty?: number;
  returnedQty?: number;
  unitId: string;
  
  // Pricing
  unitPrice: number;
  originalPrice?: number;
  discountRate?: number;
  discountAmount?: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  
  // Batch/Lot tracking
  batchId?: string;
  batchNo?: string;
  expiryDate?: Date;
  
  // Status
  status: 'pending' | 'confirmed' | 'allocated' | 'picked' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  
  // Promotion
  promotionId?: string;
  promotionCode?: string;
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  contactPerson?: string;
  contactPhone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export type OrderStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'refunded';

export type DeliveryStatus = 
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned';

export interface OrderFilter {
  customerId?: string;
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  deliveryStatus?: DeliveryStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  salesChannel?: string;
  searchTerm?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateOrderRequest {
  customerId: string;
  orderType?: 'standard' | 'urgent' | 'pre_order' | 'subscription';
  requestedDeliveryDate?: Date;
  salesChannel?: string;
  salesRepId?: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitPrice?: number;
    discountRate?: number;
    notes?: string;
  }>;
  deliveryAddress: Address;
  paymentMethod?: string;
  paymentTerms?: string;
  customerNotes?: string;
  internalNotes?: string;
  applyPromotion?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
  notifyCustomer?: boolean;
}

export interface OrderPricingRequest {
  customerId: string;
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
  deliveryAddress?: Address;
  promotionCode?: string;
  useCredit?: boolean;
}

export interface OrderPricingResponse {
  items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number;
    discountAmount: number;
    taxAmount: number;
    subtotal: number;
    promotionApplied?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  availableCredit?: number;
  creditApplied?: number;
  promotions?: Array<{
    code: string;
    description: string;
    discountAmount: number;
  }>;
}

export interface OrderAllocation {
  orderId: string;
  allocations: Array<{
    itemId: string;
    warehouseId: string;
    batchId?: string;
    quantity: number;
    status: 'reserved' | 'picked' | 'packed';
  }>;
  allocationDate: Date;
  expiryDate?: Date;
}

export interface OrderFulfillment {
  orderId: string;
  fulfillmentNo: string;
  warehouseId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    batchId?: string;
    location?: string;
  }>;
  packingStatus: 'pending' | 'in_progress' | 'completed';
  shippingCarrier?: string;
  trackingNo?: string;
  shippedAt?: Date;
  estimatedDelivery?: Date;
}

export interface OrderReturn {
  id: string;
  returnNo: string;
  orderId: string;
  customerId: string;
  returnDate: Date;
  reason: string;
  items: Array<{
    itemId: string;
    quantity: number;
    condition: 'good' | 'damaged' | 'expired';
    restockable: boolean;
  }>;
  refundAmount?: number;
  refundStatus?: 'pending' | 'approved' | 'processed' | 'rejected';
  notes?: string;
  processedBy?: string;
  processedAt?: Date;
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByChannel: Record<string, number>;
  topProducts: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }>;
  dailyOrders: Array<{
    date: Date;
    count: number;
    revenue: number;
  }>;
}

export interface CustomerOrderHistory {
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  favoriteItems: Array<{
    itemId: string;
    itemName: string;
    orderCount: number;
    totalQuantity: number;
  }>;
  orderFrequency?: number; // days between orders
  customerSegment?: 'vip' | 'regular' | 'occasional' | 'new';
}