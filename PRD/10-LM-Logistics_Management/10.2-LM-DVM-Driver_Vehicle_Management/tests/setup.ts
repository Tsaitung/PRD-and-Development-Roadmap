import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test data builders for LM-DVM module
export const testDataBuilders = {
  createTestDriver: (overrides = {}) => ({
    driver_id: 'DRV_TEST_001',
    employee_id: 'EMP_001',
    name: '測試司機',
    phone: '0912-345-678',
    email: 'driver001@test.com',
    license_number: 'DL-123456789',
    license_type: 'professional',
    license_expiry: new Date('2026-12-31'),
    hire_date: new Date('2020-01-15'),
    status: 'active',
    availability: 'available',
    current_route: null,
    assigned_vehicle: null,
    working_hours: {
      monday: '08:00-18:00',
      tuesday: '08:00-18:00',
      wednesday: '08:00-18:00',
      thursday: '08:00-18:00',
      friday: '08:00-18:00',
      saturday: '08:00-13:00',
      sunday: null,
    },
    skills: ['general_cargo', 'temperature_controlled', 'hazmat'],
    certifications: ['safety_training', 'defensive_driving'],
    emergency_contact: {
      name: '緊急聯絡人',
      phone: '0923-456-789',
      relationship: '配偶',
    },
    performance: {
      rating: 4.8,
      total_deliveries: 2450,
      on_time_rate: 95.5,
      accident_count: 0,
      violation_count: 0,
      customer_rating: 4.9,
    },
    created_at: new Date('2020-01-15'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestVehicle: (overrides = {}) => ({
    vehicle_id: 'VEH_TEST_001',
    plate_number: 'TPE-1234',
    vin: 'VIN123456789',
    type: 'small_truck',
    brand: 'Isuzu',
    model: 'ELF',
    year: 2020,
    color: '白色',
    status: 'active',
    availability: 'available',
    current_driver: null,
    current_route: null,
    specifications: {
      capacity_weight: 1500, // kg
      capacity_volume: 12, // m³
      fuel_type: 'diesel',
      fuel_capacity: 60, // liters
      fuel_efficiency: 8.5, // km/l
      max_speed: 110, // km/h
      dimensions: {
        length: 5.5, // meters
        width: 2.2,
        height: 2.8,
      },
    },
    features: ['gps', 'temperature_control', 'lift_gate'],
    insurance: {
      policy_number: 'INS-2025-001',
      provider: '保險公司A',
      expiry_date: new Date('2026-03-31'),
      coverage_type: 'comprehensive',
    },
    registration: {
      number: 'REG-2020-001',
      expiry_date: new Date('2025-12-31'),
      inspection_due: new Date('2025-09-30'),
    },
    maintenance: {
      last_service: new Date('2025-07-15'),
      next_service: new Date('2025-10-15'),
      mileage: 45000,
      service_history: [
        { date: '2025-07-15', type: 'regular', mileage: 45000, cost: 3500 },
        { date: '2025-04-15', type: 'regular', mileage: 40000, cost: 3200 },
      ],
    },
    tracking: {
      device_id: 'GPS_001',
      last_location: {
        latitude: 25.0330,
        longitude: 121.5654,
        timestamp: new Date('2025-08-20T10:00:00'),
      },
      is_online: true,
    },
    created_at: new Date('2020-03-01'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestDriverSchedule: (overrides = {}) => ({
    schedule_id: 'SCH_TEST_001',
    driver_id: 'DRV_TEST_001',
    date: new Date('2025-08-20'),
    shift: 'morning',
    start_time: '08:00',
    end_time: '18:00',
    status: 'scheduled',
    vehicle_id: 'VEH_TEST_001',
    route_ids: ['ROUTE_001', 'ROUTE_002'],
    break_times: [
      { start: '12:00', end: '13:00', type: 'lunch' },
      { start: '15:00', end: '15:15', type: 'rest' },
    ],
    actual_start: null,
    actual_end: null,
    overtime_hours: 0,
    notes: '正常排班',
    created_at: new Date('2025-08-19'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestVehicleAssignment: (overrides = {}) => ({
    assignment_id: 'ASSIGN_TEST_001',
    vehicle_id: 'VEH_TEST_001',
    driver_id: 'DRV_TEST_001',
    start_date: new Date('2025-08-20'),
    end_date: null,
    status: 'active',
    purpose: 'regular_delivery',
    mileage_start: 45000,
    mileage_end: null,
    fuel_start: 45,
    fuel_end: null,
    condition_start: 'good',
    condition_end: null,
    notes: '日常配送使用',
    created_by: 'MANAGER_001',
    created_at: new Date('2025-08-20T07:00:00'),
    updated_at: new Date('2025-08-20T07:00:00'),
    ...overrides,
  }),

  createTestDriverDocument: (overrides = {}) => ({
    document_id: 'DOC_TEST_001',
    driver_id: 'DRV_TEST_001',
    document_type: 'license',
    document_name: '駕駛執照',
    document_number: 'DL-123456789',
    issue_date: new Date('2020-01-01'),
    expiry_date: new Date('2026-12-31'),
    issuing_authority: '交通部',
    file_url: '/documents/driver/license_001.pdf',
    verification_status: 'verified',
    verified_by: 'HR_001',
    verified_at: new Date('2020-01-15'),
    reminder_days: 60,
    notes: '專業駕照',
    created_at: new Date('2020-01-15'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestVehicleExpense: (overrides = {}) => ({
    expense_id: 'EXP_TEST_001',
    vehicle_id: 'VEH_TEST_001',
    expense_type: 'fuel',
    amount: 2500,
    date: new Date('2025-08-20'),
    mileage: 45000,
    vendor: '加油站A',
    invoice_number: 'INV-2025-001',
    payment_method: 'company_card',
    driver_id: 'DRV_TEST_001',
    route_id: 'ROUTE_001',
    quantity: 50, // liters for fuel
    unit_price: 50,
    notes: '日常加油',
    approved: true,
    approved_by: 'MANAGER_001',
    approved_at: new Date('2025-08-20'),
    created_at: new Date('2025-08-20'),
    updated_at: new Date('2025-08-20'),
    ...overrides,
  }),

  createTestDriverLeave: (overrides = {}) => ({
    leave_id: 'LEAVE_TEST_001',
    driver_id: 'DRV_TEST_001',
    leave_type: 'annual',
    start_date: new Date('2025-08-25'),
    end_date: new Date('2025-08-27'),
    days: 3,
    reason: '年假',
    status: 'approved',
    substitute_driver: 'DRV_002',
    approved_by: 'MANAGER_001',
    approved_at: new Date('2025-08-18'),
    notes: '已安排代班司機',
    created_at: new Date('2025-08-15'),
    updated_at: new Date('2025-08-18'),
    ...overrides,
  }),

  createTestVehicleIncident: (overrides = {}) => ({
    incident_id: 'INC_TEST_001',
    vehicle_id: 'VEH_TEST_001',
    driver_id: 'DRV_TEST_001',
    incident_type: 'accident',
    incident_date: new Date('2025-08-15'),
    location: '台北市信義區測試路口',
    description: '輕微擦撞',
    damage_assessment: 'minor',
    repair_cost: 15000,
    insurance_claim: true,
    claim_number: 'CLAIM-2025-001',
    police_report: 'POLICE-2025-001',
    injuries: false,
    photos: ['/photos/incident_001_1.jpg', '/photos/incident_001_2.jpg'],
    witnesses: [
      { name: '目擊者A', phone: '0911-111-111' },
    ],
    status: 'resolved',
    resolved_date: new Date('2025-08-18'),
    created_at: new Date('2025-08-15'),
    updated_at: new Date('2025-08-18'),
    ...overrides,
  }),

  createTestDriverTraining: (overrides = {}) => ({
    training_id: 'TRAIN_TEST_001',
    driver_id: 'DRV_TEST_001',
    training_type: 'safety',
    training_name: '安全駕駛訓練',
    provider: '訓練機構A',
    start_date: new Date('2025-07-01'),
    end_date: new Date('2025-07-02'),
    hours: 16,
    status: 'completed',
    score: 92,
    certificate_number: 'CERT-2025-001',
    certificate_expiry: new Date('2027-07-01'),
    cost: 5000,
    notes: '定期安全訓練',
    created_at: new Date('2025-06-15'),
    updated_at: new Date('2025-07-02'),
    ...overrides,
  }),

  createTestFleetSummary: (overrides = {}) => ({
    summary_date: new Date('2025-08-20'),
    total_vehicles: 25,
    active_vehicles: 20,
    maintenance_vehicles: 3,
    inactive_vehicles: 2,
    total_drivers: 30,
    available_drivers: 22,
    on_route_drivers: 18,
    on_leave_drivers: 3,
    fleet_utilization: 85,
    average_mileage: 180, // per vehicle per day
    total_fuel_consumption: 450, // liters per day
    fuel_efficiency: 8.2, // km/l average
    maintenance_due: 5,
    documents_expiring: 8,
    performance_metrics: {
      on_time_delivery: 94.5,
      vehicle_downtime: 2.5,
      accident_rate: 0.5,
      fuel_cost_per_km: 6.5,
    },
    ...overrides,
  }),
};

// Mock API handlers
export const mockApiHandlers = {
  getDrivers: vi.fn(() => Promise.resolve({
    drivers: [testDataBuilders.createTestDriver()],
    total: 1,
    page: 1,
    limit: 20,
  })),

  getDriver: vi.fn((id) => Promise.resolve(
    testDataBuilders.createTestDriver({ driver_id: id })
  )),

  createDriver: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestDriver(data)
  )),

  updateDriver: vi.fn((id, data) => Promise.resolve({
    ...testDataBuilders.createTestDriver({ driver_id: id }),
    ...data,
  })),

  getVehicles: vi.fn(() => Promise.resolve({
    vehicles: [testDataBuilders.createTestVehicle()],
    total: 1,
    page: 1,
    limit: 20,
  })),

  getVehicle: vi.fn((id) => Promise.resolve(
    testDataBuilders.createTestVehicle({ vehicle_id: id })
  )),

  createVehicle: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestVehicle(data)
  )),

  updateVehicle: vi.fn((id, data) => Promise.resolve({
    ...testDataBuilders.createTestVehicle({ vehicle_id: id }),
    ...data,
  })),

  getDriverSchedule: vi.fn((driverId, date) => Promise.resolve(
    testDataBuilders.createTestDriverSchedule({ driver_id: driverId, date })
  )),

  createSchedule: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestDriverSchedule(data)
  )),

  assignVehicle: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestVehicleAssignment(data)
  )),

  getFleetSummary: vi.fn(() => Promise.resolve(
    testDataBuilders.createTestFleetSummary()
  )),
};

// Global test setup
beforeAll(() => {
  // Setup any global test configuration
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});