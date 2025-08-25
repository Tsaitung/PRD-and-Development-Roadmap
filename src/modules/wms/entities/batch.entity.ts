/**
 * 批號追溯實體
 * WMS-BTM Batch & Serial Number Tracking Management
 * 
 * 提供完整的批號和序號追蹤管理，支援從原料到成品的全程追溯
 */

export interface BatchEntity {
  // 基本資訊
  id: string;
  batchNo: string;  // 批號
  serialNo?: string; // 序號
  
  // 產品資訊
  itemCode: string;
  itemName: string;
  itemType: 'raw_material' | 'semi_finished' | 'finished_goods' | 'packaging';
  specification?: string;
  
  // 批次資訊
  batchInfo: {
    productionDate: Date;
    expiryDate?: Date;
    bestBeforeDate?: Date;
    
    manufacturer?: {
      code: string;
      name: string;
      lot?: string;
    };
    
    supplier?: {
      code: string;
      name: string;
      deliveryNote?: string;
      invoiceNo?: string;
    };
    
    quantity: {
      initial: number;
      current: number;
      reserved: number;
      available: number;
      unit: string;
    };
    
    status: 'active' | 'quarantine' | 'blocked' | 'expired' | 'consumed';
    
    location?: {
      warehouse: string;
      zone?: string;
      bin?: string;
      position?: string;
    };
  };
  
  // 品質資訊
  quality: {
    inspectionStatus: 'pending' | 'passed' | 'failed' | 'conditionally_passed';
    inspectionDate?: Date;
    inspector?: string;
    
    certificates?: {
      type: string;
      number: string;
      issueDate: Date;
      expiryDate?: Date;
      issuer: string;
      documentUrl?: string;
    }[];
    
    testResults?: {
      parameter: string;
      value: any;
      unit?: string;
      standard?: string;
      result: 'pass' | 'fail' | 'warning';
      testDate: Date;
      testMethod?: string;
    }[];
    
    defects?: {
      type: string;
      severity: 'critical' | 'major' | 'minor';
      quantity: number;
      description?: string;
      action?: string;
    }[];
  };
  
  // 追溯資訊
  traceability: {
    // 向上追溯 (原料來源)
    upstream?: {
      parentBatches?: {
        batchNo: string;
        itemCode: string;
        quantity: number;
        unit: string;
        consumedDate?: Date;
      }[];
      
      sourceDocs?: {
        type: 'purchase_order' | 'production_order' | 'transfer_order';
        docNo: string;
        date: Date;
        quantity: number;
      }[];
    };
    
    // 向下追溯 (使用去向)
    downstream?: {
      childBatches?: {
        batchNo: string;
        itemCode: string;
        quantity: number;
        unit: string;
        producedDate?: Date;
      }[];
      
      consumptionDocs?: {
        type: 'sales_order' | 'production_order' | 'transfer_order';
        docNo: string;
        date: Date;
        quantity: number;
        customer?: string;
      }[];
    };
    
    // 生產資訊
    production?: {
      workOrder?: string;
      productionLine?: string;
      shift?: string;
      operators?: string[];
      
      processParams?: {
        parameter: string;
        value: any;
        unit?: string;
        timestamp: Date;
      }[];
      
      equipment?: {
        machineId: string;
        machineName: string;
        calibrationStatus?: string;
      }[];
    };
  };
  
  // 交易歷史
  transactions: {
    id: string;
    type: 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'return';
    
    date: Date;
    quantity: number;
    unit: string;
    
    from?: {
      location?: string;
      batch?: string;
      supplier?: string;
    };
    
    to?: {
      location?: string;
      batch?: string;
      customer?: string;
    };
    
    reference?: {
      docType: string;
      docNo: string;
      lineNo?: number;
    };
    
    reason?: string;
    performedBy: string;
    
    balanceAfter: number;
  }[];
  
  // 合規性
  compliance?: {
    regulations?: {
      regulation: string;
      requirement: string;
      compliant: boolean;
      evidence?: string;
      validUntil?: Date;
    }[];
    
    certifications?: {
      type: 'organic' | 'halal' | 'kosher' | 'iso' | 'haccp' | 'other';
      certNo: string;
      issuedBy: string;
      validFrom: Date;
      validTo: Date;
      scope?: string;
    }[];
    
    audits?: {
      auditDate: Date;
      auditor: string;
      type: string;
      result: 'pass' | 'fail' | 'conditional';
      findings?: string;
      correctiveActions?: string;
    }[];
  };
  
  // 成本資訊
  costing?: {
    unitCost: number;
    totalCost: number;
    currency: string;
    
    breakdown?: {
      material: number;
      labor: number;
      overhead: number;
      other?: number;
    };
    
    landed?: {
      purchasePrice: number;
      freight?: number;
      customs?: number;
      handling?: number;
      other?: number;
    };
  };
  
  // 屬性
  attributes?: {
    [key: string]: any;
    // 農產品特定屬性
    harvest?: {
      date: Date;
      location?: string;
      weather?: string;
      yield?: number;
    };
    
    // 溫控產品
    temperature?: {
      required: { min: number; max: number; };
      history?: {
        timestamp: Date;
        value: number;
        location?: string;
      }[];
    };
    
    // 化學品
    hazmat?: {
      class: string;
      unNumber?: string;
      packingGroup?: string;
      flashPoint?: number;
      msds?: string;
    };
  };
  
  // 警示和備註
  alerts?: {
    type: 'expiry' | 'quality' | 'recall' | 'hold' | 'custom';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    createdAt: Date;
    createdBy: string;
    resolved?: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
  }[];
  
  // 系統資訊
  metadata: {
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
    version: number;
    
    // 區塊鏈追溯 (選配)
    blockchain?: {
      enabled: boolean;
      txHash?: string;
      blockNumber?: number;
      network?: string;
    };
  };
}

/**
 * 批號查詢條件
 */
export interface BatchQuery {
  // 基本查詢
  batchNo?: string;
  serialNo?: string;
  itemCode?: string;
  status?: string[];
  
  // 日期範圍
  productionDateFrom?: Date;
  productionDateTo?: Date;
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
  
  // 位置
  warehouse?: string;
  location?: string;
  
  // 品質
  inspectionStatus?: string[];
  hasDefects?: boolean;
  
  // 數量
  availableQtyMin?: number;
  availableQtyMax?: number;
  
  // 追溯
  parentBatch?: string;
  childBatch?: string;
  customer?: string;
  supplier?: string;
  
  // 合規
  certification?: string;
  regulation?: string;
  
  // 分頁
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 批號操作結果
 */
export interface BatchOperationResult {
  success: boolean;
  batchNo: string;
  operation: string;
  
  quantity?: number;
  newBalance?: number;
  
  transaction?: {
    id: string;
    type: string;
    date: Date;
  };
  
  warnings?: string[];
  errors?: string[];
  
  traceabilityUpdated?: boolean;
  costingUpdated?: boolean;
  
  notifications?: {
    recipient: string;
    type: string;
    sent: boolean;
  }[];
}