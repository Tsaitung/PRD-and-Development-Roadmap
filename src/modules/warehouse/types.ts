export interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseType?: 'main' | 'transit' | 'cold';
  address?: string;
  managerId?: string;
  capacityM3?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InventorySnapshot {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  availableQty: number;
  reservedQty: number;
  inTransitQty: number;
  unitCost?: number;
  totalValue?: number;
  lastCountedAt?: Date;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryBatch {
  id: string;
  batchNo: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  productionDate?: Date;
  expiryDate?: Date;
  supplierId?: string;
  supplierBatchNo?: string;
  qualityGrade?: string;
  location?: string;
  status: 'available' | 'reserved' | 'quarantine' | 'expired';
  createdAt: Date;
}

export interface InventoryTransaction {
  id: string;
  transactionNo: string;
  transactionType: 'in' | 'out' | 'transfer' | 'adjust';
  warehouseId: string;
  itemId: string;
  batchId?: string;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface InventoryQueryParams {
  warehouseId?: string;
  itemId?: string;
  includeReserved?: boolean;
  includeBatches?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  page?: number;
  limit?: number;
  sortBy?: 'quantity' | 'value' | 'lastMovement';
  sortOrder?: 'asc' | 'desc';
}

export interface StockAdjustmentRequest {
  warehouseId: string;
  itemId: string;
  batchId?: string;
  adjustmentType: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface TransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  itemId: string;
  batchId?: string;
  quantity: number;
  expectedDate?: Date;
  notes?: string;
}