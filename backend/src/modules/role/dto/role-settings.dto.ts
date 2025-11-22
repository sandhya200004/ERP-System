import { IsArray, IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'customers:view', description: 'Permission name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'customers', description: 'Resource name' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'view', description: 'Action type' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'View customer list', description: 'Permission description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'Array of permission IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class ToggleFeatureDto {
  @ApiProperty({ example: 'customer-management', description: 'Feature key' })
  @IsString()
  featureKey: string;

  @ApiProperty({ example: true, description: 'Enable or disable' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: ['role-id-1'], description: 'Array of role IDs' })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}

export class BulkUpdatePermissionsDto {
  @ApiProperty({ description: 'Role ID' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ description: 'Permission IDs to add', type: [String] })
  @IsArray()
  @IsString({ each: true })
  addPermissions: string[];

  @ApiProperty({ description: 'Permission IDs to remove', type: [String] })
  @IsArray()
  @IsString({ each: true })
  removePermissions: string[];
}
