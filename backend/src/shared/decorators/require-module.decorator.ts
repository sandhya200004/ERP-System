import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify which module a route belongs to
 * Used with ModuleAccessGuard to enforce module-level access control
 * 
 * @param module - Module name (e.g., 'inventory', 'hr', 'procurement')
 * 
 * @example
 * @Controller('inventory')
 * @RequireModule('inventory')
 * export class InventoryController { ... }
 * 
 * @example
 * @Post('purchase-orders')
 * @RequireModule('procurement')
 * createPurchaseOrder() { ... }
 */
export const RequireModule = (module: string) => SetMetadata('module', module);
