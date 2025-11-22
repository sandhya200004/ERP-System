import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';
import { RoleSettingsService } from './role-settings.service';
import {
  CreatePermissionDto,
  UpdateRolePermissionsDto,
  ToggleFeatureDto,
  BulkUpdatePermissionsDto,
} from './dto/role-settings.dto';

@ApiTags('Role Settings')
@ApiBearerAuth()
@Controller('role-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleSettingsController {
  constructor(private readonly roleSettingsService: RoleSettingsService) {}

  @Get('roles')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all roles with permissions' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getAllRolesWithPermissions(@CurrentUser() user: any) {
    return this.roleSettingsService.getAllRolesWithPermissions(user.companyId);
  }

  @Get('permissions')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getAllPermissions() {
    return this.roleSettingsService.getAllPermissions();
  }

  @Get('features')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all features list' })
  @ApiResponse({ status: 200, description: 'Features retrieved successfully' })
  getFeaturesList() {
    return this.roleSettingsService.getFeaturesList();
  }

  @Get('roles/:id')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get role with all permissions' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleWithPermissions(@Param('id') id: string) {
    return this.roleSettingsService.getRoleWithPermissions(id);
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('roles:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRolePermissions(
    @Param('id') roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser() user: any,
  ) {
    return this.roleSettingsService.updateRolePermissions(roleId, dto, user.userId);
  }

  @Post('toggle-feature')
  @RequirePermissions('roles:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle feature for roles' })
  @ApiResponse({ status: 200, description: 'Feature toggled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid feature key' })
  async toggleFeature(@Body() dto: ToggleFeatureDto, @CurrentUser() user: any) {
    return this.roleSettingsService.toggleFeature(dto, user.companyId, user.userId);
  }

  @Post('bulk-update')
  @RequirePermissions('roles:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update role permissions' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async bulkUpdatePermissions(@Body() dto: BulkUpdatePermissionsDto, @CurrentUser() user: any) {
    return this.roleSettingsService.bulkUpdatePermissions(dto, user.userId);
  }

  @Post('permissions')
  @RequirePermissions('roles:create')
  @ApiOperation({ summary: 'Create new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 400, description: 'Permission already exists' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.roleSettingsService.createPermission(dto);
  }

  @Get('roles/:id/features/:featureKey')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Check if role has feature enabled' })
  @ApiResponse({ status: 200, description: 'Feature status retrieved' })
  async hasFeature(@Param('id') roleId: string, @Param('featureKey') featureKey: string) {
    const hasFeature = await this.roleSettingsService.hasFeature(roleId, featureKey);
    return { roleId, featureKey, enabled: hasFeature };
  }
}
