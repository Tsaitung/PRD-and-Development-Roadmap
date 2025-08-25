/**
 * 供應商實體
 * PM-SRM Supplier Relationship Management
 * 
 * 管理供應商資訊、評估、合約和績效
 */

export interface SupplierEntity {
  // 基本資訊
  id: string;
  supplierCode: string;
  supplierName: string;
  
  // 公司資訊
  companyInfo: {
    legalName: string;
    registrationNo: string;
    taxId: string;
    
    type: 'manufacturer' | 'distributor' | 'trader' | 'service_provider' | 'farmer';
    category: 'strategic' | 'preferred' | 'approved' | 'conditional' | 'blacklisted';
    
    established?: Date;
    capital?: number;
    employees?: number;
    
    website?: string;
    description?: string;
    
    industry?: string[];
    products?: string[];
    services?: string[];
  };
  
  // 聯絡資訊
  contact: {
    primary: {
      name: string;
      title: string;
      phone: string;
      mobile?: string;
      email: string;
      department?: string;
    };
    
    secondary?: {
      name: string;
      title: string;
      phone: string;
      email: string;
    };
    
    address: {
      country: string;
      state?: string;
      city: string;
      district?: string;
      street: string;
      postalCode: string;
      
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    
    billingAddress?: {
      country: string;
      city: string;
      street: string;
      postalCode: string;
    };
    
    shippingAddress?: {
      country: string;
      city: string;
      street: string;
      postalCode: string;
    };
  };
  
  // 資格認證
  qualification: {
    status: 'pending' | 'qualified' | 'suspended' | 'disqualified';
    
    certifications: {
      type: 'iso9001' | 'iso14001' | 'organic' | 'haccp' | 'halal' | 'other';
      number: string;
      issuedBy: string;
      issuedDate: Date;
      expiryDate: Date;
      scope?: string;
      documentUrl?: string;
      verified: boolean;
    }[];
    
    licenses?: {
      type: string;
      number: string;
      issuedBy: string;
      validFrom: Date;
      validTo: Date;
      scope?: string;
    }[];
    
    audits?: {
      auditDate: Date;
      auditType: 'initial' | 'periodic' | 'special';
      auditor: string;
      score: number;
      result: 'pass' | 'conditional' | 'fail';
      findings?: string;
      correctiveActions?: string;
      nextAudit?: Date;
    }[];
    
    documents?: {
      type: string;
      name: string;
      uploadDate: Date;
      expiryDate?: Date;
      url: string;
      verified: boolean;
    }[];
  };
  
  // 商業條款
  commercialTerms: {
    currency: string;
    paymentTerms: string;  // e.g., "Net 30", "2/10 Net 30"
    paymentMethods: string[];
    
    creditLimit?: number;
    creditRating?: string;
    
    incoterms?: string;  // e.g., "FOB", "CIF", "DDP"
    
    minimumOrderValue?: number;
    minimumOrderQuantity?: number;
    
    leadTime: {
      standard: number;  // days
      express?: number;
      bulk?: number;
    };
    
    pricing?: {
      type: 'fixed' | 'tiered' | 'negotiated' | 'market';
      priceList?: {
        itemCode: string;
        price: number;
        unit: string;
        validFrom: Date;
        validTo?: Date;
        moq?: number;
      }[];
      
      discounts?: {
        type: 'volume' | 'payment' | 'seasonal' | 'promotional';
        description: string;
        value: number;  // percentage or amount
        conditions?: string;
      }[];
    };
    
    returnPolicy?: {
      allowed: boolean;
      period: number;  // days
      conditions: string;
      restockingFee?: number;
    };
  };
  
  // 績效評估
  performance: {
    rating: {
      overall: number;  // 0-100
      quality: number;
      delivery: number;
      price: number;
      service: number;
      compliance: number;
      
      trend: 'improving' | 'stable' | 'declining';
      lastUpdated: Date;
    };
    
    metrics: {
      // 品質指標
      quality: {
        defectRate: number;  // percentage
        returnRate: number;
        acceptanceRate: number;
        complaintCount: number;
      };
      
      // 交貨指標
      delivery: {
        onTimeRate: number;  // percentage
        fulfillmentRate: number;
        averageLeadTime: number;
        lateDeliveries: number;
      };
      
      // 服務指標
      service: {
        responseTime: number;  // hours
        issueResolutionTime: number;
        communicationScore: number;
        flexibilityScore: number;
      };
      
      // 財務指標
      financial: {
        totalSpend: number;
        averageOrderValue: number;
        paymentCompliance: number;
        costSavings?: number;
      };
    };
    
    scorecards?: {
      period: string;  // e.g., "2025-Q1"
      scores: {
        category: string;
        weight: number;
        score: number;
        maxScore: number;
      }[];
      totalScore: number;
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
      comments?: string;
      evaluatedBy: string;
      evaluatedDate: Date;
    }[];
    
    incidents?: {
      date: Date;
      type: 'quality' | 'delivery' | 'service' | 'compliance' | 'other';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      impact?: string;
      resolution?: string;
      preventiveAction?: string;
    }[];
  };
  
  // 合約管理
  contracts?: {
    contractId: string;
    contractNo: string;
    type: 'purchase' | 'framework' | 'service' | 'consignment';
    
    status: 'draft' | 'active' | 'expired' | 'terminated';
    
    period: {
      startDate: Date;
      endDate: Date;
      renewalDate?: Date;
      autoRenew?: boolean;
    };
    
    value: {
      total: number;
      committed?: number;
      spent: number;
      remaining: number;
      currency: string;
    };
    
    terms: {
      paymentTerms: string;
      deliveryTerms: string;
      warrantyPeriod?: number;
      liabilityLimit?: number;
      penaltyClauses?: string[];
    };
    
    items?: {
      itemCode: string;
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
    }[];
    
    milestones?: {
      description: string;
      dueDate: Date;
      value: number;
      status: 'pending' | 'completed' | 'delayed';
      completedDate?: Date;
    }[];
    
    documents?: {
      type: string;
      name: string;
      url: string;
      uploadDate: Date;
    }[];
    
    renewalHistory?: {
      renewalDate: Date;
      previousEndDate: Date;
      newEndDate: Date;
      changes?: string;
      approvedBy: string;
    }[];
  }[];
  
  // 產品目錄
  catalog?: {
    itemCode: string;
    supplierItemCode?: string;
    
    description: string;
    category: string;
    
    specifications?: {
      [key: string]: any;
    };
    
    availability: 'in_stock' | 'made_to_order' | 'seasonal' | 'discontinued';
    
    pricing: {
      listPrice: number;
      negotiatedPrice?: number;
      unit: string;
      currency: string;
      validUntil?: Date;
    };
    
    leadTime: number;
    moq?: number;
    packSize?: number;
    
    quality?: {
      standard?: string;
      certification?: string;
      shelfLife?: number;
    };
    
    preferred: boolean;
    approved: boolean;
    
    lastUpdated: Date;
  }[];
  
  // 交易歷史
  transactions?: {
    summary: {
      totalOrders: number;
      totalValue: number;
      averageOrderValue: number;
      lastOrderDate?: Date;
      
      yearToDate: number;
      lastYear: number;
      
      topProducts?: {
        itemCode: string;
        quantity: number;
        value: number;
      }[];
    };
    
    recentOrders?: {
      orderNo: string;
      orderDate: Date;
      deliveryDate?: Date;
      value: number;
      status: string;
      items: number;
    }[];
    
    trends?: {
      period: string;
      orderCount: number;
      orderValue: number;
      growth: number;
    }[];
  };
  
  // 溝通記錄
  communications?: {
    id: string;
    date: Date;
    type: 'email' | 'phone' | 'meeting' | 'visit';
    subject: string;
    participants: string[];
    summary?: string;
    followUp?: string;
    nextAction?: {
      action: string;
      dueDate: Date;
      responsible: string;
    };
    attachments?: string[];
  }[];
  
  // 風險管理
  riskAssessment?: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    
    factors: {
      financial: {
        risk: 'low' | 'medium' | 'high';
        creditScore?: number;
        bankruptcyRisk?: boolean;
        paymentHistory?: string;
      };
      
      operational: {
        risk: 'low' | 'medium' | 'high';
        singleSource?: boolean;
        alternativeSuppliers?: number;
        dependencyLevel?: 'low' | 'medium' | 'high';
      };
      
      compliance: {
        risk: 'low' | 'medium' | 'high';
        regulatoryIssues?: boolean;
        ethicalConcerns?: boolean;
        environmentalImpact?: string;
      };
      
      geographic: {
        risk: 'low' | 'medium' | 'high';
        politicalStability?: string;
        naturalDisasters?: boolean;
        logistics?: string;
      };
      
      quality: {
        risk: 'low' | 'medium' | 'high';
        historicalIssues?: number;
        certificationStatus?: string;
      };
    };
    
    mitigation?: {
      strategy: string;
      actions: string[];
      contingencyPlan?: string;
      reviewDate?: Date;
    };
    
    lastAssessment: Date;
    nextReview: Date;
  };
  
  // 整合資訊
  integration?: {
    edi?: {
      enabled: boolean;
      protocol: string;
      endpoint?: string;
      format?: string;
    };
    
    api?: {
      enabled: boolean;
      endpoint?: string;
      authentication?: string;
      version?: string;
    };
    
    portal?: {
      enabled: boolean;
      url?: string;
      username?: string;
    };
    
    marketplace?: {
      platform: string;
      storeId?: string;
      rating?: number;
    }[];
  };
  
  // 系統資訊
  metadata: {
    status: 'active' | 'inactive' | 'blocked' | 'pending';
    
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
    
    approvedAt?: Date;
    approvedBy?: string;
    
    tags?: string[];
    notes?: string;
    
    customFields?: {
      [key: string]: any;
    };
  };
}

/**
 * 供應商查詢條件
 */
export interface SupplierQuery {
  // 基本查詢
  supplierCode?: string;
  supplierName?: string;
  category?: string[];
  type?: string[];
  status?: string[];
  
  // 地區
  country?: string;
  city?: string;
  
  // 認證
  certification?: string;
  qualified?: boolean;
  
  // 績效
  minRating?: number;
  maxRating?: number;
  
  // 產品
  productCategory?: string;
  itemCode?: string;
  
  // 風險
  riskLevel?: string[];
  
  // 分頁
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 供應商評估結果
 */
export interface SupplierEvaluation {
  supplierId: string;
  evaluationId: string;
  
  period: {
    from: Date;
    to: Date;
  };
  
  scores: {
    category: string;
    weight: number;
    score: number;
    comments?: string;
  }[];
  
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  recommendation: 'maintain' | 'develop' | 'improve' | 'replace';
  actionItems?: string[];
  
  evaluatedBy: string;
  evaluatedDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
}