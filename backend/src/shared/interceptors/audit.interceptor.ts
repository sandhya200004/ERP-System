import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Audit Trail Interceptor - Enterprise-grade activity logging
 * Automatically logs all POST, PUT, DELETE operations
 * Critical for compliance, security investigations, and debugging
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    // Only audit state-changing operations
    const auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!auditableMethods.includes(method)) {
      return next.handle();
    }

    // Skip audit endpoints themselves to avoid recursion
    if (url.includes('/audit') || url.includes('/health')) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async (response) => {
          const duration = Date.now() - startTime;

          try {
            // Extract entity information from URL
            const entityType = this.extractEntityType(url);
            const entityId = this.extractEntityId(url);

            // Determine action
            const action = this.mapMethodToAction(method);

            // Log to database (async - don't block response)
            await this.logAuditTrail({
              userId: user?.id || null,
              action,
              entityType,
              entityId,
              oldValues: null, // Would need to fetch before update
              newValues: method !== 'DELETE' ? body : null,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              endpoint: url,
              method,
              statusCode: 200,
              duration,
            });
          } catch (error) {
            // Never throw - logging failure shouldn't break the app
            this.logger.error(
              `Failed to log audit trail: ${error.message}`,
              error.stack,
            );
          }
        },
        error: async (error) => {
          const duration = Date.now() - startTime;

          try {
            await this.logAuditTrail({
              userId: user?.id || null,
              action: 'ERROR',
              entityType: this.extractEntityType(url),
              entityId: null,
              oldValues: null,
              newValues: { error: error.message },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              endpoint: url,
              method,
              statusCode: error.status || 500,
              duration,
            });
          } catch (logError) {
            this.logger.error(`Failed to log error audit: ${logError.message}`);
          }
        },
      }),
    );
  }

  private async logAuditTrail(data: {
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    oldValues: any;
    newValues: any;
    ipAddress: string;
    userAgent: string;
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
  }): Promise<void> {
    try {
      await this.prisma.audit_logs.create({
        data: {
          id: this.generateUUID(),
          user_id: data.userId,
          action: this.mapActionToAuditAction(data.action),
          entity_type: data.entityType,
          entity_id: data.entityId,
          old_values: data.oldValues ? JSON.stringify(data.oldValues) : undefined,
          new_values: data.newValues ? JSON.stringify(data.newValues) : undefined,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          created_at: new Date(),
        },
      });

      this.logger.log(
        `Audit: ${data.action} on ${data.entityType} by user ${data.userId} - ${data.statusCode} (${data.duration}ms)`,
      );
    } catch (error) {
      // Log but don't throw - audit logging is non-critical
      this.logger.error(`Audit log failed: ${error.message}`);
    }
  }

  private extractEntityType(url: string): string {
    const parts = url.split('/').filter(Boolean);
    
    // Remove 'api' and version prefix
    const filteredParts = parts.filter(p => p !== 'api' && !p.startsWith('v'));
    
    return filteredParts[0] || 'unknown';
  }

  private extractEntityId(url: string): string | null {
    const parts = url.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    
    // Check if last part looks like a UUID or numeric ID
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPart) ||
      /^\d+$/.test(lastPart)
    ) {
      return lastPart;
    }
    
    return null;
  }

  private mapMethodToAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return map[method] || method;
  }

  private mapActionToAuditAction(action: string): any {
    const map: Record<string, string> = {
      CREATE: 'create',
      UPDATE: 'update',
      DELETE: 'delete',
      ERROR: 'error',
    };
    return map[action] || 'other';
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
