import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Module Access Guard
 * Checks if a module is enabled for the company before allowing access
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, ModuleAccessGuard)
 * @RequireModule('inventory')
 * @Controller('inventory')
 */
@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required module from decorator
    const requiredModule = this.reflector.get<string>(
      'module',
      context.getHandler(),
    ) || this.reflector.get<string>('module', context.getClass());

    // If no module specified, allow access
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const companyId = request.companyId;

    // If no company context, deny (shouldn't happen with tenant middleware)
    if (!companyId) {
      throw new ForbiddenException('Company context required');
    }

    // Get company settings
    const company = await this.prisma.companies.findUnique({
      where: { id: companyId },
      select: { settings: true, subscription_plan: true },
    });

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    const settings = company.settings as any || {};
    const enabledModules = settings.enabled_modules || {};

    // Check if module is explicitly disabled
    if (enabledModules[requiredModule] === false) {
      throw new ForbiddenException(
        `The ${requiredModule} module is not available for your subscription plan`,
      );
    }

    // Check subscription-based restrictions
    const moduleSubscriptionLimits = this.getModuleLimitsByPlan(company.subscription_plan);
    if (moduleSubscriptionLimits[requiredModule] === false) {
      throw new ForbiddenException(
        `The ${requiredModule} module requires a higher subscription plan`,
      );
    }

    return true;
  }

  private getModuleLimitsByPlan(plan: string): Record<string, boolean> {
    const limits = {
      trial: {
        sales: true,
        finance: true,
        inventory: false,    // Only in paid plans
        hr: false,           // Only in paid plans
        procurement: false,  // Only in professional+
        reports: true,
        crm: true,
      },
      basic: {
        sales: true,
        finance: true,
        inventory: true,
        hr: true,
        procurement: false,  // Only in professional+
        reports: true,
        crm: true,
      },
      professional: {
        sales: true,
        finance: true,
        inventory: true,
        hr: true,
        procurement: true,
        reports: true,
        crm: true,
      },
      enterprise: {
        // All modules enabled
        sales: true,
        finance: true,
        inventory: true,
        hr: true,
        procurement: true,
        reports: true,
        crm: true,
      },
    };

    return limits[plan] || limits.trial;
  }
}
