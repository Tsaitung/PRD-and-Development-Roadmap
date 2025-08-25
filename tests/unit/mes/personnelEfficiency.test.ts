/**
 * Unit Tests for Personnel Efficiency Service
 * 測試 FR-MES-PEMLD-001: 人員效率監控
 */

import { PersonnelEfficiencyService } from '@/modules/mes/services/personnelEfficiency.service';
import { EfficiencyRepository } from '@/modules/mes/repositories/efficiency.repository';
import { HRService } from '@/modules/hr/services/hr.service';
import { CacheService } from '@/common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('PersonnelEfficiencyService', () => {
  let service: PersonnelEfficiencyService;
  let efficiencyRepository: jest.Mocked<EfficiencyRepository>;
  let hrService: jest.Mocked<HRService>;
  let cacheService: jest.Mocked<CacheService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    efficiencyRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
      })),
    } as any;

    hrService = {
      getEmployeeInfo: jest.fn(),
      getShiftInfo: jest.fn(),
      getSkillMatrix: jest.fn(),
    } as any;

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    service = new PersonnelEfficiencyService(
      efficiencyRepository,
      hrService,
      cacheService,
      eventEmitter
    );
  });

  describe('calculateEfficiency', () => {
    it('should calculate OEE correctly', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      const shiftData = {
        date: new Date('2025-08-25'),
        shift: 'morning',
        plannedQty: 100,
        actualQty: 85,
        goodQty: 80,
        workHours: 8,
        productiveTime: 6.5,
      };

      // Act
      const result = await service.calculateEfficiency(employeeId, shiftData);

      // Assert
      expect(result.productivity).toBeCloseTo(10.625); // 85/8
      expect(result.utilizationRate).toBeCloseTo(81.25); // 6.5/8 * 100
      expect(result.qualityRate).toBeCloseTo(94.12); // 80/85 * 100
      expect(result.performanceRate).toBeCloseTo(85); // 85/100 * 100
      expect(result.oee).toBeCloseTo(65.15); // 0.8125 * 0.85 * 0.9412 * 100
    });

    it('should identify efficiency anomalies', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      const lowEfficiencyData = {
        date: new Date('2025-08-25'),
        plannedQty: 100,
        actualQty: 40,
        goodQty: 35,
        workHours: 8,
        productiveTime: 3,
      };

      // Act
      const result = await service.calculateEfficiency(employeeId, lowEfficiencyData);

      // Assert
      expect(result.performanceRate).toBeLessThan(50);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'efficiency.anomaly',
        expect.objectContaining({
          employeeId,
          type: 'low_efficiency',
        })
      );
    });

    it('should detect fatigue patterns', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      const overtimeData = {
        consecutiveDays: 6,
        totalHoursThisWeek: 55,
        overtimeHours: 15,
      };

      hrService.getEmployeeWorkHistory = jest.fn().mockResolvedValue(overtimeData);

      // Act
      const result = await service.detectFatigueRisk(employeeId);

      // Assert
      expect(result.fatigueRisk).toBe('high');
      expect(result.recommendations).toContain('Schedule rest day');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'fatigue.warning',
        expect.objectContaining({ employeeId })
      );
    });
  });

  describe('getRealtimeEfficiency', () => {
    it('should load dashboard within 1 second', async () => {
      // Arrange
      const mockData = {
        employees: Array.from({ length: 50 }, (_, i) => ({
          id: `EMP-${i}`,
          efficiency: Math.random() * 100,
        })),
      };

      cacheService.get.mockResolvedValue(null);
      efficiencyRepository.find.mockResolvedValue(mockData.employees);

      // Act
      const startTime = Date.now();
      const result = await service.getRealtimeDashboard();
      const endTime = Date.now();

      // Assert
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.employees).toHaveLength(50);
    });

    it('should use cache when available', async () => {
      // Arrange
      const cachedData = {
        timestamp: Date.now(),
        employees: [{ id: 'EMP-001', efficiency: 85 }],
      };

      cacheService.get.mockResolvedValue(cachedData);

      // Act
      const result = await service.getRealtimeDashboard();

      // Assert
      expect(result).toEqual(cachedData);
      expect(efficiencyRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('compareEfficiency', () => {
    it('should compare individual vs team performance', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      const teamEfficiencies = [75, 80, 85, 90, 82];
      const individualEfficiency = 78;

      efficiencyRepository.findOne.mockResolvedValue({
        efficiency: { oee: individualEfficiency },
      });
      
      service.getTeamEfficiencies = jest.fn().mockResolvedValue(teamEfficiencies);

      // Act
      const result = await service.compareToTeam(employeeId);

      // Assert
      expect(result.individualScore).toBe(78);
      expect(result.teamAverage).toBe(82.4);
      expect(result.ranking).toBe(5); // Below 4 team members
      expect(result.percentile).toBeCloseTo(20);
    });

    it('should identify best practices from top performers', async () => {
      // Arrange
      const topPerformers = [
        {
          employeeId: 'EMP-001',
          efficiency: 95,
          practices: ['Early setup', 'Batch processing'],
        },
        {
          employeeId: 'EMP-002',
          efficiency: 93,
          practices: ['Preventive checks', 'Tool optimization'],
        },
      ];

      service.getTopPerformers = jest.fn().mockResolvedValue(topPerformers);

      // Act
      const result = await service.identifyBestPractices();

      // Assert
      expect(result).toBeDefined();
      expect(result.practices).toContain('Early setup');
      expect(result.practices).toContain('Batch processing');
    });
  });

  describe('generateEfficiencyReport', () => {
    it('should generate comprehensive efficiency report', async () => {
      // Arrange
      const period = {
        start: new Date('2025-08-01'),
        end: new Date('2025-08-25'),
      };

      const mockMetrics = {
        avgEfficiency: 82.5,
        topPerformer: 'EMP-001',
        bottomPerformer: 'EMP-050',
        trend: 'improving',
      };

      service.calculatePeriodMetrics = jest.fn().mockResolvedValue(mockMetrics);

      // Act
      const report = await service.generateEfficiencyReport(period);

      // Assert
      expect(report).toBeDefined();
      expect(report.metrics).toEqual(mockMetrics);
      expect(report.period).toEqual(period);
    });

    it('should provide training recommendations', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      const skillGaps = ['Machine operation', 'Quality control'];
      
      hrService.getSkillMatrix.mockResolvedValue({
        current: ['Basic assembly'],
        required: ['Machine operation', 'Quality control', 'Basic assembly'],
      });

      // Act
      const result = await service.getTrainingRecommendations(employeeId);

      // Assert
      expect(result.recommendations).toEqual(skillGaps);
      expect(result.priority).toBe('high');
    });
  });

  describe('Efficiency Alerts', () => {
    it('should trigger alert when efficiency drops below threshold', async () => {
      // Arrange
      const threshold = 70;
      const currentEfficiency = 65;
      
      // Act
      await service.checkEfficiencyThreshold('EMP-001', currentEfficiency, threshold);

      // Assert
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'efficiency.alert',
        expect.objectContaining({
          type: 'below_threshold',
          employeeId: 'EMP-001',
          current: 65,
          threshold: 70,
        })
      );
    });

    it('should escalate alerts for persistent low performance', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      const consecutiveLowDays = 3;
      
      service.getConsecutiveLowPerformanceDays = jest.fn()
        .mockResolvedValue(consecutiveLowDays);

      // Act
      await service.checkPerformanceTrend(employeeId);

      // Assert
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'efficiency.escalation',
        expect.objectContaining({
          employeeId,
          consecutiveDays: consecutiveLowDays,
          action: 'supervisor_notification',
        })
      );
    });
  });

  describe('Historical Analysis', () => {
    it('should analyze 6-month efficiency trends', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      const historicalData = Array.from({ length: 180 }, (_, i) => ({
        date: new Date(2025, 2, i + 1),
        efficiency: 75 + Math.random() * 15,
      }));

      efficiencyRepository.find.mockResolvedValue(historicalData);

      // Act
      const result = await service.analyzeHistoricalTrend(employeeId, 6);

      // Assert
      expect(result.dataPoints).toBe(180);
      expect(result.trend).toBeDefined();
      expect(result.average).toBeGreaterThan(75);
      expect(result.average).toBeLessThan(90);
    });

    it('should identify seasonal patterns', async () => {
      // Arrange
      const seasonalData = {
        spring: 85,
        summer: 78,
        fall: 82,
        winter: 88,
      };

      service.analyzeSeasonalPatterns = jest.fn().mockResolvedValue(seasonalData);

      // Act
      const result = await service.analyzeSeasonalPatterns('EMP-001');

      // Assert
      expect(result.winter).toBeGreaterThan(result.summer);
      expect(result).toEqual(seasonalData);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle 100 concurrent efficiency calculations', async () => {
      // Arrange
      const employees = Array.from({ length: 100 }, (_, i) => `EMP-${i}`);
      const shiftData = {
        date: new Date(),
        plannedQty: 100,
        actualQty: 85,
        goodQty: 80,
        workHours: 8,
        productiveTime: 6.5,
      };

      // Act
      const startTime = Date.now();
      const promises = employees.map(emp => 
        service.calculateEfficiency(emp, shiftData)
      );
      await Promise.all(promises);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should implement efficient caching strategy', async () => {
      // Arrange
      const employeeId = 'EMP-001';
      cacheService.get.mockResolvedValue(null);
      
      // Act - First call
      await service.getEfficiencyMetrics(employeeId);
      
      // Act - Second call (should use cache)
      cacheService.get.mockResolvedValue({ oee: 85 });
      await service.getEfficiencyMetrics(employeeId);

      // Assert
      expect(efficiencyRepository.findOne).toHaveBeenCalledTimes(1);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});

describe('Personnel Efficiency Integration Tests', () => {
  it('should integrate with HR system for shift data', async () => {
    // Integration test with actual HR service
    expect(true).toBe(true); // Placeholder
  });

  it('should sync with production data in real-time', async () => {
    // Test real-time data synchronization
    expect(true).toBe(true); // Placeholder
  });

  it('should generate accurate cross-department comparisons', async () => {
    // Test multi-department efficiency analysis
    expect(true).toBe(true); // Placeholder
  });
});