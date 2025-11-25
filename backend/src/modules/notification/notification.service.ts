import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_SUBMITTED = 'TASK_SUBMITTED',
  TASK_APPROVED = 'TASK_APPROVED',
  TASK_REJECTED = 'TASK_REJECTED',
  TASK_DEADLINE_NEAR = 'TASK_DEADLINE_NEAR',
  KPI_PUBLISHED = 'KPI_PUBLISHED',
  PEER_REVIEW_REQUEST = 'PEER_REVIEW_REQUEST',
}

interface NotificationData {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data?: any;
  companyId?: string;
  actionUrl?: string;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(notificationData: NotificationData) {
    const notification = await this.prisma.notifications.create({
      data: {
        id: this.generateUUID(),
        user_id: notificationData.userId,
        company_id: notificationData.companyId || notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        action_url: notificationData.actionUrl || null,
        is_read: false,
      },
    });

    // TODO: Send real-time notification via WebSocket
    // TODO: Send email if enabled in user settings

    return notification;
  }

  async findByUser(userId: string, unreadOnly: boolean = false) {
    const where: any = { user_id: userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notifications.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async notifyTaskAssigned(taskId: string, assignedToId: string, assignedByName: string, taskTitle: string, companyId: string) {
    await this.create({
      type: NotificationType.TASK_ASSIGNED,
      userId: assignedToId,
      companyId,
      title: 'New Task Assigned',
      message: `${assignedByName} assigned you a task: "${taskTitle}"`,
      data: { taskId },
    });
  }

  async notifyTaskSubmitted(taskId: string, managerId: string, employeeName: string, taskTitle: string, companyId: string) {
    await this.create({
      type: NotificationType.TASK_SUBMITTED,
      userId: managerId,
      companyId,
      title: 'Task Submitted for Approval',
      message: `${employeeName} submitted task: "${taskTitle}" for your approval`,
      data: { taskId },
    });
  }

  async notifyTaskApproved(taskId: string, employeeId: string, taskTitle: string, companyId: string, qualityScore?: number) {
    await this.create({
      type: NotificationType.TASK_APPROVED,
      userId: employeeId,
      companyId,
      title: 'Task Approved',
      message: `Your task "${taskTitle}" has been approved${qualityScore ? ` with a quality score of ${qualityScore}` : ''}`,
      data: { taskId, qualityScore },
    });
  }

  async notifyTaskRejected(taskId: string, employeeId: string, taskTitle: string, feedback: string, companyId: string) {
    await this.create({
      type: NotificationType.TASK_REJECTED,
      userId: employeeId,
      companyId,
      title: 'Task Needs Revision',
      message: `Your task "${taskTitle}" needs revision. Feedback: ${feedback}`,
      data: { taskId, feedback },
    });
  }

  async notifyDeadlineNear(taskId: string, employeeId: string, taskTitle: string, hoursRemaining: number, companyId: string) {
    await this.create({
      type: NotificationType.TASK_DEADLINE_NEAR,
      userId: employeeId,
      companyId,
      title: 'Task Deadline Approaching',
      message: `Task "${taskTitle}" is due in ${hoursRemaining} hours`,
      data: { taskId, hoursRemaining },
    });
  }

  async notifyKPIPublished(employeeId: string, period: string, score: number, companyId: string) {
    await this.create({
      type: NotificationType.KPI_PUBLISHED,
      userId: employeeId,
      companyId,
      title: 'KPI Report Published',
      message: `Your KPI report for ${period} is now available. Score: ${score}`,
      data: { period, score },
    });
  }

  private generateUUID(): string {
    return require('crypto').randomUUID();
  }
}
