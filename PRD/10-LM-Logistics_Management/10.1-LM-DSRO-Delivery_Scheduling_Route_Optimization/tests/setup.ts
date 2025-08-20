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

// Test data builders for LM-DSRO module
export const testDataBuilders = {
  createTestDeliveryRoute: (overrides = {}) => ({
    route_id: 'ROUTE_TEST_001',
    route_number: 'RT-20250820-001',
    route_date: new Date('2025-08-20'),
    driver_id: 'DRV_001',
    driver_name: '張司機',
    vehicle_id: 'VEH_001',
    vehicle_number: 'TPE-1234',
    status: 'planned',
    total_stops: 8,
    completed_stops: 0,
    total_distance: 45.5,
    estimated_time: 240, // minutes
    actual_time: null,
    start_location: '北區配送中心',
    end_location: '北區配送中心',
    optimization_score: 92,
    fuel_estimate: 8.5,
    created_at: new Date('2025-08-20T06:00:00'),
    updated_at: new Date('2025-08-20T06:00:00'),
    ...overrides,
  }),

  createTestDeliveryStop: (overrides = {}) => ({
    stop_id: 'STOP_TEST_001',
    route_id: 'ROUTE_TEST_001',
    order_id: 'ORD_001',
    stop_sequence: 1,
    customer_id: 'CUS_001',
    customer_name: '客戶A',
    delivery_address: '台北市信義區測試路100號',
    delivery_time_window: '09:00-12:00',
    estimated_arrival: new Date('2025-08-20T09:30:00'),
    actual_arrival: null,
    estimated_duration: 15, // minutes
    actual_duration: null,
    packages: 3,
    weight: 25.5, // kg
    volume: 0.8, // m³
    status: 'pending',
    notes: '請按門鈴',
    signature_required: true,
    photo_required: false,
    latitude: 25.0330,
    longitude: 121.5654,
    ...overrides,
  }),

  createTestOptimizationRequest: (overrides = {}) => ({
    request_id: 'OPT_TEST_001',
    optimization_date: new Date('2025-08-20'),
    warehouse_id: 'WH_001',
    available_drivers: 5,
    available_vehicles: 5,
    total_orders: 40,
    total_stops: 38,
    constraints: {
      max_route_distance: 100,
      max_route_duration: 480,
      max_stops_per_route: 15,
      vehicle_capacity_weight: 1000,
      vehicle_capacity_volume: 10,
      time_window_flexibility: 30,
    },
    optimization_goals: ['minimize_distance', 'maximize_on_time', 'balance_routes'],
    status: 'pending',
    ...overrides,
  }),

  createTestOptimizationResult: (overrides = {}) => ({
    result_id: 'OPT_RESULT_001',
    request_id: 'OPT_TEST_001',
    status: 'completed',
    routes_created: 5,
    total_distance: 225.5,
    total_duration: 1200,
    average_utilization: 85,
    on_time_probability: 94,
    cost_estimate: 2500,
    savings_percentage: 18,
    optimization_time: 2.5, // seconds
    routes: [
      {
        route_id: 'ROUTE_OPT_001',
        driver_id: 'DRV_001',
        vehicle_id: 'VEH_001',
        stops: 8,
        distance: 45.5,
        duration: 240,
        utilization: 88,
      },
    ],
    warnings: [],
    created_at: new Date('2025-08-20T06:05:00'),
    ...overrides,
  }),

  createTestDriver: (overrides = {}) => ({
    driver_id: 'DRV_TEST_001',
    driver_name: '測試司機',
    employee_id: 'EMP_001',
    license_number: 'DL-123456',
    license_expiry: new Date('2026-12-31'),
    phone: '0912-345-678',
    status: 'available',
    current_location: null,
    assigned_vehicle: null,
    today_routes: 0,
    today_distance: 0,
    today_deliveries: 0,
    rating: 4.8,
    experience_years: 5,
    vehicle_types: ['small_truck', 'van'],
    zones: ['north', 'central'],
    ...overrides,
  }),

  createTestVehicle: (overrides = {}) => ({
    vehicle_id: 'VEH_TEST_001',
    vehicle_number: 'TPE-5678',
    vehicle_type: 'small_truck',
    brand: 'Isuzu',
    model: 'ELF',
    year: 2020,
    capacity_weight: 1500, // kg
    capacity_volume: 12, // m³
    fuel_type: 'diesel',
    fuel_efficiency: 8.5, // km/l
    status: 'available',
    current_driver: null,
    current_location: '北區配送中心',
    mileage: 45000,
    last_maintenance: new Date('2025-07-15'),
    next_maintenance: new Date('2025-10-15'),
    insurance_expiry: new Date('2026-03-31'),
    gps_enabled: true,
    temperature_controlled: false,
    ...overrides,
  }),

  createTestDeliveryConstraint: (overrides = {}) => ({
    constraint_id: 'CONST_TEST_001',
    constraint_type: 'time_window',
    entity_type: 'customer',
    entity_id: 'CUS_001',
    constraint_value: {
      preferred_window: '09:00-12:00',
      hard_constraint: true,
      penalty_weight: 10,
    },
    active: true,
    priority: 1,
    notes: '客戶要求上午送達',
    ...overrides,
  }),

  createTestRouteTracking: (overrides = {}) => ({
    tracking_id: 'TRACK_TEST_001',
    route_id: 'ROUTE_TEST_001',
    timestamp: new Date('2025-08-20T10:00:00'),
    latitude: 25.0330,
    longitude: 121.5654,
    speed: 35, // km/h
    heading: 90, // degrees
    accuracy: 10, // meters
    status: 'on_route',
    current_stop: 'STOP_002',
    next_stop: 'STOP_003',
    distance_to_next: 2.5, // km
    eta_next_stop: new Date('2025-08-20T10:15:00'),
    events: [],
    ...overrides,
  }),

  createTestDeliveryEvent: (overrides = {}) => ({
    event_id: 'EVENT_TEST_001',
    route_id: 'ROUTE_TEST_001',
    stop_id: 'STOP_TEST_001',
    event_type: 'arrival',
    event_time: new Date('2025-08-20T09:28:00'),
    location: {
      latitude: 25.0330,
      longitude: 121.5654,
      address: '台北市信義區測試路100號',
    },
    data: {
      planned_time: '09:30',
      actual_time: '09:28',
      variance: -2,
    },
    created_by: 'DRV_001',
    notes: '提早到達',
    ...overrides,
  }),

  createTestRouteAnalytics: (overrides = {}) => ({
    analytics_id: 'ANALYTICS_TEST_001',
    date: new Date('2025-08-20'),
    total_routes: 25,
    total_stops: 200,
    total_distance: 1125.5,
    total_duration: 6000,
    on_time_delivery_rate: 92.5,
    average_stops_per_route: 8,
    average_distance_per_route: 45,
    average_duration_per_route: 240,
    fuel_consumption: 132.5,
    fuel_cost: 4500,
    labor_cost: 12000,
    total_cost: 16500,
    cost_per_delivery: 82.5,
    optimization_savings: 2500,
    customer_satisfaction: 4.7,
    issues_reported: 3,
    performance_score: 88,
    ...overrides,
  }),

  createTestZone: (overrides = {}) => ({
    zone_id: 'ZONE_TEST_001',
    zone_name: '北區A',
    zone_code: 'NA',
    coverage_area: {
      type: 'Polygon',
      coordinates: [
        [[121.5, 25.0], [121.6, 25.0], [121.6, 25.1], [121.5, 25.1], [121.5, 25.0]]
      ],
    },
    postal_codes: ['100', '101', '102'],
    service_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    service_hours: '08:00-18:00',
    default_warehouse: 'WH_001',
    assigned_drivers: ['DRV_001', 'DRV_002'],
    average_daily_orders: 50,
    delivery_fee: 100,
    express_fee: 150,
    ...overrides,
  }),

  createTestRouteSummary: (overrides = {}) => ({
    summary_date: new Date('2025-08-20'),
    total_planned_routes: 25,
    total_active_routes: 20,
    total_completed_routes: 5,
    total_cancelled_routes: 0,
    delivery_success_rate: 95,
    average_delay: 5, // minutes
    total_distance_planned: 1125.5,
    total_distance_actual: 1098.3,
    fuel_usage_estimated: 132.5,
    fuel_usage_actual: 129.8,
    cost_estimated: 16500,
    cost_actual: 16200,
    issues: {
      traffic_delays: 3,
      vehicle_breakdowns: 0,
      customer_unavailable: 2,
      wrong_address: 1,
    },
    performance_metrics: {
      on_time_rate: 92,
      customer_satisfaction: 4.7,
      driver_utilization: 85,
      vehicle_utilization: 82,
    },
    ...overrides,
  }),
};

// Mock API handlers
export const mockApiHandlers = {
  getRoutes: vi.fn(() => Promise.resolve({
    routes: [testDataBuilders.createTestDeliveryRoute()],
    total: 1,
    page: 1,
    limit: 20,
  })),

  getRoute: vi.fn((id) => Promise.resolve(
    testDataBuilders.createTestDeliveryRoute({ route_id: id })
  )),

  createRoute: vi.fn((data) => Promise.resolve(
    testDataBuilders.createTestDeliveryRoute(data)
  )),

  updateRoute: vi.fn((id, data) => Promise.resolve({
    ...testDataBuilders.createTestDeliveryRoute({ route_id: id }),
    ...data,
  })),

  optimizeRoutes: vi.fn((request) => Promise.resolve(
    testDataBuilders.createTestOptimizationResult(request)
  )),

  getDrivers: vi.fn(() => Promise.resolve({
    drivers: [testDataBuilders.createTestDriver()],
    total: 1,
  })),

  getVehicles: vi.fn(() => Promise.resolve({
    vehicles: [testDataBuilders.createTestVehicle()],
    total: 1,
  })),

  trackRoute: vi.fn((id) => Promise.resolve(
    testDataBuilders.createTestRouteTracking({ route_id: id })
  )),

  getRouteAnalytics: vi.fn(() => Promise.resolve(
    testDataBuilders.createTestRouteAnalytics()
  )),

  getRouteSummary: vi.fn(() => Promise.resolve(
    testDataBuilders.createTestRouteSummary()
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