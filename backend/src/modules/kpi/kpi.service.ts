import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { KpiScoreService } from '../../services/kpiScoreService';

@Injectable()
export class KpiService {
  constructor(
    private prisma: PrismaService,
    private kpiScoreService: KpiScoreService,
  ) {}

  async recalculateTaskScore(taskId: string) {
    const task = await this.prisma.employee_tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Transform task to match KPI service interface
    const taskData: any = {
      id: task.id,
      title: task.title,
      status: task.status,
      assigned_to: task.user_id,
      estimated_hours: task.estimated_hours ? parseFloat(task.estimated_hours.toString()) : undefined,
      actual_hours: task.actual_hours ? parseFloat(task.actual_hours.toString()) : undefined,
      deadline: task.deadline,
      completed_at: task.completed_at,
      started_at: task.started_at,
      submitted_at: task.submitted_at,
      complexity: task.complexity || 'medium',
      quality_score: task.quality_score ? parseFloat(task.quality_score.toString()) : undefined,
      peer_reviews: task.peer_reviews as any,
      proofs: task.proofs as any,
      auto_checks: task.auto_checks as any,
      required_checks: task.required_checks,
      penalty_pct: task.penalty_pct ? parseFloat(task.penalty_pct.toString()) : undefined,
    };

    // Calculate score
    const result = this.kpiScoreService.computeTaskScore(taskData);

    // Update task with new score
    const updatedTask = await this.prisma.employee_tasks.update({
      where: { id: taskId },
      data: {
        task_score: result.score,
        penalty_pct: result.breakdown.gamingPenaltyPct,
        updated_at: new Date(),
      },
    });

    return {
      taskId: updatedTask.id,
      taskScore: result.score,
      breakdown: result.breakdown,
    };
  }

  async getEmployeeKPI(employeeId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      user_id: employeeId,
      status: { in: ['completed', 'approved'] },
    };

    if (startDate || endDate) {
      where.completed_at = {};
      if (startDate) where.completed_at.gte = startDate;
      if (endDate) where.completed_at.lte = endDate;
    }

    const tasks = await this.prisma.employee_tasks.findMany({
      where,
      orderBy: { completed_at: 'desc' },
    });

    // Transform tasks
    const taskData = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assigned_to: task.user_id,
      estimated_hours: task.estimated_hours ? parseFloat(task.estimated_hours.toString()) : undefined,
      actual_hours: task.actual_hours ? parseFloat(task.actual_hours.toString()) : undefined,
      deadline: task.deadline,
      completed_at: task.completed_at,
      started_at: task.started_at,
      complexity: task.complexity || 'medium',
      quality_score: task.quality_score ? parseFloat(task.quality_score.toString()) : undefined,
      peer_reviews: task.peer_reviews as any,
      proofs: task.proofs as any,
      auto_checks: task.auto_checks as any,
      required_checks: task.required_checks,
    }));

    // Calculate KPI
    const kpiResult = this.kpiScoreService.computeEmployeeKPI(taskData as any);

    // Get employee profile for role
    const employee = await this.prisma.employee_profiles.findFirst({
      where: { user_id: employeeId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return {
      employeeId,
      employeeName: employee
        ? `${employee.users.first_name} ${employee.users.last_name}`
        : 'Unknown',
      role: employee?.role,
      kpiScore: kpiResult,
      stats: {
        totalTasks: taskData.length,
        completedTasks: taskData.filter((t) => t.status === 'completed').length,
      },
      period: {
        startDate,
        endDate,
      },
    };
  }

  async getTeamKPI(companyId: string, startDate?: Date, endDate?: Date) {
    // Get all employees in the company
    const employees = await this.prisma.employee_profiles.findMany({
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    const employeeKPIs = [];

    for (const employee of employees) {
      const kpi = await this.getEmployeeKPI(employee.user_id, startDate, endDate);
      employeeKPIs.push(kpi);
    }

    // Calculate role statistics for normalization
    const roleStats: any = {};
    const employeeScores = employeeKPIs.map((e) => ({
      employee_id: e.employeeId,
      role: e.role || 'EMPLOYEE',
      score: e.kpiScore,
    }));

    // Get unique roles
    const roles = [...new Set(employeeScores.map((e) => e.role))];

    for (const role of roles) {
      roleStats[role] = this.kpiScoreService.calculateRoleStats(employeeScores, role);
    }

    // Normalize scores
    const normalizedKPIs = employeeKPIs.map((kpi) => {
      const role = kpi.role || 'EMPLOYEE';
      const stats = roleStats[role];

      const normalizedScore =
        stats.count > 1
          ? this.kpiScoreService.normalizeByRole(kpi.kpiScore, stats.mean, stats.stddev)
          : kpi.kpiScore;

      return {
        ...kpi,
        normalizedScore,
        roleStats: stats,
      };
    });

    return {
      companyId,
      employeeStats: normalizedKPIs,
      roleStats,
      period: {
        startDate,
        endDate,
      },
    };
  }

  async getKPIHistory(employeeId: string, limit: number = 12) {
    const history = await this.prisma.employee_kpi_history.findMany({
      where: { employee_id: employeeId },
      orderBy: { period_end: 'desc' },
      take: limit,
    });

    return history.map((record: any) => ({
      id: record.id,
      periodStart: record.period_start,
      periodEnd: record.period_end,
      totalTasks: record.total_tasks,
      completedTasks: record.completed_tasks,
      avgTaskScore: record.avg_task_score,
      normalizedScore: record.normalized_score,
      percentile: record.percentile,
      roleStats: {
        mean: record.role_mean,
        stddev: record.role_stddev,
      },
      breakdown: {
        timeliness: record.timeliness_score,
        quality: record.quality_score,
        effortAccuracy: record.effort_accuracy_score,
        peerScore: record.peer_score,
        gamingPenalty: record.gaming_penalty_total,
      },
      remarks: record.remarks,
      createdAt: record.created_at,
    }));
  }

  async publishMonthlyKPI(employeeId: string, periodStart: Date, periodEnd: Date) {
    const kpiData = await this.getEmployeeKPI(employeeId, periodStart, periodEnd);

    // Get all tasks for detailed breakdown
    const tasks = await this.prisma.employee_tasks.findMany({
      where: {
        user_id: employeeId,
        completed_at: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: 'completed',
      },
    });

    // Calculate breakdown scores
    const timelinessScores = [];
    const qualityScores = [];
    const effortAccuracyScores = [];
    const peerScores = [];
    let totalPenalty = 0;

    for (const task of tasks) {
      const taskData: any = {
        estimated_hours: task.estimated_hours ? parseFloat(task.estimated_hours.toString()) : undefined,
        actual_hours: task.actual_hours ? parseFloat(task.actual_hours.toString()) : undefined,
        deadline: task.deadline,
        completed_at: task.completed_at,
        started_at: task.started_at,
        complexity: task.complexity || 'medium',
        quality_score: task.quality_score ? parseFloat(task.quality_score.toString()) : undefined,
        peer_reviews: task.peer_reviews as any,
        proofs: task.proofs as any,
        auto_checks: task.auto_checks as any,
      };

      timelinessScores.push(this.kpiScoreService.computeTimeliness(taskData));
      qualityScores.push(taskData.quality_score || 75);
      effortAccuracyScores.push(
        this.kpiScoreService.computeEffortAccuracy(taskData.estimated_hours, taskData.actual_hours),
      );
      peerScores.push(this.kpiScoreService.computePeerScore(taskData.peer_reviews));
      totalPenalty += this.kpiScoreService.detectGamingPatterns(taskData);
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    // Save to history
    const companyId = await this.getEmployeeCompanyId(employeeId) || '';
    const record = await this.prisma.employee_kpi_history.create({
      data: {
        id: require('crypto').randomUUID(),
        employee_id: employeeId,
        company_id: companyId,
        period_start: periodStart,
        period_end: periodEnd,
        total_tasks: kpiData.stats.totalTasks,
        completed_tasks: kpiData.stats.completedTasks,
        avg_task_score: kpiData.kpiScore,
        normalized_score: kpiData.kpiScore,
        timeliness_score: avg(timelinessScores),
        quality_score: avg(qualityScores),
        effort_accuracy_score: avg(effortAccuracyScores),
        peer_score: avg(peerScores),
        gaming_penalty_total: totalPenalty,
        updated_at: new Date(),
      },
    });

    return record;
  }

  private async getEmployeeCompanyId(employeeId: string): Promise<string | null> {
    const task = await this.prisma.employee_tasks.findFirst({
      where: { user_id: employeeId },
      select: { company_id: true },
    });
    return task?.company_id || null;
  }
}
