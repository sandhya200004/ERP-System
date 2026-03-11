/**
 * EXAMPLE: How to apply Module Access Control
 * 
 * This shows how to protect entire modules so only companies
 * with that module enabled can access it.
 */

// ============================================
// STEP 1: Update Inventory Controller
// ============================================

import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../../shared/guards/module-access.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, ModuleAccessGuard)  // ✅ Add ModuleAccessGuard
@RequireModule('inventory')  // ✅ Specify required module
export class InventoryController {
  // ... controller methods
}

// ============================================
// STEP 2: Update Purchase Order Controller
// ============================================

@ApiTags('Procurement')
@ApiBearerAuth()
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, ModuleAccessGuard)  // ✅ Add ModuleAccessGuard
@RequireModule('procurement')  // ✅ Specify required module
export class PurchaseOrderController {
  // ... controller methods
}

// ============================================
// STEP 3: Platform Admin can configure per company
// ============================================

// Via Platform Admin Panel or API:

// Acme Corporation (Service-only company)
{
  "company_id": "acme-id",
  "settings": {
    "enabled_modules": {
      "sales": true,        // ✅ Can create quotes/invoices
      "finance": true,      // ✅ Can manage payments
      "crm": true,          // ✅ Can manage customers
      "reports": true,      // ✅ Can view reports
      "inventory": false,   // ❌ DISABLED - No inventory management
      "procurement": false, // ❌ DISABLED - No purchase orders
      "hr": true           // ✅ Can manage employees
    }
  }
}

// Tech Startup (Product company)
{
  "company_id": "techstartup-id",
  "settings": {
    "enabled_modules": {
      "sales": true,        // ✅ Can create quotes/invoices
      "finance": true,      // ✅ Can manage payments
      "crm": true,          // ✅ Can manage customers
      "reports": true,      // ✅ Can view reports
      "inventory": true,    // ✅ ENABLED - Can manage inventory
      "procurement": true,  // ✅ ENABLED - Can create POs
      "hr": true           // ✅ Can manage employees
    }
  }
}

// ============================================
// STEP 4: Frontend checks module availability
// ============================================

// In React/Angular frontend:

interface Company {
  settings: {
    enabled_modules: {
      inventory?: boolean;
      procurement?: boolean;
      // ... other modules
    };
  };
}

// In navigation menu:
const NavigationMenu = ({ company }: { company: Company }) => {
  const modules = company.settings.enabled_modules || {};
  
  return (
    <Menu>
      <MenuItem to="/dashboard">Dashboard</MenuItem>
      <MenuItem to="/customers">Customers</MenuItem>
      <MenuItem to="/invoices">Invoices</MenuItem>
      
      {/* Only show if module is enabled */}
      {modules.inventory && (
        <MenuItem to="/inventory">Inventory</MenuItem>
      )}
      
      {modules.procurement && (
        <MenuItem to="/purchase-orders">Purchase Orders</MenuItem>
      )}
      
      <MenuItem to="/reports">Reports</MenuItem>
    </Menu>
  );
};

// ============================================
// STEP 5: What happens when disabled?
// ============================================

// If Acme Corporation tries to access inventory:

// API Request:
GET /api/v1/inventory/stock-levels
Authorization: Bearer <acme_user_token>

// API Response:
{
  "statusCode": 403,
  "message": "The inventory module is not available for your subscription plan",
  "error": "Forbidden"
}

// ============================================
// STEP 6: Subscription Plan-based Limits
// ============================================

// Automatic restrictions based on plan:

const planModules = {
  trial: [
    'sales',      // ✅ Free
    'finance',    // ✅ Free
    'crm',        // ✅ Free
    'reports'     // ✅ Free
  ],
  
  basic: [
    'sales',      // ✅ Included
    'finance',    // ✅ Included
    'crm',        // ✅ Included
    'inventory',  // ✅ Included
    'hr',         // ✅ Included
    'reports'     // ✅ Included
  ],
  
  professional: [
    'sales',       // ✅ Included
    'finance',     // ✅ Included
    'crm',         // ✅ Included
    'inventory',   // ✅ Included
    'hr',          // ✅ Included
    'procurement', // ✅ Included (upgrade)
    'reports'      // ✅ Included
  ],
  
  enterprise: [
    // ✅ All modules + custom modules
  ]
};

// ============================================
// STEP 7: Platform Admin Dashboard Feature
// ============================================

// In Platform Admin Panel:

interface CompanyFormData {
  name: string;
  subdomain: string;
  subscription_plan: 'trial' | 'basic' | 'professional' | 'enterprise';
  
  // Custom module configuration
  enabled_modules: {
    sales: boolean;
    finance: boolean;
    inventory: boolean;
    hr: boolean;
    procurement: boolean;
    crm: boolean;
    reports: boolean;
  };
}

// ============================================
// RESULT
// ============================================

/*
✅ Acme Corporation sees:
  - Dashboard
  - Customers (CRM)
  - Quotes
  - Invoices
  - Payments
  - Reports
  - Employees
  
  NO inventory, NO purchase orders, NO warehouses
  
✅ Tech Startup sees:
  - Everything above PLUS:
  - Inventory Management
  - Stock Movements
  - Warehouses
  - Purchase Orders
  - Goods Receipts
  - Vendor Management
  
✅ Platform Admin controls, Company can't enable themselves
✅ Frontend hides unavailable features
✅ Backend blocks access with 403 Forbidden
✅ Subscription plan automatically sets defaults
✅ Custom overrides per company possible
*/
