// Basic Data Maintenance Module Types

export interface MasterDataEntity {
  id: string;
  entityType: 'vendor' | 'item' | 'customer' | 'location' | 'unit' | 'currency' | 'tax';
  code: string;
  name: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'archived';
  validFrom: Date;
  validTo?: Date;
  attributes: Record<string, any>;
  metadata: EntityMetadata;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface EntityMetadata {
  source: 'manual' | 'import' | 'integration' | 'migration';
  importBatch?: string;
  externalId?: string;
  externalSystem?: string;
  tags?: string[];
  customFields?: CustomField[];
  changeHistory?: ChangeRecord[];
}

export interface CustomField {
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  fieldValue: any;
  isRequired: boolean;
  validation?: FieldValidation;
}

export interface FieldValidation {
  pattern?: string;
  min?: number;
  max?: number;
  options?: any[];
  customValidator?: string;
}

export interface ChangeRecord {
  changeId: string;
  changeType: 'create' | 'update' | 'delete' | 'merge' | 'split';
  changedBy: string;
  changedAt: Date;
  changedFields: ChangedField[];
  reason?: string;
  approvedBy?: string;
}

export interface ChangedField {
  fieldName: string;
  oldValue: any;
  newValue: any;
}

export interface Vendor extends MasterDataEntity {
  vendorType: 'supplier' | 'manufacturer' | 'distributor' | 'service_provider';
  taxId: string;
  registrationNo?: string;
  contacts: VendorContact[];
  addresses: VendorAddress[];
  bankAccounts: BankAccount[];
  certifications?: Certification[];
  paymentTerms: string;
  creditLimit: number;
  currency: string;
  rating?: number;
  isPreferred: boolean;
  leadTime: number; // in days
  minimumOrderValue?: number;
  website?: string;
  notes?: string;
}

export interface VendorContact {
  id: string;
  name: string;
  title?: string;
  department?: string;
  phone: string;
  mobile?: string;
  email: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface VendorAddress {
  id: string;
  addressType: 'billing' | 'shipping' | 'both';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  accountType: 'checking' | 'savings' | 'credit';
  isDefault: boolean;
  isVerified: boolean;
}

export interface Certification {
  id: string;
  certificationType: string;
  certificationNo: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedDate?: Date;
}

export interface Item extends MasterDataEntity {
  itemType: 'raw_material' | 'finished_good' | 'semi_finished' | 'consumable' | 'service';
  itemGroup: string;
  baseUnit: string;
  alternateUnits?: UnitConversion[];
  dimensions?: ItemDimensions;
  weight?: ItemWeight;
  specifications?: ItemSpecification[];
  barcodes?: string[];
  hsCodes?: string[];
  isInventoryItem: boolean;
  isPurchaseItem: boolean;
  isSalesItem: boolean;
  isPerishable: boolean;
  shelfLife?: number; // in days
  reorderPoint?: number;
  reorderQuantity?: number;
  safetyStock?: number;
  leadTime?: number; // in days
  costingMethod: 'fifo' | 'lifo' | 'average' | 'standard';
  standardCost?: number;
  lastPurchasePrice?: number;
  averageCost?: number;
  sellingPrice?: number;
  taxCategory?: string;
  images?: string[];
}

export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  isBaseUnit: boolean;
}

export interface ItemDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
  volume?: number;
}

export interface ItemWeight {
  gross: number;
  net: number;
  unit: string;
}

export interface ItemSpecification {
  specName: string;
  specValue: string;
  unit?: string;
  isKeySpec: boolean;
}

export interface Customer extends MasterDataEntity {
  customerType: 'individual' | 'corporate' | 'government' | 'nonprofit';
  customerGroup?: string;
  taxId?: string;
  registrationNo?: string;
  contacts: CustomerContact[];
  addresses: CustomerAddress[];
  creditInfo?: CreditInfo;
  paymentTerms: string;
  creditLimit: number;
  currency: string;
  priceList?: string;
  discountGroup?: string;
  salesPerson?: string;
  territory?: string;
  rating?: number;
  loyaltyPoints?: number;
  isVIP: boolean;
  blacklisted: boolean;
  blacklistReason?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;
  preferences?: CustomerPreferences;
  notes?: string;
}

export interface CustomerContact {
  id: string;
  name: string;
  title?: string;
  department?: string;
  phone: string;
  mobile?: string;
  email: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  isBilling: boolean;
  isActive: boolean;
}

export interface CustomerAddress {
  id: string;
  addressType: 'billing' | 'shipping' | 'both';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface CreditInfo {
  creditScore?: number;
  creditAgency?: string;
  lastChecked?: Date;
  paymentHistory: PaymentHistorySummary;
  outstandingAmount: number;
  overdueAmount: number;
}

export interface PaymentHistorySummary {
  onTimePayments: number;
  latePayments: number;
  averageDaysLate: number;
  lastPaymentDate?: Date;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface CustomerPreferences {
  communicationChannel: 'email' | 'phone' | 'sms' | 'whatsapp';
  language: string;
  currency: string;
  invoiceFormat: 'pdf' | 'excel' | 'xml';
  statementFrequency: 'monthly' | 'quarterly' | 'yearly';
  marketingOptIn: boolean;
}

export interface Location extends MasterDataEntity {
  locationType: 'warehouse' | 'store' | 'plant' | 'office' | 'distribution_center';
  parentLocationId?: string;
  address: LocationAddress;
  capacity?: LocationCapacity;
  operatingHours?: OperatingHours[];
  manager?: string;
  contactNumber: string;
  email?: string;
  facilities?: string[];
  zones?: LocationZone[];
  isActive: boolean;
  canShip: boolean;
  canReceive: boolean;
  canStore: boolean;
  canManufacture: boolean;
}

export interface LocationAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface LocationCapacity {
  totalArea: number;
  areaUnit: string;
  storageCapacity: number;
  capacityUnit: string;
  currentUtilization: number; // percentage
  maxPallets?: number;
  maxContainers?: number;
}

export interface OperatingHours {
  dayOfWeek: number; // 0-6
  openTime: string;
  closeTime: string;
  isHoliday: boolean;
}

export interface LocationZone {
  id: string;
  zoneName: string;
  zoneType: 'storage' | 'picking' | 'packing' | 'staging' | 'quarantine';
  capacity: number;
  currentOccupancy: number;
  temperatureControlled?: boolean;
  temperature?: TemperatureRange;
  hazmatApproved?: boolean;
}

export interface TemperatureRange {
  min: number;
  max: number;
  unit: 'celsius' | 'fahrenheit';
}

export interface UnitOfMeasure extends MasterDataEntity {
  unitCategory: 'length' | 'weight' | 'volume' | 'area' | 'quantity' | 'time' | 'temperature';
  symbol: string;
  conversionToBase: number;
  baseUnit?: string;
  decimalPlaces: number;
  isBaseUnit: boolean;
  isActive: boolean;
}

export interface Currency extends MasterDataEntity {
  currencyCode: string; // ISO 4217
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  exchangeRate: number; // to base currency
  baseCurrency: boolean;
  lastUpdated: Date;
  isActive: boolean;
}

export interface TaxConfiguration extends MasterDataEntity {
  taxType: 'vat' | 'gst' | 'sales_tax' | 'excise' | 'customs' | 'other';
  taxRate: number;
  taxAccount?: string;
  applicableOn: 'sales' | 'purchase' | 'both';
  calculationMethod: 'exclusive' | 'inclusive';
  taxComponents?: TaxComponent[];
  exemptions?: TaxExemption[];
  effectiveFrom: Date;
  effectiveTo?: Date;
  jurisdiction?: string;
  isCompound: boolean;
  isActive: boolean;
}

export interface TaxComponent {
  componentName: string;
  componentRate: number;
  account?: string;
  sequence: number;
}

export interface TaxExemption {
  exemptionType: string;
  conditions: Record<string, any>;
  validFrom: Date;
  validTo?: Date;
}

// Data Quality and Governance
export interface DataQualityRule {
  id: string;
  ruleName: string;
  entityType: string;
  fieldName: string;
  ruleType: 'required' | 'unique' | 'format' | 'range' | 'reference' | 'custom';
  condition: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  isActive: boolean;
}

export interface DataImportTemplate {
  id: string;
  templateName: string;
  entityType: string;
  fileFormat: 'csv' | 'excel' | 'json' | 'xml';
  mappings: FieldMapping[];
  validations: DataQualityRule[];
  transformations?: DataTransformation[];
  sampleFile?: string;
  createdAt: Date;
  createdBy: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  isRequired: boolean;
  defaultValue?: any;
  transformation?: string;
}

export interface DataTransformation {
  field: string;
  transformationType: 'uppercase' | 'lowercase' | 'trim' | 'replace' | 'format' | 'calculate' | 'custom';
  parameters?: Record<string, any>;
  sequence: number;
}

export interface DataDeduplication {
  id: string;
  entityType: string;
  matchingRules: MatchingRule[];
  mergeStrategy: 'master_wins' | 'most_recent' | 'most_complete' | 'manual';
  lastRun?: Date;
  duplicatesFound?: number;
  duplicatesMerged?: number;
}

export interface MatchingRule {
  fieldName: string;
  matchType: 'exact' | 'fuzzy' | 'phonetic' | 'contains';
  weight: number;
  threshold?: number;
}

// Request/Response Types
export interface CreateMasterDataRequest {
  entityType: string;
  code?: string;
  name: string;
  description?: string;
  category?: string;
  attributes: Record<string, any>;
  validFrom?: Date;
  validTo?: Date;
}

export interface UpdateMasterDataRequest {
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  attributes?: Record<string, any>;
  validTo?: Date;
}

export interface ImportDataRequest {
  templateId: string;
  file: Buffer;
  fileName: string;
  validateOnly?: boolean;
  updateExisting?: boolean;
  skipErrors?: boolean;
}

export interface ImportDataResponse {
  batchId: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  errors?: ImportError[];
  warnings?: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  warning: string;
}

export interface MasterDataSearchFilter {
  entityType?: string;
  search?: string;
  category?: string[];
  status?: string[];
  createdFrom?: Date;
  createdTo?: Date;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}