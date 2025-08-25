# WMS Batch Tracking System (批號追溯系統)

## Overview

The WMS Batch Tracking System provides comprehensive batch and serial number management capabilities for the 菜蟲農食 ERP System. It enables full traceability from raw materials through production to final customer delivery.

## Features

### Core Capabilities

1. **Batch Management**
   - Create and manage batch numbers
   - Support for serial numbers
   - Automatic batch number generation
   - Multi-level batch hierarchy

2. **Traceability**
   - Forward tracing (upstream to raw materials)
   - Backward tracing (downstream to customers)
   - Multi-level genealogy tracking
   - Complete audit trail

3. **Batch Operations**
   - Issue/receive batches
   - Transfer between locations
   - Merge multiple batches
   - Split batches
   - Status management

4. **Quality & Compliance**
   - Quality inspection tracking
   - Certificate management
   - Regulatory compliance
   - Expiry date monitoring

5. **Reporting**
   - Traceability reports
   - Batch history
   - Transaction logs
   - Compliance documentation

## API Endpoints

### Batch Management

#### Create Batch
```http
POST /api/wms/batches
Content-Type: application/json

{
  "itemCode": "VEG-001",
  "itemName": "有機蔬菜",
  "itemType": "raw_material",
  "specification": "500g/包",
  "batchInfo": {
    "productionDate": "2025-01-15",
    "expiryDate": "2025-01-25",
    "quantity": {
      "initial": 1000,
      "unit": "PCS"
    },
    "supplier": {
      "code": "SUP-001",
      "name": "有機農場A",
      "deliveryNote": "DN-2025-001"
    },
    "location": {
      "warehouse": "WH-01",
      "zone": "A",
      "bin": "A-01-01"
    }
  }
}
```

#### Query Batches
```http
GET /api/wms/batches?status=active&itemCode=VEG-001&page=1&limit=20
```

#### Get Batch Detail
```http
GET /api/wms/batches/{batchNo}
```

### Batch Operations

#### Issue Batch
```http
POST /api/wms/batches/{batchNo}/issue
Content-Type: application/json

{
  "quantity": 200,
  "reference": {
    "docType": "sales_order",
    "docNo": "SO-2025-001",
    "customer": "CUST-001"
  }
}
```

#### Receive Batch
```http
POST /api/wms/batches/{batchNo}/receive
Content-Type: application/json

{
  "quantity": 100,
  "reference": {
    "docType": "purchase_order",
    "docNo": "PO-2025-001"
  }
}
```

#### Transfer Batch
```http
POST /api/wms/batches/{batchNo}/transfer
Content-Type: application/json

{
  "quantity": 500,
  "fromLocation": "WH-01-A-01",
  "toLocation": "WH-02-B-01"
}
```

#### Merge Batches
```http
POST /api/wms/batches/merge
Content-Type: application/json

{
  "sourceBatches": ["BATCH-001", "BATCH-002", "BATCH-003"],
  "targetBatchNo": "MERGED-BATCH-001"
}
```

#### Split Batch
```http
POST /api/wms/batches/{batchNo}/split
Content-Type: application/json

{
  "splits": [
    { "quantity": 300, "newBatchNo": "SPLIT-001" },
    { "quantity": 200, "newBatchNo": "SPLIT-002" },
    { "quantity": 100 }
  ]
}
```

### Status Management

#### Update Batch Status
```http
PUT /api/wms/batches/{batchNo}/status
Content-Type: application/json

{
  "status": "quarantine",
  "reason": "Quality inspection pending"
}
```

Status values:
- `active` - Available for use
- `quarantine` - Under quality review
- `blocked` - Cannot be used
- `expired` - Past expiry date
- `consumed` - Fully consumed

### Traceability

#### Trace Upstream (to Raw Materials)
```http
GET /api/wms/batches/{batchNo}/trace-upstream?levels=3
```

#### Trace Downstream (to Customers)
```http
GET /api/wms/batches/{batchNo}/trace-downstream?levels=3
```

#### Generate Traceability Report
```http
GET /api/wms/batches/{batchNo}/traceability-report
```

### Maintenance

#### Check Expired Batches
```http
POST /api/wms/batches/check-expiry
```

## Data Models

### BatchEntity
The main batch entity contains:
- Basic information (batch number, item details)
- Batch information (dates, quantities, location)
- Quality information (inspection, certificates, test results)
- Traceability (upstream/downstream relationships)
- Transaction history
- Compliance data
- Cost information
- Custom attributes

### Key Relationships
```
Raw Material Batch
        ↓
   Production Batch
        ↓
  Finished Goods Batch
        ↓
   Customer Delivery
```

## Implementation Details

### Architecture
- **Service Layer**: `BatchTrackingService` handles business logic
- **Controller Layer**: `BatchTrackingController` manages HTTP requests
- **Entity Layer**: `BatchEntity` defines data structures
- **Route Layer**: Express routes for API endpoints

### Event-Driven Updates
The system emits events for key operations:
- `batch:created` - New batch created
- `batch:issued` - Batch issued
- `batch:received` - Batch received
- `batch:transferred` - Batch transferred
- `batch:statusChanged` - Status updated

### Data Storage
Currently using in-memory storage with:
- Primary index by batch number
- Secondary index by item code
- Serial number index for unique tracking

### Security Features
- Input validation on all endpoints
- Quantity checks before operations
- Status verification
- Expiry date monitoring
- Audit trail for all transactions

## Usage Examples

### Example 1: Track a Product Recall
```javascript
// 1. Identify affected batch
const batch = await getBatchDetail('BATCH-2025-001');

// 2. Trace downstream to find customers
const downstream = await traceDownstream('BATCH-2025-001', 5);

// 3. Block the batch
await updateBatchStatus('BATCH-2025-001', 'blocked', 'Product recall');

// 4. Generate report
const report = await generateTraceabilityReport('BATCH-2025-001');
```

### Example 2: Merge Production Batches
```javascript
// Merge multiple small batches into one
const result = await mergeBatches(
  ['SMALL-001', 'SMALL-002', 'SMALL-003'],
  'LARGE-001'
);

// The new batch maintains traceability to all source batches
```

### Example 3: Quality Control Hold
```javascript
// Put batch on hold for inspection
await updateBatchStatus('BATCH-2025-002', 'quarantine', 'QC inspection required');

// After inspection passes
await updateBatchStatus('BATCH-2025-002', 'active', 'QC passed');
```

## Testing

Run the test suite:
```bash
# Unit tests
npm run test:unit -- batch-tracking

# Integration tests
npm run test:integration -- batch-tracking

# All tests
npm test
```

## Performance Considerations

1. **Indexing**: Multiple indexes for fast lookups
2. **Pagination**: All list queries support pagination
3. **Caching**: Consider Redis for production
4. **Batch Processing**: Bulk operations for efficiency

## Future Enhancements

1. **Blockchain Integration**
   - Immutable audit trail
   - Smart contracts for compliance
   - Distributed ledger for supply chain

2. **AI/ML Features**
   - Predictive expiry alerts
   - Optimal batch sizing
   - Quality prediction

3. **Advanced Analytics**
   - Batch performance metrics
   - Cost analysis
   - Yield optimization

4. **Integration Points**
   - RFID/Barcode scanning
   - IoT sensors for temperature
   - ERP modules integration

## Compliance & Standards

The system supports:
- GS1 standards for batch numbering
- FDA food traceability requirements
- ISO 22000 food safety management
- HACCP compliance tracking
- Organic certification tracking

## Support

For issues or questions:
- Documentation: `/docs/wms`
- API Reference: `/api/wms/docs`
- Support: wms-support@tsaitung.com

---

**Version**: 1.0.0  
**Last Updated**: 2025-08-25  
**Module**: WMS-BTM (Warehouse Management System - Batch Tracking Management)