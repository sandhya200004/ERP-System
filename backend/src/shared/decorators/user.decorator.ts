import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract current user from request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Extract current company ID from request
 */
export const CurrentCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.companyId;
  },
);

/**
 * Extract current branch ID from request
 */
export const CurrentBranch = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.branchId;
  },
);
