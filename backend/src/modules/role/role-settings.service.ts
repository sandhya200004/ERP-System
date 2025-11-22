import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { randomUUID } from 'crypto';
import {
  CreatePermissionDto,
  UpdateRolePermissionsDto,
  ToggleFeatureDto,
  BulkUpdatePermissionsDto,
} from './dto/role-settings.dto';

@Injectable()
export class RoleSettingsService {
  constructor(private prisma: PrismaService) {}

  // Feature to Permission mapping
  private readonly featurePermissionMap: Record<string, string[]> = {
    'customer-management': ['customers:create', 'customers:read', 'customers:update', 'customers:delete'],
    'invoice-management': ['invoices:create', 'invoices:read', 'invoices:update', 'invoices:delete', 'invoices:finalize'],
    'payment-management': ['payments:create', 'payments:read', 'payments:update', 'payments:delete'],
    'item-management': ['items:create', 'items:read', 'items:update', 'items:delete'],
    'quote-management': ['quotes:create', 'quotes:read', 'quotes:update', 'quotes:delete', 'quotes:send'],
    'dashboard': ['reports:view-financials', 'reports:view-sales'],
    'reports': ['reports:view-financials', 'reports:view-sales', 'reports:view-ar', 'reports:export'],
    'user-management': ['users:create', 'users:read', 'users:update', 'users:delete'],
    'role-management': ['roles:create', 'roles:read', 'roles:update', 'roles:delete', 'roles:assign'],
    'company-settings': ['settings:read', 'settings:update', 'companies:update'],
    'attendance': ['attendance:mark', 'attendance:view-own', 'attendance:view-all'],
    'kpi-tasks': ['tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete', 'kpi:view-own', 'kpi:view-all'],
  };

  /**
   * Get all roles with their permissions for a company
   */
  async getAllRolesWithPermissions(company_id: string) {
    const roles = await this.prisma.roles.findMany({
      where: { company_id },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.is_system_role,
      permissions: role.role_permissions.map((rp: any) => ({
        id: rp.permissions.id,
        name: rp.permissions.name,
        resource: rp.permissions.resource,
        action: rp.permissions.action,
        description: rp.permissions.description,
      })),
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    }));
  }

  /**
   * Get all available permissions grouped by resource
   */
  async getAllPermissions() {
    const permissions = await this.prisma.permissions.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource
    const grouped = permissions.reduce(
      (acc: any, perm: any) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push({
          id: perm.id,
          name: perm.name,
          action: perm.action,
          description: perm.description,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return {
      permissions,
      grouped,
      features: this.getFeaturesList(),
    };
  }

  /**
   * Get features list with their permissions
   */
  getFeaturesList() {
    return Object.entries(this.featurePermissionMap).map(([key, permissions]) => ({
      key,
      name: key
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      permissions,
    }));
  }

  /**
   * Update permissions for a role
   */
  async updateRolePermissions(role_id: string, dto: UpdateRolePermissionsDto, userId: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id: role_id },
      include: { role_permissions: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Delete existing permissions
    await this.prisma.role_permissions.deleteMany({
      where: { role_id },
    });

    // Add new permissions
    if (dto.permissionIds.length > 0) {
      await this.prisma.role_permissions.createMany({
        data: dto.permissionIds.map((permission_id: string) => ({
          role_id,
          permission_id,
        })),
      });
    }

    // Create audit log
    await this.prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        company_id: role.company_id,
        user_id: userId,
        action: 'update',
        entity_type: 'role_permissions',
        entity_id: role_id,
         old_values: {
          permissions: role.role_permissions.map((rp) => rp.permission_id),
        },
         new_values: {
          permissions: dto.permissionIds,
        },
      },
    });

    return this.getAllRolesWithPermissions(role.company_id);
  }

  /**
   * Toggle feature for specific roles
   */
  async toggleFeature(dto: ToggleFeatureDto, company_id: string, userId: string) {
    const featurePermissions = this.featurePermissionMap[dto.featureKey];

    if (!featurePermissions) {
      throw new BadRequestException(`Unknown feature: ${dto.featureKey}`);
    }

    // Get permission IDs for this feature
    const permissions = await this.prisma.permissions.findMany({
      where: {
        name: { in: featurePermissions },
      },
    });

    const permissionIds = permissions.map((p) => p.id);

    // Update each role
    for (const role_id of dto.roleIds) {
      const role = await this.prisma.roles.findUnique({
        where: { id: role_id },
      });

      if (!role || role.company_id !== company_id) {
        continue;
      }

      if (dto.enabled) {
        // Add permissions
        await this.prisma.role_permissions.createMany({
          data: permissionIds.map((permission_id: string) => ({
            role_id,
            permission_id,
          })),
          skipDuplicates: true,
        });
      } else {
        // Remove permissions
        await this.prisma.role_permissions.deleteMany({
          where: {
            role_id,
            permission_id: { in: permissionIds },
          },
        });
      }

      // Audit log
      await this.prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          company_id,
          user_id: userId,
          action: dto.enabled ? 'enable_feature' : 'disable_feature',
          entity_type: 'role_feature',
          entity_id: role_id,
         new_values: {
            feature: dto.featureKey,
            enabled: dto.enabled,
            permissions: featurePermissions,
          },
        },
      });
    }

    return this.getAllRolesWithPermissions(company_id);
  }

  /**
   * Bulk update permissions (add and remove in one call)
   */
  async bulkUpdatePermissions(dto: BulkUpdatePermissionsDto, userId: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Remove permissions
    if (dto.removePermissions.length > 0) {
      await this.prisma.role_permissions.deleteMany({
        where: {
          role_id: dto.roleId,
          permission_id: { in: dto.removePermissions },
        },
      });
    }

    // Add permissions
    if (dto.addPermissions.length > 0) {
      await this.prisma.role_permissions.createMany({
        data: dto.addPermissions.map((permission_id: string) => ({
          role_id: dto.roleId,
          permission_id,
        })),
        skipDuplicates: true,
      });
    }

    // Audit log
    await this.prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        company_id: role.company_id,
        user_id: userId,
        action: 'bulk_update',
        entity_type: 'role_permissions',
        entity_id: dto.roleId,
         new_values: {
          added: dto.addPermissions,
          removed: dto.removePermissions,
        },
      },
    });

    return this.getAllRolesWithPermissions(role.company_id);
  }

  /**
   * Create a new permission
   */
  async createPermission(dto: CreatePermissionDto) {
    // Check if permission already exists
    const existing = await this.prisma.permissions.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Permission already exists');
    }

    return this.prisma.permissions.create({
      data: {
        id: randomUUID(),
        ...dto,
      },
    });
  }

  /**
   * Get role by ID with all permissions
   */
  async getRoleWithPermissions(role_id: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id: role_id },
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

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.is_system_role,
      permissions: role.role_permissions.map((rp: any) => rp.permissions),
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    };
  }

  /**
   * Check if a role has a specific feature enabled
   */
  async hasFeature(role_id: string, featureKey: string): Promise<boolean> {
    const featurePermissions = this.featurePermissionMap[featureKey];

    if (!featurePermissions) {
      return false;
    }

    const permissions = await this.prisma.permissions.findMany({
      where: {
        name: { in: featurePermissions },
      },
    });

    const permissionIds = permissions.map((p) => p.id);

    const rolePermissions = await this.prisma.role_permissions.findMany({
      where: {
        role_id,
        permission_id: { in: permissionIds },
      },
    });

    // Feature is enabled if role has ANY of the feature permissions
    return rolePermissions.length > 0;
  }
}
