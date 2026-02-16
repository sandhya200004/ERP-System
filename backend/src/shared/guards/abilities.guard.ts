import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { defineAbilityFor } from '../casl/casl-ability.factory';
import { CHECK_ABILITY, RequiredRule } from '../decorators/check-abilities.decorator';

/**
 * CASL Guard - Enforces ABAC authorization on routes
 * Automatically checks user permissions before allowing access
 */
@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rules = this.reflector.get<RequiredRule[]>(CHECK_ABILITY, context.getHandler()) || [];

    if (!rules.length) {
      return true; // No rules defined, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability = defineAbilityFor(user);

    // Check all rules - ALL must pass
    for (const rule of rules) {
      if (!ability.can(rule.action, rule.subject)) {
        throw new ForbiddenException(
          `User does not have permission to ${rule.action} ${rule.subject}`,
        );
      }
    }

    return true;
  }
}
