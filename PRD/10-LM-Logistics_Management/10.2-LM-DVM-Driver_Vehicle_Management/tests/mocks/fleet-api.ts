import { rest } from 'msw';
import { testDataBuilders } from '../setup';

export const fleetApiHandlers = [
  // Driver endpoints
  rest.get('/api/v1/drivers', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const availability = req.url.searchParams.get('availability');
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 20;

    let drivers = [
      testDataBuilders.createTestDriver(),
      testDataBuilders.createTestDriver({
        driver_id: 'DRV_002',
        name: '李司機',
        status: 'active',
        availability: 'on_route',
        current_route: 'ROUTE_002',
      }),
      testDataBuilders.createTestDriver({
        driver_id: 'DRV_003',
        name: '王司機',
        status: 'on_leave',
        availability: 'unavailable',
      }),
    ];

    // Apply filters
    if (status) {
      drivers = drivers.filter(d => d.status === status);
    }
    if (availability) {
      drivers = drivers.filter(d => d.availability === availability);
    }

    return res(
      ctx.json({
        drivers: drivers.slice((page - 1) * limit, page * limit),
        total: drivers.length,
        page,
        limit,
      })
    );
  }),

  rest.get('/api/v1/drivers/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestDriver({ driver_id: id }))
    );
  }),

  rest.post('/api/v1/drivers', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDriver({
        ...body,
        driver_id: `DRV_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.put('/api/v1/drivers/:id', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestDriver({ driver_id: id }),
        ...body,
        updated_at: new Date(),
      })
    );
  }),

  rest.delete('/api/v1/drivers/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json({ success: true, driver_id: id })
    );
  }),

  // Vehicle endpoints
  rest.get('/api/v1/vehicles', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const type = req.url.searchParams.get('type');
    const availability = req.url.searchParams.get('availability');

    let vehicles = [
      testDataBuilders.createTestVehicle(),
      testDataBuilders.createTestVehicle({
        vehicle_id: 'VEH_002',
        plate_number: 'TPE-5678',
        type: 'van',
        status: 'active',
        availability: 'in_use',
        current_driver: 'DRV_002',
      }),
      testDataBuilders.createTestVehicle({
        vehicle_id: 'VEH_003',
        plate_number: 'TPE-9012',
        type: 'large_truck',
        status: 'maintenance',
        availability: 'unavailable',
      }),
    ];

    if (status) {
      vehicles = vehicles.filter(v => v.status === status);
    }
    if (type) {
      vehicles = vehicles.filter(v => v.type === type);
    }
    if (availability) {
      vehicles = vehicles.filter(v => v.availability === availability);
    }

    return res(ctx.json({ vehicles, total: vehicles.length }));
  }),

  rest.get('/api/v1/vehicles/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.json(testDataBuilders.createTestVehicle({ vehicle_id: id }))
    );
  }),

  rest.post('/api/v1/vehicles', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestVehicle({
        ...body,
        vehicle_id: `VEH_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.put('/api/v1/vehicles/:id', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        ...testDataBuilders.createTestVehicle({ vehicle_id: id }),
        ...body,
        updated_at: new Date(),
      })
    );
  }),

  // Driver schedule
  rest.get('/api/v1/drivers/:driverId/schedule', (req, res, ctx) => {
    const { driverId } = req.params;
    const date = req.url.searchParams.get('date');
    const month = req.url.searchParams.get('month');

    if (month) {
      // Return monthly schedule
      const schedules = [];
      for (let i = 1; i <= 30; i++) {
        schedules.push(testDataBuilders.createTestDriverSchedule({
          schedule_id: `SCH_${i}`,
          driver_id: driverId,
          date: new Date(`2025-08-${i.toString().padStart(2, '0')}`),
        }));
      }
      return res(ctx.json(schedules));
    }

    return res(
      ctx.json(testDataBuilders.createTestDriverSchedule({
        driver_id: driverId,
        date: date ? new Date(date) : new Date('2025-08-20'),
      }))
    );
  }),

  rest.post('/api/v1/drivers/:driverId/schedule', (req, res, ctx) => {
    const { driverId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDriverSchedule({
        ...body,
        driver_id: driverId,
        schedule_id: `SCH_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  // Vehicle assignment
  rest.post('/api/v1/vehicles/:vehicleId/assign', (req, res, ctx) => {
    const { vehicleId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestVehicleAssignment({
        ...body,
        vehicle_id: vehicleId,
        assignment_id: `ASSIGN_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  rest.put('/api/v1/vehicles/:vehicleId/return', (req, res, ctx) => {
    const { vehicleId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        assignment_id: body.assignment_id,
        vehicle_id: vehicleId,
        status: 'completed',
        end_date: new Date(),
        mileage_end: body.mileage,
        fuel_end: body.fuel,
        condition_end: body.condition,
      })
    );
  }),

  // Driver documents
  rest.get('/api/v1/drivers/:driverId/documents', (req, res, ctx) => {
    const { driverId } = req.params;
    
    const documents = [
      testDataBuilders.createTestDriverDocument({ driver_id: driverId }),
      testDataBuilders.createTestDriverDocument({
        document_id: 'DOC_002',
        driver_id: driverId,
        document_type: 'medical',
        document_name: '健康檢查證明',
        expiry_date: new Date('2025-12-31'),
      }),
      testDataBuilders.createTestDriverDocument({
        document_id: 'DOC_003',
        driver_id: driverId,
        document_type: 'training',
        document_name: '安全訓練證書',
        expiry_date: new Date('2027-07-01'),
      }),
    ];

    return res(ctx.json(documents));
  }),

  rest.post('/api/v1/drivers/:driverId/documents', (req, res, ctx) => {
    const { driverId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDriverDocument({
        ...body,
        driver_id: driverId,
        document_id: `DOC_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  // Vehicle expenses
  rest.get('/api/v1/vehicles/:vehicleId/expenses', (req, res, ctx) => {
    const { vehicleId } = req.params;
    const dateFrom = req.url.searchParams.get('date_from');
    const dateTo = req.url.searchParams.get('date_to');
    const type = req.url.searchParams.get('type');

    let expenses = [
      testDataBuilders.createTestVehicleExpense({ vehicle_id: vehicleId }),
      testDataBuilders.createTestVehicleExpense({
        expense_id: 'EXP_002',
        vehicle_id: vehicleId,
        expense_type: 'maintenance',
        amount: 3500,
        date: new Date('2025-08-15'),
      }),
      testDataBuilders.createTestVehicleExpense({
        expense_id: 'EXP_003',
        vehicle_id: vehicleId,
        expense_type: 'toll',
        amount: 150,
        date: new Date('2025-08-20'),
      }),
    ];

    if (type) {
      expenses = expenses.filter(e => e.expense_type === type);
    }

    return res(ctx.json({ expenses, total: expenses.length }));
  }),

  rest.post('/api/v1/vehicles/:vehicleId/expenses', (req, res, ctx) => {
    const { vehicleId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestVehicleExpense({
        ...body,
        vehicle_id: vehicleId,
        expense_id: `EXP_${Date.now()}`,
        created_at: new Date(),
      }))
    );
  }),

  // Driver leave
  rest.get('/api/v1/drivers/:driverId/leaves', (req, res, ctx) => {
    const { driverId } = req.params;
    
    const leaves = [
      testDataBuilders.createTestDriverLeave({ driver_id: driverId }),
      testDataBuilders.createTestDriverLeave({
        leave_id: 'LEAVE_002',
        driver_id: driverId,
        leave_type: 'sick',
        start_date: new Date('2025-07-10'),
        end_date: new Date('2025-07-11'),
        days: 2,
        reason: '病假',
        status: 'approved',
      }),
    ];

    return res(ctx.json(leaves));
  }),

  rest.post('/api/v1/drivers/:driverId/leaves', (req, res, ctx) => {
    const { driverId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDriverLeave({
        ...body,
        driver_id: driverId,
        leave_id: `LEAVE_${Date.now()}`,
        status: 'pending',
        created_at: new Date(),
      }))
    );
  }),

  rest.put('/api/v1/leaves/:leaveId/approve', (req, res, ctx) => {
    const { leaveId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        leave_id: leaveId,
        status: 'approved',
        approved_by: body.approved_by,
        approved_at: new Date(),
        substitute_driver: body.substitute_driver,
      })
    );
  }),

  // Vehicle incidents
  rest.get('/api/v1/vehicles/:vehicleId/incidents', (req, res, ctx) => {
    const { vehicleId } = req.params;
    
    const incidents = [
      testDataBuilders.createTestVehicleIncident({ vehicle_id: vehicleId }),
    ];

    return res(ctx.json(incidents));
  }),

  rest.post('/api/v1/vehicles/:vehicleId/incidents', (req, res, ctx) => {
    const { vehicleId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestVehicleIncident({
        ...body,
        vehicle_id: vehicleId,
        incident_id: `INC_${Date.now()}`,
        status: 'reported',
        created_at: new Date(),
      }))
    );
  }),

  // Driver training
  rest.get('/api/v1/drivers/:driverId/trainings', (req, res, ctx) => {
    const { driverId } = req.params;
    
    const trainings = [
      testDataBuilders.createTestDriverTraining({ driver_id: driverId }),
      testDataBuilders.createTestDriverTraining({
        training_id: 'TRAIN_002',
        driver_id: driverId,
        training_type: 'skill',
        training_name: '冷鏈運輸訓練',
        status: 'scheduled',
        start_date: new Date('2025-09-01'),
      }),
    ];

    return res(ctx.json(trainings));
  }),

  rest.post('/api/v1/drivers/:driverId/trainings', (req, res, ctx) => {
    const { driverId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json(testDataBuilders.createTestDriverTraining({
        ...body,
        driver_id: driverId,
        training_id: `TRAIN_${Date.now()}`,
        status: 'scheduled',
        created_at: new Date(),
      }))
    );
  }),

  // Fleet summary
  rest.get('/api/v1/fleet/summary', (req, res, ctx) => {
    const date = req.url.searchParams.get('date');
    
    return res(
      ctx.json(testDataBuilders.createTestFleetSummary({
        summary_date: date ? new Date(date) : new Date('2025-08-20'),
      }))
    );
  }),

  // Vehicle maintenance
  rest.get('/api/v1/vehicles/:vehicleId/maintenance', (req, res, ctx) => {
    const { vehicleId } = req.params;
    
    const maintenance = {
      vehicle_id: vehicleId,
      last_service: new Date('2025-07-15'),
      next_service: new Date('2025-10-15'),
      mileage: 45000,
      due_soon: false,
      overdue: false,
      history: [
        { date: '2025-07-15', type: 'regular', mileage: 45000, cost: 3500 },
        { date: '2025-04-15', type: 'regular', mileage: 40000, cost: 3200 },
        { date: '2025-01-15', type: 'regular', mileage: 35000, cost: 3100 },
      ],
    };

    return res(ctx.json(maintenance));
  }),

  rest.post('/api/v1/vehicles/:vehicleId/maintenance', (req, res, ctx) => {
    const { vehicleId } = req.params;
    const body = req.body as any;
    
    return res(
      ctx.json({
        maintenance_id: `MAINT_${Date.now()}`,
        vehicle_id: vehicleId,
        ...body,
        created_at: new Date(),
      })
    );
  }),

  // Driver performance
  rest.get('/api/v1/drivers/:driverId/performance', (req, res, ctx) => {
    const { driverId } = req.params;
    const period = req.url.searchParams.get('period') || 'monthly';
    
    const performance = {
      driver_id: driverId,
      period,
      metrics: {
        total_routes: period === 'monthly' ? 80 : 20,
        total_deliveries: period === 'monthly' ? 640 : 160,
        on_time_rate: 95.5,
        fuel_efficiency: 8.3,
        customer_rating: 4.8,
        safety_score: 98,
        violations: 0,
        accidents: 0,
      },
      trends: {
        on_time_rate: [94, 95, 94.5, 96, 95.5],
        fuel_efficiency: [8.1, 8.2, 8.4, 8.3, 8.3],
        customer_rating: [4.7, 4.8, 4.7, 4.9, 4.8],
      },
    };

    return res(ctx.json(performance));
  }),

  // Export
  rest.post('/api/v1/fleet/export', (req, res, ctx) => {
    const body = req.body as any;
    
    return res(
      ctx.json({
        file_url: '/exports/fleet_20250820.xlsx',
        format: body.format || 'excel',
        record_count: body.type === 'drivers' ? 30 : 25,
        created_at: new Date(),
      })
    );
  }),
];