import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';
import { FeatureControlService, FeatureToggleDto } from './feature-control.service';

@ApiTags('Feature Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('feature-control')
export class FeatureControlController {
  constructor(private readonly featureControlService: FeatureControlService) {}

  @Get('features')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all available system features' })
  async getAllFeatures(@CurrentUser() user: any) {
    return {
      success: true,
      data: await this.featureControlService.getAllFeatures(),
    };
  }

  @Get('roles/:roleId/features')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get features enabled for a specific role' })
  async getRoleFeatures(
    @Param('roleId') roleId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.featureControlService.getRoleFeatures(
      roleId,
      user.companyId,
    );
    return { success: true, data };
  }

  @Get('roles/features/all')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all roles with their feature access' })
  async getAllRolesWithFeatures(@CurrentUser() user: any) {
    const data = await this.featureControlService.getAllRolesWithFeatures(
      user.companyId,
    );
    return { success: true, data };
  }

  @Post('roles/:roleId/toggle')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Toggle feature access for a role' })
  async toggleFeature(
    @Param('roleId') roleId: string,
    @Body() dto: FeatureToggleDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.featureControlService.toggleFeature(
      roleId,
      user.companyId,
      user.userId,
      dto,
    );
    return result;
  }
}
