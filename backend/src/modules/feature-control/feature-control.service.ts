import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';

export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  module: string;
  permissions: string[];
}

export interface FeatureToggleDto {
  roleId: string;
  featureKey: string;
  enabled: boolean;
}

@Injectable()
export class FeatureControlService {
  private readonly systemFeatures: FeatureDefinition[] = [
    {
      key: 'customers',
      name: 'Customer Management',
      description: 'View and manage customers',
      module: 'CRM',
      permissions: ['customers:read', 'customers:create', 'customers:update', 'customers:delete'],
    },
    {
      key: 'items',
      name: 'Product/Service Items',
      description: 'Manage inventory and service items',
      module: 'Inventory',
      permissions: ['items:read', 'items:create', 'items:update', 'items:delete'],
    },
    {
      key: 'quotes',
      name: 'Quotations',
      description: 'Create and manage quotes',
      module: 'Sales',
      permissions: ['quotes:read', 'quotes:create', 'quotes:update', 'quotes:delete', 'quotes:send', 'quotes:convert'],
    },
    {
      key: 'invoices',
      name: 'Invoicing',
      description: 'Create and manage invoices',
      module: 'Finance',
      permissions: ['invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete', 'invoices:finalize', 'invoices:send', 'invoices:cancel'],
    },
    {
      key: 'payments',
      name: 'Payment Processing',
      description: 'Record and track payments',
      module: 'Finance',
      permissions: ['payments:read', 'payments:create', 'payments:delete'],
    },
    {
      key: 'reports',
      name: 'Financial Reports',
      description: 'View financial reports and analytics',
      module: 'Finance',
      permissions: ['reports:read', 'reports:export'],
    },
    {
      key: 'attendance',
      name: 'Attendance Tracking',
      description: 'Check-in/out and attendance management',
      module: 'HR',
      permissions: ['attendance:read', 'attendance:checkin', 'attendance:checkout', 'attendance:manage'],
    },
    {
      key: 'tasks',
      name: 'Task Management',
      description: 'Create and track employee tasks',
      module: 'HR',
      permissions: ['tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete', 'tasks:assign'],
    },
    {
      key: 'users',
      name: 'User Management',
      description: 'Manage system users',
      module: 'Administration',
      permissions: ['users:read', 'users:create', 'users:update', 'users:delete'],
    },
    {
      key: 'roles',
      name: 'Role & Permission Management',
      description: 'Configure roles and permissions',
      module: 'Administration',
      permissions: ['roles:read', 'roles:create', 'roles:update', 'roles:delete', 'roles:assign'],
    },
  ];

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getAllFeatures(): Promise<FeatureDefinition[]> {
    return this.systemFeatures;
  }

  async getRoleFeatures(roleId: string, companyId: string): Promise<{
    role: any;
    features: Array<FeatureDefinition & { enabled: boolean }>;
  }> {
    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, company_id: companyId },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const rolePermissions = role.role_permissions.map((rp) => rp.permissions.name);

    const features = this.systemFeatures.map((feature) => {
      const hasAllPermissions = feature.permissions.every((perm) =>
        rolePermissions.includes(perm),
      );

      return {
        ...feature,
        enabled: hasAllPermissions,
      };
    });

    return { role, features };
  }

  async toggleFeature(
    roleId: string,
    companyId: string,
    userId: string,
    dto: FeatureToggleDto,
  ): Promise<{ success: boolean; message: string }> {
    const feature = this.systemFeatures.find((f) => f.key === dto.featureKey);
    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, company_id: companyId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Get all permission IDs for this feature
    const permissions = await this.prisma.permissions.findMany({
      where: { name: { in: feature.permissions } },
    });

    if (dto.enabled) {
      // Add all feature permissions to role
      const existingPerms = await this.prisma.role_permissions.findMany({
        where: {
          role_id: roleId,
          permission_id: { in: permissions.map((p) => p.id) },
        },
      });

      const existingPermIds = new Set(existingPerms.map((ep) => ep.permission_id));
      const toAdd = permissions.filter((p) => !existingPermIds.has(p.id));

      if (toAdd.length > 0) {
        await this.prisma.role_permissions.createMany({
          data: toAdd.map((p) => ({
            role_id: roleId,
            permission_id: p.id,
          })),
        });
      }
    } else {
      // Remove all feature permissions from role
      await this.prisma.role_permissions.deleteMany({
        where: {
          role_id: roleId,
          permission_id: { in: permissions.map((p) => p.id) },
        },
      });
    }

    await this.audit.log({
      companyId,
      userId,
      action: 'update' as any,
      entity_type: 'role_feature',
      entityId: roleId,
      oldValues: { [dto.featureKey]: !dto.enabled },
      newValues: { [dto.featureKey]: dto.enabled },
      ipAddress: undefined,
      userAgent: undefined,
    });

    return {
      success: true,
      message: `Feature ${dto.enabled ? 'enabled' : 'disabled'} successfully`,
    };
  }

  async getAllRolesWithFeatures(companyId: string): Promise<
    Array<{
      role: any;
      features: Array<FeatureDefinition & { enabled: boolean }>;
    }>
  > {
    const roles = await this.prisma.roles.findMany({
      where: { company_id: companyId },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return roles.map((role) => {
      const rolePermissions = role.role_permissions.map((rp) => rp.permissions.name);

      const features = this.systemFeatures.map((feature) => {
        const hasAllPermissions = feature.permissions.every((perm) =>
          rolePermissions.includes(perm),
        );

        return {
          ...feature,
          enabled: hasAllPermissions,
        };
      });

      return { role, features };
    });
  }
}
