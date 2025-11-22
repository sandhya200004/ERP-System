import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateEmployeeTaskDto, UpdateEmployeeTaskDto, EmployeeTaskQueryDto } from './dto/employee-task.dto';

@Injectable()
export class EmployeeTaskService {
  constructor(private prisma: PrismaService) {}

  async create(user_id: string, company_id: string, dto: CreateEmployeeTaskDto) {
    const task = await this.prisma.employee_tasks.create({
      data: {
        id: randomUUID(),
        user_id,
        company_id,
        date: new Date(dto.date),
        title: dto.title,
        description: dto.description || null,
        category: dto.category || null,
        priority: dto.priority,
        status: dto.status,
        hours_spent: dto.hoursSpent,
        completed_at: dto.status === 'completed' ? new Date() : null,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return task;
  }

  async findMyTasks(user_id: string, company_id: string, query: EmployeeTaskQueryDto) {
    const where: any = {
      user_id,
      company_id,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;

    const tasks = await this.prisma.employee_tasks.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return tasks;
  }

  async findTeamTasks(company_id: string, query: EmployeeTaskQueryDto) {
    const where: any = {
      company_id,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;

    const tasks = await this.prisma.employee_tasks.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return tasks;
  }

  async findOne(id: string, user_id: string, company_id: string, isAdmin: boolean) {
    const task = await this.prisma.employee_tasks.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.company_id !== company_id) {
      throw new ForbiddenException('Access denied');
    }

    // Regular employees can only view their own tasks
    if (!isAdmin && task.user_id !== user_id) {
      throw new ForbiddenException('You can only view your own tasks');
    }

    return task;
  }

  async update(id: string, user_id: string, company_id: string, isAdmin: boolean, dto: UpdateEmployeeTaskDto) {
    const task = await this.findOne(id, user_id, company_id, isAdmin);

    // Regular employees can only update their own tasks
    if (!isAdmin && task.user_id !== user_id) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    const updatedTask = await this.prisma.employee_tasks.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.status && { 
          status: dto.status,
          ...(dto.status === 'completed' && !task.completed_at && { completed_at: new Date() })
        }),
        ...(dto.hoursSpent !== undefined && { hoursSpent: dto.hoursSpent }),
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return updatedTask;
  }

  async remove(id: string, user_id: string, company_id: string, isAdmin: boolean) {
    const task = await this.findOne(id, user_id, company_id, isAdmin);

    // Regular employees can only delete their own tasks
    if (!isAdmin && task.user_id !== user_id) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    await this.prisma.employee_tasks.delete({
      where: { id },
    });

    return { message: 'Task deleted successfully' };
  }

  async getMyKPIMetrics(user_id: string, company_id: string, startDate?: string, endDate?: string) {
    const where: any = {
      user_id,
      company_id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const tasks = await this.prisma.employee_tasks.findMany({
      where,
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const pendingTasks = tasks.filter((t: any) => t.status === 'pending').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
    const totalHours = tasks.reduce((sum: number, t: any) => sum + Number(t.hoursSpent), 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Group by category
    const tasksByCategory = tasks.reduce((acc: any, task: any) => {
      const category = task.category || 'Uncategorized';
      if (!acc[category]) acc[category] = 0;
      acc[category]++;
      return acc;
    }, {} as Record<string, number>);

    // Group by priority
    const tasksByPriority = tasks.reduce((acc: any, task: any) => {
      if (!acc[task.priority]) acc[task.priority] = 0;
      acc[task.priority]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalHours,
      completionRate: Math.round(completionRate),
      tasksByCategory,
      tasksByPriority,
      averageHoursPerTask: totalTasks > 0 ? Math.round((totalHours / totalTasks) * 10) / 10 : 0,
    };
  }

  async getTeamKPIMetrics(company_id: string, startDate?: string, endDate?: string) {
    const where: any = {
      company_id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const tasks = await this.prisma.employee_tasks.findMany({
      where,
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

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const totalHours = tasks.reduce((sum: number, t: any) => sum + Number(t.hoursSpent), 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Group by employee
    const tasksByEmployee = tasks.reduce((acc: any, task: any) => {
      const employeeName = `${task.users.first_name} ${task.users.last_name}`;
      if (!acc[employeeName]) {
        acc[employeeName] = {
          total: 0,
          completed: 0,
          hours: 0,
        };
      }
      acc[employeeName].total++;
      if (task.status === 'completed') acc[employeeName].completed++;
      acc[employeeName].hours += task.hoursSpent;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate completion rates
    const employeeStats = Object.entries(tasksByEmployee).map(([name, stats]: [string, any]) => ({
      name,
      totalTasks: stats.total,
      completedTasks: stats.completed,
      totalHours: stats.hours,
      completionRate: Math.round((stats.completed / stats.total) * 100),
    }));

    return {
      totalTasks,
      completedTasks,
      totalHours,
      completionRate: Math.round(completionRate),
      totalEmployees: Object.keys(tasksByEmployee).length,
      employeeStats,
      averageTasksPerEmployee: employeeStats.length > 0 ? Math.round(totalTasks / employeeStats.length) : 0,
    };
  }
}
