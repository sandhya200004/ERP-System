import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export interface AuditLogData {
  companyId?: string;
  userId?: string;
  action: AuditAction;
  entity_type: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.audit_logs.create({
        data: {
        id: randomUUID(),
          company_id: data.companyId,
          user_id: data.userId,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entityId,
          old_values: data.oldValues,
          new_values: data.newValues,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit failures shouldn't break business logic
      console.error('Audit logging failed:', error);
    }
  }

  async logCreate(
    entity_type: string,
    entity_id: string,
    data: any,
    userId: string,
    companyId?: string,
  ): Promise<void> {
    await this.log({
      companyId,
      userId,
      action: AuditAction.CREATE,
      entity_type,
      entityId: entity_id,
      newValues: data,
    });
  }

  async logUpdate(
    entity_type: string,
    entity_id: string,
    oldData: any,
    newData: any,
    userId: string,
    companyId?: string,
  ): Promise<void> {
    await this.log({
      companyId,
      userId,
      action: AuditAction.UPDATE,
      entity_type,
      entityId: entity_id,
      oldValues: oldData,
      newValues: newData,
    });
  }

  async logDelete(
    entity_type: string,
    entity_id: string,
    data: any,
    userId: string,
    companyId?: string,
  ): Promise<void> {
    await this.log({
      companyId,
      userId,
      action: AuditAction.DELETE,
      entity_type,
      entityId: entity_id,
      oldValues: data,
    });
  }

  async logStatusChange(
    entity_type: string,
    entity_id: string,
    oldStatus: string,
    newStatus: string,
    userId: string,
    companyId?: string,
  ): Promise<void> {
    await this.log({
      companyId,
      userId,
      action: AuditAction.STATUS_CHANGE,
      entity_type,
      entityId: entity_id,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
    });
  }
}
