import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateKpiTaskDto, SubmitTaskDto, ReviewTaskDto } from './dto/kpi-tasks.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class KpiTasksService {
  constructor(private prisma: PrismaService) {}

  // ADMIN: Create and assign task to employee
  async createTask(companyId: string, assignedBy: string, dto: CreateKpiTaskDto) {
    const task = await this.prisma.kpi_tasks.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        assigned_to: dto.assignedTo,
        assigned_by: assignedBy,
        title: dto.title,
        description: dto.description,
        weightage: dto.weightage,
        deadline: dto.deadline,
        status: 'PENDING',
        updated_at: new Date(),
      },
      include: {
        users_kpi_tasks_assigned_toTousers: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Task assigned successfully',
      task,
    };
  }

  // EMPLOYEE: Get my assigned tasks
  async getMyTasks(userId: string, companyId: string) {
    const tasks = await this.prisma.kpi_tasks.findMany({
      where: {
        assigned_to: userId,
        company_id: companyId,
      },
      include: {
        users_kpi_tasks_assigned_byTousers: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        kpi_submissions: {
          orderBy: {
            submitted_at: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return tasks;
  }

  // EMPLOYEE: Submit task
  async submitTask(userId: string, companyId: string, dto: SubmitTaskDto) {
    const task = await this.prisma.kpi_tasks.findUnique({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.assigned_to !== userId) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    if (task.company_id !== companyId) {
      throw new ForbiddenException('Task does not belong to your company');
    }

    if (task.status === 'APPROVED') {
      throw new BadRequestException('Task is already approved and cannot be resubmitted');
    }

    // Create submission
    const submission = await this.prisma.kpi_submissions.create({
      data: {
        id: randomUUID(),
        task_id: dto.taskId,
        user_id: userId,
        submission_note: dto.submissionNote,
        submitted_at: new Date(),
      },
    });

    // Update task status to SUBMITTED
    await this.prisma.kpi_tasks.update({
      where: { id: dto.taskId },
      data: {
        status: 'SUBMITTED',
        updated_at: new Date(),
      },
    });

    return {
      message: 'Task submitted successfully',
      submission,
    };
  }

  // ADMIN: Get all submitted tasks for review
  async getSubmittedTasks(companyId: string) {
    const tasks = await this.prisma.kpi_tasks.findMany({
      where: {
        company_id: companyId,
        status: 'SUBMITTED',
      },
      include: {
        users_kpi_tasks_assigned_toTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            employee_profiles: {
              select: {
                employee_id: true,
                designation: true,
                department: true,
              },
            },
          },
        },
        kpi_submissions: {
          orderBy: {
            submitted_at: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    return tasks;
  }

  // ADMIN: Approve or reject task
  async reviewTask(companyId: string, reviewedBy: string, dto: ReviewTaskDto) {
    const task = await this.prisma.kpi_tasks.findUnique({
      where: { id: dto.taskId },
      include: {
        kpi_submissions: {
          orderBy: {
            submitted_at: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.company_id !== companyId) {
      throw new ForbiddenException('Task does not belong to your company');
    }

    if (task.status !== 'SUBMITTED') {
      throw new BadRequestException('Task must be in SUBMITTED status to review');
    }

    // Update task status
    await this.prisma.kpi_tasks.update({
      where: { id: dto.taskId },
      data: {
        status: dto.status,
        updated_at: new Date(),
      },
    });

    // Update submission with feedback
    if (task.kpi_submissions[0]) {
      await this.prisma.kpi_submissions.update({
        where: { id: task.kpi_submissions[0].id },
        data: {
          feedback: dto.feedback,
          reviewed_at: new Date(),
          reviewed_by: reviewedBy,
        },
      });
    }

    // If approved, calculate and update KPI score
    if (dto.status === 'APPROVED') {
      await this.updateKpiScore(task.assigned_to, companyId);
    }

    return {
      message: `Task ${dto.status.toLowerCase()} successfully`,
    };
  }

  // Calculate KPI score for a user
  private async updateKpiScore(userId: string, companyId: string) {
    // Get all tasks for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const tasks = await this.prisma.kpi_tasks.findMany({
      where: {
        assigned_to: userId,
        company_id: companyId,
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    const totalWeightage = tasks.reduce((sum: number, task: any) => sum + task.weightage, 0);
    const approvedWeightage = tasks
      .filter((task: any) => task.status === 'APPROVED')
      .reduce((sum: number, task: any) => sum + task.weightage, 0);

    const kpiScore = totalWeightage > 0 ? (approvedWeightage / totalWeightage) * 100 : 0;

    // Update or create KPI record (you may need to adjust based on your schema)
    // This is a placeholder - adjust according to your actual kpi table structure
    console.log(`KPI Score for user ${userId}: ${kpiScore.toFixed(2)}%`);
    
    return kpiScore;
  }

  // ADMIN: Get all tasks (for dashboard/reports)
  async getAllTasks(companyId: string) {
    const tasks = await this.prisma.kpi_tasks.findMany({
      where: {
        company_id: companyId,
      },
      include: {
        users_kpi_tasks_assigned_toTousers: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            employee_profiles: {
              select: {
                employee_id: true,
                designation: true,
              },
            },
          },
        },
        users_kpi_tasks_assigned_byTousers: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return tasks;
  }

  // Get KPI statistics for a user
  async getUserKpiStats(userId: string, companyId: string) {
    const tasks = await this.prisma.kpi_tasks.findMany({
      where: {
        assigned_to: userId,
        company_id: companyId,
      },
    });

    const stats: any = {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === 'PENDING').length,
      submitted: tasks.filter((t: any) => t.status === 'SUBMITTED').length,
      approved: tasks.filter((t: any) => t.status === 'APPROVED').length,
      rejected: tasks.filter((t: any) => t.status === 'REJECTED').length,
      totalWeightage: tasks.reduce((sum: number, task: any) => sum + task.weightage, 0),
      approvedWeightage: tasks
        .filter((t: any) => t.status === 'APPROVED')
        .reduce((sum: number, task: any) => sum + task.weightage, 0),
    };

    stats.kpiScore = stats.totalWeightage > 0 
      ? (stats.approvedWeightage / stats.totalWeightage) * 100 
      : 0;

    return stats;
  }
}
