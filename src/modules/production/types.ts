export interface Workstation {
  id: string;
  stationCode: string;
  stationName: string;
  stationType: 'packaging' | 'sorting' | 'processing' | 'washing' | 'quality_check';
  location?: string;
  hourlyCapacity: number;
  maxOperators: number;
  minOperators: number;
  requiredSkills?: string[];
  equipmentList?: Equipment[];
  status: 'active' | 'maintenance' | 'idle' | 'broken';
  currentLoad?: number;
  efficiency?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  status: 'operational' | 'maintenance' | 'broken';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
}

export interface WorkOrder {
  id: string;
  workOrderNo: string;
  itemId: string;
  itemName?: string;
  plannedQuantity: number;
  completedQuantity: number;
  unitId: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  priority: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  qualityCheckRequired: boolean;
  qualityCheckStatus?: 'pending' | 'passed' | 'failed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionTask {
  id: string;
  taskNo: string;
  workOrderId: string;
  workstationId: string;
  plannedQuantity: number;
  completedQuantity: number;
  defectQuantity?: number;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  assignedOperators?: Operator[];
  status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
  qualityNotes?: string;
  createdAt: Date;
}

export interface Operator {
  id: string;
  employeeId: string;
  name: string;
  skills: string[];
  currentStation?: string;
  shiftId?: string;
  performanceScore?: number;
}

export interface ProductionMetrics {
  workstationId: string;
  date: Date;
  totalOutput: number;
  defectRate: number;
  efficiency: number;
  downtimeMinutes: number;
  oee: number; // Overall Equipment Effectiveness
  qualityRate: number;
  performanceRate: number;
  availabilityRate: number;
}

export interface QualityCheck {
  id: string;
  checkNo: string;
  workOrderId: string;
  taskId?: string;
  checkType: 'incoming' | 'in_process' | 'final';
  sampleSize: number;
  passedCount: number;
  failedCount: number;
  criteria: QualityCriteria[];
  result: 'pass' | 'fail' | 'conditional';
  notes?: string;
  checkedBy: string;
  checkedAt: Date;
  photoUrls?: string[];
}

export interface QualityCriteria {
  name: string;
  standard: string;
  actual?: string;
  passed: boolean;
  severity?: 'critical' | 'major' | 'minor';
}

export interface ProductionSchedule {
  id: string;
  scheduleDate: Date;
  shiftId: string;
  workstations: Array<{
    workstationId: string;
    tasks: ProductionTask[];
    operators: Operator[];
    utilization: number;
  }>;
  totalCapacity: number;
  plannedOutput: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed';
}

export interface DefectTracking {
  id: string;
  workOrderId: string;
  taskId: string;
  defectType: string;
  quantity: number;
  severity: 'critical' | 'major' | 'minor';
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
}

// Request/Response DTOs
export interface CreateWorkOrderRequest {
  itemId: string;
  plannedQuantity: number;
  unitId: string;
  plannedStart: Date;
  plannedEnd: Date;
  priority?: number;
  qualityCheckRequired?: boolean;
  notes?: string;
}

export interface UpdateTaskStatusRequest {
  status: 'ready' | 'in_progress' | 'completed' | 'cancelled';
  completedQuantity?: number;
  defectQuantity?: number;
  notes?: string;
  operatorIds?: string[];
}

export interface WorkstationMetricsQuery {
  workstationId?: string;
  dateFrom: Date;
  dateTo: Date;
  groupBy?: 'day' | 'week' | 'month';
  includeDefects?: boolean;
}

export interface ProductionDashboard {
  summary: {
    activeWorkOrders: number;
    completedToday: number;
    inProgressTasks: number;
    averageEfficiency: number;
    defectRate: number;
  };
  workstations: Array<{
    id: string;
    name: string;
    status: string;
    currentLoad: number;
    efficiency: number;
  }>;
  recentWorkOrders: WorkOrder[];
  alerts: Array<{
    type: 'delay' | 'quality' | 'maintenance' | 'capacity';
    message: string;
    severity: 'high' | 'medium' | 'low';
    timestamp: Date;
  }>;
}