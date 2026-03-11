import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to protect routes that should only be accessible by platform admins
 * Use @SetMetadata('platformAdminOnly', true) decorator on routes
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPlatformAdminOnly = this.reflector.get<boolean>(
      'platformAdminOnly',
      context.getHandler(),
    );

    if (!isPlatformAdminOnly) {
      return true; // Route doesn't require platform admin
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.is_platform_admin) {
      throw new ForbiddenException(
        'This endpoint is only accessible by platform administrators',
      );
    }

    return true;
  }
}
