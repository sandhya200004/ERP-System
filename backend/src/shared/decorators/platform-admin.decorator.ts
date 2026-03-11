import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as platform admin only
 * Usage: @PlatformAdminOnly()
 */
export const PlatformAdminOnly = () => SetMetadata('platformAdminOnly', true);
