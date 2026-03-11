import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenant information from request
 * Usage: @Tenant() tenant: TenantInfo
 */
export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);

/**
 * Decorator to check if request is from platform admin
 * Usage: @IsPlatformAdmin() isPlatformAdmin: boolean
 */
export const IsPlatformAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.isPlatformAdmin || false;
  },
);

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  max_users: number;
  max_branches: number;
  max_storage_gb?: number;
  settings: any;
  trial_ends_at?: Date;
  subscription_ends_at?: Date;
}
