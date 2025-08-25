/**
 * Progress Monitoring Service
 * 生產進度監控服務
 * 
 * @module ProgressMonitoringService
 * @version 1.0.0
 * @since 2025-08-25
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkOrder } from '../entities/workOrder.entity';
import { ProductionProgress } from '../entities/productionProgress.entity';
import { OrderTracking } from '../entities/orderTracking.entity';
import { CacheService } from '@/common/services/cache.service';
import { NotificationService } from '@/common/services/notification.service';
import * as moment from 'moment';

interface ProgressUpdate {
  workOrderId: string;
  operationId?: string;
  progress: number;
  quantity?: {
    completed: number;
    good: number;
    defect: number;
  };
  operator?: string;
  notes?: string;
}

interface ProgressMetrics {
  overall: number;
  onTime: number;
  delayed: number;
  critical: number;
  avgCompletionRate: number;
  estimatedDelays: number;
}

interface DelayAnalysis {
  workOrderId: string;
  delayHours: number;
  reason: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedOrders: string[];
  recoveryPlan?: string;
}

@Injectable()
export class ProgressMonitoringService {
  private readonly logger = new Logger(ProgressMonitoringService.name);
  private readonly CACHE_TTL = 60; // 1 minute cache
  private readonly DELAY_THRESHOLD = 0.1; // 10% delay triggers alert
  
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(ProductionProgress)
    private readonly progressRepository: Repository<ProductionProgress>,
    @InjectRepository(OrderTracking)
    private readonly orderTrackingRepository: Repository<OrderTracking>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Update production progress
   */
  async updateProgress(update: ProgressUpdate): Promise<ProductionProgress> {
    this.logger.log(`Updating progress for work order: ${update.workOrderId}`);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get work order with lock
      const workOrder = await queryRunner.manager.findOne(WorkOrder, {
        where: { id: update.workOrderId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!workOrder) {
        throw new NotFoundException(`Work order ${update.workOrderId} not found`);
      }

      // Get or create progress record
      let progress = await queryRunner.manager.findOne(ProductionProgress, {
        where: { workOrderId: update.workOrderId }
      });

      if (!progress) {
        progress = queryRunner.manager.create(ProductionProgress, {
          workOrderId: update.workOrderId,
          orderId: workOrder.orderId,
          progress: {
            overall: 0,
            byOperation: [],
            milestones: []
          },
          timeline: {
            plannedStart: workOrder.plannedStart,
            plannedEnd: workOrder.plannedEnd,
            estimatedEnd: workOrder.plannedEnd,
            delays: []
          },
          quantity: {
            ordered: workOrder.quantity,
            planned: workOrder.quantity,
            inProgress: 0,
            completed: 0,
            shipped: 0,
            quality: {
              good: 0,
              defect: 0,
              rework: 0,
              scrap: 0
            }
          },
          issues: []
        });
      }

      // Update progress
      if (update.operationId) {
        // Update specific operation
        const operation = progress.progress.byOperation.find(
          op => op.operationId === update.operationId
        );
        if (operation) {
          operation.progress = update.progress;
          operation.status = update.progress === 100 ? 'completed' : 'in_progress';
        }
      } else {
        // Update overall progress
        progress.progress.overall = update.progress;
      }

      // Update quantities if provided
      if (update.quantity) {
        progress.quantity.completed += update.quantity.completed;
        progress.quantity.quality.good += update.quantity.good;
        progress.quantity.quality.defect += update.quantity.defect;
        progress.quantity.inProgress = workOrder.quantity - progress.quantity.completed;
      }

      // Calculate estimated completion
      const estimatedEnd = this.calculateEstimatedCompletion(progress);
      progress.timeline.estimatedEnd = estimatedEnd;

      // Check for delays
      if (moment(estimatedEnd).isAfter(progress.timeline.plannedEnd)) {
        const delayHours = moment(estimatedEnd).diff(progress.timeline.plannedEnd, 'hours');
        await this.handleDelay({
          workOrderId: update.workOrderId,
          delayHours,
          reason: 'Production behind schedule',
          impact: delayHours > 24 ? 'high' : 'medium',
          affectedOrders: [workOrder.orderId]
        });
      }

      // Update current status
      progress.currentStatus = {
        location: workOrder.workstation,
        operation: update.operationId || 'general',
        operator: update.operator,
        machine: workOrder.equipment,
        startTime: progress.timeline.actualStart || new Date(),
        estimatedCompletion: estimatedEnd
      };

      progress.lastUpdated = new Date();
      progress.nextUpdate = moment().add(15, 'minutes').toDate();

      // Save progress
      await queryRunner.manager.save(progress);

      // Update work order status
      if (update.progress === 100) {
        workOrder.status = 'completed';
        workOrder.actualEnd = new Date();
      } else if (update.progress > 0 && workOrder.status === 'planned') {
        workOrder.status = 'in_progress';
        workOrder.actualStart = new Date();
      }
      await queryRunner.manager.save(workOrder);

      // Clear cache
      await this.cacheService.del(`progress:${update.workOrderId}`);
      await this.cacheService.del('progress:dashboard');

      // Emit event
      this.eventEmitter.emit('progress.updated', {
        workOrderId: update.workOrderId,
        progress: update.progress,
        timestamp: new Date()
      });

      await queryRunner.commitTransaction();
      
      // Send notifications if needed
      if (update.progress === 100) {
        await this.notificationService.sendWorkOrderCompleted(workOrder);
      }

      return progress;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update progress: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get real-time progress dashboard
   */
  async getProgressDashboard(): Promise<any> {
    // Check cache first
    const cached = await this.cacheService.get('progress:dashboard');
    if (cached) {
      return cached;
    }

    const activeWorkOrders = await this.workOrderRepository.find({
      where: { status: 'in_progress' },
      relations: ['progress']
    });

    const dashboard = {
      summary: {
        total: activeWorkOrders.length,
        onSchedule: 0,
        delayed: 0,
        critical: 0
      },
      workOrders: [],
      metrics: await this.calculateMetrics(),
      lastUpdated: new Date()
    };

    for (const wo of activeWorkOrders) {
      const progress = await this.getWorkOrderProgress(wo.id);
      const status = this.determineStatus(progress);
      
      dashboard.workOrders.push({
        id: wo.id,
        orderNo: wo.orderNo,
        product: wo.product,
        progress: progress.progress.overall,
        status,
        estimatedCompletion: progress.timeline.estimatedEnd
      });

      // Update summary
      if (status === 'on_schedule') dashboard.summary.onSchedule++;
      else if (status === 'delayed') dashboard.summary.delayed++;
      else if (status === 'critical') dashboard.summary.critical++;
    }

    // Cache for 1 minute
    await this.cacheService.set('progress:dashboard', dashboard, this.CACHE_TTL);

    return dashboard;
  }

  /**
   * Get work order progress details
   */
  async getWorkOrderProgress(workOrderId: string): Promise<ProductionProgress> {
    // Check cache
    const cacheKey = `progress:${workOrderId}`;
    const cached = await this.cacheService.get<ProductionProgress>(cacheKey);
    if (cached) {
      return cached;
    }

    const progress = await this.progressRepository.findOne({
      where: { workOrderId },
      relations: ['workOrder', 'issues']
    });

    if (!progress) {
      throw new NotFoundException(`Progress not found for work order ${workOrderId}`);
    }

    // Cache result
    await this.cacheService.set(cacheKey, progress, this.CACHE_TTL);

    return progress;
  }

  /**
   * Track order through production
   */
  async trackOrder(orderId: string): Promise<OrderTracking> {
    const tracking = await this.orderTrackingRepository.findOne({
      where: { orderId },
      relations: ['workOrders', 'timeline']
    });

    if (!tracking) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Update production status
    const workOrders = await this.workOrderRepository.find({
      where: { orderId },
      relations: ['progress']
    });

    let totalProgress = 0;
    let completedCount = 0;

    for (const wo of workOrders) {
      if (wo.progress) {
        totalProgress += wo.progress.progress.overall;
        if (wo.status === 'completed') completedCount++;
      }
    }

    tracking.production.progress = workOrders.length > 0 
      ? totalProgress / workOrders.length 
      : 0;

    if (completedCount === workOrders.length && workOrders.length > 0) {
      tracking.production.status = 'completed';
    } else if (totalProgress > 0) {
      tracking.production.status = 'in_production';
    }

    // Update current stage
    const activeWO = workOrders.find(wo => wo.status === 'in_progress');
    if (activeWO && activeWO.progress) {
      tracking.production.currentStage = {
        stage: activeWO.currentOperation || 'Production',
        location: activeWO.workstation,
        startTime: activeWO.actualStart || activeWO.plannedStart,
        estimatedCompletion: activeWO.progress.timeline.estimatedEnd
      };
    }

    await this.orderTrackingRepository.save(tracking);

    return tracking;
  }

  /**
   * Analyze delays and bottlenecks
   */
  async analyzeDelays(): Promise<DelayAnalysis[]> {
    const delayedWorkOrders = await this.progressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.workOrder', 'workOrder')
      .where('progress.timeline.estimatedEnd > progress.timeline.plannedEnd')
      .getMany();

    const delays: DelayAnalysis[] = [];

    for (const progress of delayedWorkOrders) {
      const delayHours = moment(progress.timeline.estimatedEnd)
        .diff(progress.timeline.plannedEnd, 'hours');

      const analysis: DelayAnalysis = {
        workOrderId: progress.workOrderId,
        delayHours,
        reason: await this.identifyDelayReason(progress),
        impact: this.assessDelayImpact(delayHours),
        affectedOrders: await this.findAffectedOrders(progress.workOrderId)
      };

      // Generate recovery plan
      analysis.recoveryPlan = await this.generateRecoveryPlan(analysis);

      delays.push(analysis);
    }

    // Sort by impact
    delays.sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

    return delays;
  }

  /**
   * Identify bottlenecks in production
   */
  async identifyBottlenecks(): Promise<any[]> {
    const bottlenecks = [];

    // Analyze by workstation
    const workstationStats = await this.progressRepository
      .createQueryBuilder('progress')
      .select('progress.currentStatus.location', 'workstation')
      .addSelect('AVG(progress.progress.overall)', 'avgProgress')
      .addSelect('COUNT(*)', 'count')
      .where('progress.currentStatus.location IS NOT NULL')
      .groupBy('progress.currentStatus.location')
      .getRawMany();

    for (const stat of workstationStats) {
      if (stat.avgProgress < 50 && stat.count > 5) {
        bottlenecks.push({
          type: 'workstation',
          location: stat.workstation,
          avgProgress: stat.avgProgress,
          workOrderCount: stat.count,
          severity: stat.avgProgress < 30 ? 'high' : 'medium'
        });
      }
    }

    // Analyze by operation
    const operationDelays = await this.analyzeOperationDelays();
    bottlenecks.push(...operationDelays);

    return bottlenecks;
  }

  /**
   * Generate progress forecast
   */
  async forecastCompletion(workOrderId: string): Promise<any> {
    const progress = await this.getWorkOrderProgress(workOrderId);
    const historicalData = await this.getHistoricalProgressData(workOrderId);

    // Calculate average progress rate
    const progressRate = this.calculateProgressRate(historicalData);
    const remainingProgress = 100 - progress.progress.overall;
    const estimatedHours = remainingProgress / progressRate;

    const forecast = {
      currentProgress: progress.progress.overall,
      progressRate: progressRate.toFixed(2),
      estimatedCompletion: moment().add(estimatedHours, 'hours').toDate(),
      confidence: this.calculateConfidence(historicalData),
      risks: await this.identifyCompletionRisks(workOrderId)
    };

    return forecast;
  }

  // ==================== Private Helper Methods ====================

  private calculateEstimatedCompletion(progress: ProductionProgress): Date {
    if (progress.progress.overall === 100) {
      return new Date();
    }

    if (progress.progress.overall === 0) {
      return progress.timeline.plannedEnd;
    }

    // Calculate based on current progress rate
    const elapsed = moment().diff(progress.timeline.actualStart || progress.timeline.plannedStart, 'hours');
    const rate = progress.progress.overall / elapsed;
    
    if (rate === 0) {
      return progress.timeline.plannedEnd;
    }

    const remainingProgress = 100 - progress.progress.overall;
    const remainingHours = remainingProgress / rate;

    return moment().add(remainingHours, 'hours').toDate();
  }

  private determineStatus(progress: ProductionProgress): string {
    const now = moment();
    const plannedEnd = moment(progress.timeline.plannedEnd);
    const estimatedEnd = moment(progress.timeline.estimatedEnd);

    if (estimatedEnd.isAfter(plannedEnd)) {
      const delayHours = estimatedEnd.diff(plannedEnd, 'hours');
      if (delayHours > 48) return 'critical';
      if (delayHours > 24) return 'delayed';
      return 'at_risk';
    }

    return 'on_schedule';
  }

  private async handleDelay(delay: DelayAnalysis): Promise<void> {
    // Log delay
    this.logger.warn(`Delay detected: ${JSON.stringify(delay)}`);

    // Store delay record
    const progress = await this.progressRepository.findOne({
      where: { workOrderId: delay.workOrderId }
    });

    if (progress) {
      progress.timeline.delays.push({
        reason: delay.reason,
        duration: delay.delayHours,
        impact: delay.impact,
        resolution: delay.recoveryPlan
      });
      await this.progressRepository.save(progress);
    }

    // Emit delay event
    this.eventEmitter.emit('progress.delayed', delay);

    // Send notifications based on impact
    if (delay.impact === 'critical' || delay.impact === 'high') {
      await this.notificationService.sendDelayAlert(delay);
    }
  }

  private async calculateMetrics(): Promise<ProgressMetrics> {
    const allProgress = await this.progressRepository.find();
    
    let totalProgress = 0;
    let onTimeCount = 0;
    let delayedCount = 0;
    let criticalCount = 0;

    for (const progress of allProgress) {
      totalProgress += progress.progress.overall;
      const status = this.determineStatus(progress);
      
      if (status === 'on_schedule') onTimeCount++;
      else if (status === 'delayed') delayedCount++;
      else if (status === 'critical') criticalCount++;
    }

    return {
      overall: allProgress.length > 0 ? totalProgress / allProgress.length : 0,
      onTime: onTimeCount,
      delayed: delayedCount,
      critical: criticalCount,
      avgCompletionRate: this.calculateAvgCompletionRate(allProgress),
      estimatedDelays: delayedCount + criticalCount
    };
  }

  private calculateAvgCompletionRate(progressRecords: ProductionProgress[]): number {
    if (progressRecords.length === 0) return 0;

    let totalRate = 0;
    for (const progress of progressRecords) {
      if (progress.timeline.actualStart) {
        const elapsed = moment().diff(progress.timeline.actualStart, 'hours');
        const rate = elapsed > 0 ? progress.progress.overall / elapsed : 0;
        totalRate += rate;
      }
    }

    return totalRate / progressRecords.length;
  }

  private async identifyDelayReason(progress: ProductionProgress): Promise<string> {
    // Analyze issues
    if (progress.issues && progress.issues.length > 0) {
      const criticalIssue = progress.issues.find(i => i.severity === 'critical');
      if (criticalIssue) {
        return criticalIssue.description;
      }
    }

    // Check for common delay patterns
    if (progress.quantity.quality.defect > progress.quantity.quality.good * 0.1) {
      return 'High defect rate causing rework';
    }

    if (progress.resources?.manHours.actual > progress.resources?.manHours.planned * 1.2) {
      return 'Labor efficiency below planned';
    }

    return 'Production running behind schedule';
  }

  private assessDelayImpact(delayHours: number): 'low' | 'medium' | 'high' | 'critical' {
    if (delayHours > 72) return 'critical';
    if (delayHours > 24) return 'high';
    if (delayHours > 8) return 'medium';
    return 'low';
  }

  private async findAffectedOrders(workOrderId: string): Promise<string[]> {
    // Find dependent work orders
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId }
    });

    if (!workOrder) return [];

    // Find orders that depend on this work order
    const dependentOrders = await this.workOrderRepository
      .createQueryBuilder('wo')
      .where('wo.dependencies @> :dependency', { dependency: [workOrderId] })
      .getMany();

    return dependentOrders.map(wo => wo.orderId);
  }

  private async generateRecoveryPlan(delay: DelayAnalysis): Promise<string> {
    const plans = [];

    if (delay.impact === 'critical') {
      plans.push('Authorize overtime for critical operations');
      plans.push('Reallocate resources from non-critical orders');
    }

    if (delay.delayHours > 24) {
      plans.push('Consider partial shipment if possible');
      plans.push('Negotiate delivery extension with customer');
    }

    plans.push('Optimize remaining operations for efficiency');
    plans.push('Monitor progress hourly until back on schedule');

    return plans.join('; ');
  }

  private async analyzeOperationDelays(): Promise<any[]> {
    // Implementation for analyzing delays by operation
    return [];
  }

  private async getHistoricalProgressData(workOrderId: string): Promise<any[]> {
    // Get historical progress updates
    return [];
  }

  private calculateProgressRate(historicalData: any[]): number {
    // Calculate average progress rate from historical data
    return 2.5; // % per hour placeholder
  }

  private calculateConfidence(historicalData: any[]): number {
    // Calculate forecast confidence based on data consistency
    return 85; // placeholder
  }

  private async identifyCompletionRisks(workOrderId: string): Promise<string[]> {
    const risks = [];
    
    // Check material availability
    // Check equipment reliability
    // Check labor availability
    
    return risks;
  }

  /**
   * Scheduled job to update progress metrics
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateProgressMetrics(): Promise<void> {
    this.logger.debug('Updating progress metrics...');
    
    try {
      // Clear dashboard cache to force refresh
      await this.cacheService.del('progress:dashboard');
      
      // Check for delays
      const delays = await this.analyzeDelays();
      if (delays.length > 0) {
        this.logger.warn(`Found ${delays.length} delayed work orders`);
      }
      
      // Identify bottlenecks
      const bottlenecks = await this.identifyBottlenecks();
      if (bottlenecks.length > 0) {
        this.eventEmitter.emit('bottleneck.detected', bottlenecks);
      }
      
    } catch (error) {
      this.logger.error(`Failed to update progress metrics: ${error.message}`);
    }
  }
}