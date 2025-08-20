import { rest } from 'msw';
import { testDataBuilders } from '../setup';

export const logisticsApiHandlers = [
  // Route endpoints
  rest.get('/api/v1/routes', (req, res, ctx) => {
    const date = req.url.searchParams.get('date');
    const status = req.url.searchParams.get('status');
    const driver = req.url.searchParams.get('driver');
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 20;

    let routes = [
      testDataBuilders.createTestDeliveryRoute(),
      testDataBuilders.createTestDeliveryRoute({
        route_id: 'ROUTE_002',
        route_number: 'RT-20250820-002',
        driver_id: 'DRV_002',
        driver_name: '李司機',
        status: 'in_progress',
        completed_stops: 3,
      }),
      testDataBuilders.createTestDeliveryRoute({
        route_id: 'ROUTE_003',
        route_number: 'RT-20250820-003',
        driver_id: 'DRV_003',
        driver_name: '王司機',
        status: 'completed',
        completed_stops: 8,
        actual_time: 235,
      }),
    ];

    // Apply filters
    if (status) {
      routes = routes.filter(r => r.status === status);
    }
    if (driver) {
      routes = routes.filter(r => r.driver_id === driver);
    }

    return res(
      ctx.json({
        routes: routes.slice((page - 1) * limit, page * limit),
        total: routes.length,
        page,
        limit,
      })
    );
  }),

  rest.get('/api/v1/routes/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestDeliveryRoute({ route_id: id }))
    );
  }),

  rest.post('/api/v1/routes', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDeliveryRoute({
        ...body,
        route_id: `ROUTE_${Date.now()}`,
        route_number: `RT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.put('/api/v1/routes/:id', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestDeliveryRoute({ route_id: id }),
        ...body,
        updated_at: new Date(),
      })
    );
  }),

  // Route stops
  rest.get('/api/v1/routes/:routeId/stops', (req, res, ctx) => {
    const { routeId } = req.params;
    
    const stops = [
      testDataBuilders.createTestDeliveryStop({ route_id: routeId }),
      testDataBuilders.createTestDeliveryStop({
        stop_id: 'STOP_002',
        route_id: routeId,
        stop_sequence: 2,
        customer_name: '客戶B',
        delivery_address: '台北市大安區測試路200號',
        estimated_arrival: new Date('2025-08-20T10:00:00'),
      }),
      testDataBuilders.createTestDeliveryStop({
        stop_id: 'STOP_003',
        route_id: routeId,
        stop_sequence: 3,
        customer_name: '客戶C',
        delivery_address: '台北市中山區測試路300號',
        estimated_arrival: new Date('2025-08-20T10:30:00'),
      }),
    ];

    return res(ctx.json(stops));
  }),

  rest.put('/api/v1/routes/:routeId/stops/:stopId', (req, res, ctx) => {
    const { routeId, stopId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestDeliveryStop({ 
          stop_id: stopId, 
          route_id: routeId 
        }),
        ...body,
      })
    );
  }),

  // Route optimization
  rest.post('/api/v1/routes/optimize', (req, res, ctx) => {
    const body = req.body as any;
    
    const request = testDataBuilders.createTestOptimizationRequest(body);
    
    // Simulate optimization processing
    return res(
      ctx.delay(1000),
      ctx.json(testDataBuilders.createTestOptimizationResult({
        request_id: request.request_id,
        routes_created: Math.ceil(request.total_orders / 8),
      }))
    );
  }),

  rest.get('/api/v1/routes/optimization/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestOptimizationResult({ request_id: id }))
    );
  }),

  // Drivers
  rest.get('/api/v1/drivers', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const zone = req.url.searchParams.get('zone');

    let drivers = [
      testDataBuilders.createTestDriver(),
      testDataBuilders.createTestDriver({
        driver_id: 'DRV_002',
        driver_name: '李司機',
        status: 'on_route',
        today_routes: 2,
        today_distance: 85.5,
      }),
      testDataBuilders.createTestDriver({
        driver_id: 'DRV_003',
        driver_name: '王司機',
        status: 'break',
        today_routes: 1,
        today_distance: 42.3,
      }),
    ];

    if (status) {
      drivers = drivers.filter(d => d.status === status);
    }
    if (zone) {
      drivers = drivers.filter(d => d.zones.includes(zone));
    }

    return res(ctx.json({ drivers, total: drivers.length }));
  }),

  rest.get('/api/v1/drivers/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestDriver({ driver_id: id }))
    );
  }),

  rest.put('/api/v1/drivers/:id/status', (req, res, ctx) => {
    const { id } = req.params;
    const { status } = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestDriver({ driver_id: id }),
        status,
        updated_at: new Date(),
      })
    );
  }),

  // Vehicles
  rest.get('/api/v1/vehicles', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const type = req.url.searchParams.get('type');

    let vehicles = [
      testDataBuilders.createTestVehicle(),
      testDataBuilders.createTestVehicle({
        vehicle_id: 'VEH_002',
        vehicle_number: 'TPE-9012',
        vehicle_type: 'van',
        status: 'in_use',
        current_driver: 'DRV_002',
      }),
      testDataBuilders.createTestVehicle({
        vehicle_id: 'VEH_003',
        vehicle_number: 'TPE-3456',
        vehicle_type: 'large_truck',
        status: 'maintenance',
        capacity_weight: 3000,
        capacity_volume: 20,
      }),
    ];

    if (status) {
      vehicles = vehicles.filter(v => v.status === status);
    }
    if (type) {
      vehicles = vehicles.filter(v => v.vehicle_type === type);
    }

    return res(ctx.json({ vehicles, total: vehicles.length }));
  }),

  rest.get('/api/v1/vehicles/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestVehicle({ vehicle_id: id }))
    );
  }),

  // Route tracking
  rest.get('/api/v1/routes/:id/tracking', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestRouteTracking({ route_id: id }))
    );
  }),

  rest.post('/api/v1/routes/:id/tracking', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestRouteTracking({
        route_id: id,
        ...body,
        tracking_id: `TRACK_${Date.now()}`,
        timestamp: new Date(),
      }))
    );
  }),

  // Route events
  rest.get('/api/v1/routes/:id/events', (req, res, ctx) => {
    const { id } = req.params;
    
    const events = [
      testDataBuilders.createTestDeliveryEvent({ route_id: id }),
      testDataBuilders.createTestDeliveryEvent({
        event_id: 'EVENT_002',
        route_id: id,
        event_type: 'departure',
        event_time: new Date('2025-08-20T09:45:00'),
      }),
      testDataBuilders.createTestDeliveryEvent({
        event_id: 'EVENT_003',
        route_id: id,
        event_type: 'delivery_completed',
        event_time: new Date('2025-08-20T09:43:00'),
      }),
    ];

    return res(ctx.json(events));
  }),

  rest.post('/api/v1/routes/:routeId/stops/:stopId/event', (req, res, ctx) => {
    const { routeId, stopId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDeliveryEvent({
        route_id: routeId,
        stop_id: stopId,
        ...body,
        event_id: `EVENT_${Date.now()}`,
        event_time: new Date(),
      }))
    );
  }),

  // Analytics
  rest.get('/api/v1/routes/analytics', (req, res, ctx) => {
    const date = req.url.searchParams.get('date');
    const period = req.url.searchParams.get('period') || 'daily';

    return res(
      ctx.json(testDataBuilders.createTestRouteAnalytics({
        date: date ? new Date(date) : new Date('2025-08-20'),
      }))
    );
  }),

  rest.get('/api/v1/routes/summary', (req, res, ctx) => {
    const date = req.url.searchParams.get('date');

    return res(
      ctx.json(testDataBuilders.createTestRouteSummary({
        summary_date: date ? new Date(date) : new Date('2025-08-20'),
      }))
    );
  }),

  // Zones
  rest.get('/api/v1/zones', (req, res, ctx) => {
    const zones = [
      testDataBuilders.createTestZone(),
      testDataBuilders.createTestZone({
        zone_id: 'ZONE_002',
        zone_name: '中區A',
        zone_code: 'CA',
        postal_codes: ['400', '401', '402'],
        default_warehouse: 'WH_002',
      }),
      testDataBuilders.createTestZone({
        zone_id: 'ZONE_003',
        zone_name: '南區A',
        zone_code: 'SA',
        postal_codes: ['800', '801', '802'],
        default_warehouse: 'WH_003',
      }),
    ];

    return res(ctx.json(zones));
  }),

  rest.get('/api/v1/zones/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestZone({ zone_id: id }))
    );
  }),

  // Constraints
  rest.get('/api/v1/constraints', (req, res, ctx) => {
    const type = req.url.searchParams.get('type');
    const entity = req.url.searchParams.get('entity');

    let constraints = [
      testDataBuilders.createTestDeliveryConstraint(),
      testDataBuilders.createTestDeliveryConstraint({
        constraint_id: 'CONST_002',
        constraint_type: 'vehicle_type',
        entity_type: 'customer',
        entity_id: 'CUS_002',
        constraint_value: {
          required_type: 'temperature_controlled',
          reason: '冷藏商品',
        },
      }),
      testDataBuilders.createTestDeliveryConstraint({
        constraint_id: 'CONST_003',
        constraint_type: 'driver_skill',
        entity_type: 'zone',
        entity_id: 'ZONE_001',
        constraint_value: {
          required_experience: 3,
          required_rating: 4.5,
        },
      }),
    ];

    if (type) {
      constraints = constraints.filter(c => c.constraint_type === type);
    }
    if (entity) {
      constraints = constraints.filter(c => c.entity_type === entity);
    }

    return res(ctx.json(constraints));
  }),

  // Route reassignment
  rest.post('/api/v1/routes/:id/reassign', (req, res, ctx) => {
    const { id } = req.params;
    const { driver_id, vehicle_id } = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestDeliveryRoute({ route_id: id }),
        driver_id,
        vehicle_id,
        status: 'reassigned',
        updated_at: new Date(),
      })
    );
  }),

  // Export routes
  rest.post('/api/v1/routes/export', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json({
        file_url: '/exports/routes_20250820.xlsx',
        format: body.format || 'excel',
        record_count: 25,
        created_at: new Date(),
      })
    );
  }),
];