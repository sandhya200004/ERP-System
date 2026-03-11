import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subjects = 
  | 'User' 
  | 'Employee' 
  | 'Task' 
  | 'Invoice' 
  | 'Payment' 
  | 'Customer' 
  | 'Vendor'
  | 'PurchaseOrder'
  | 'Inventory'
  | 'Report'
  | 'Settings'
  | 'Salary'
  | 'Attendance'
  | 'KPI'
  | 'SecurityMetrics'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export interface User {
  id: string;
  email: string;
  role: string;
  employeeId?: string;
  department?: string;
}

/**
 * CASL Ability Factory - Enterprise-grade Authorization
 * Implements ABAC (Attribute-Based Access Control)
 */
export function defineAbilityFor(user: User): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // ====================
  // ADMIN - System Administrator (Full Access)
  // ====================
  if (user.role === 'ADMIN') {
    can('manage', 'all'); // Full system access
  }

  // ====================
  // CEO - Full System Access
  // ====================
  else if (user.role === 'CEO') {
    can('manage', 'all'); // Can do everything
  }

  // ====================
  // CTO - Technical & System Access
  // ====================
  else if (user.role === 'CTO') {
    can('manage', 'all');
    can('manage', 'Settings');
    can('manage', 'Report');
  }

  // ====================
  // CMO - Marketing & Operations
  // ====================
  else if (user.role === 'CMO') {
    can('manage', 'Customer');
    can('manage', 'Vendor');
    can('read', 'Report');
    can('read', 'Invoice');
    can('read', 'Task');
    can('update', 'Task'); // Can manage tasks
    cannot('read', 'Salary'); // Cannot see salaries
  }

  // ====================
  // HR - Employee & Attendance Management
  // ====================
  else if (user.role === 'HR') {
    can('manage', 'Employee');
    can('manage', 'Attendance');
    can('manage', 'Salary');
    can('read', 'Task');
    can('read', 'KPI');
    cannot('manage', 'Invoice');
    cannot('manage', 'Payment');
    cannot('manage', 'Settings');
  }

  // ====================
  // MANAGER - Team & Task Management
  // ====================
  else if (user.role === 'MANAGER') {
    can('read', 'Employee');
    can('read', 'Task'); // Can see all team tasks
    can('update', 'Task'); // Can approve/manage tasks
    can('read', 'KPI');
    can('create', 'Task');
    can('read', 'Report');
    can('read', 'Customer');
    cannot('read', 'Salary');
    cannot('manage', 'Settings');
  }

  // ====================
  // DEVELOPER - Own Tasks & Projects
  // ====================
  else if (user.role === 'DEVELOPER') {
    can('read', 'Task'); // Simplified - check in service layer
    can('create', 'Task');
    can('update', 'Task');
    can('read', 'KPI');
    can('read', 'Employee');
    cannot('read', 'Salary');
    cannot('manage', 'Invoice');
    cannot('manage', 'Payment');
  }

  // ====================
  // DESIGNER - Own Tasks & Design Projects
  // ====================
  else if (user.role === 'DESIGNER') {
    can('read', 'Task');
    can('create', 'Task');
    can('update', 'Task');
    can('read', 'KPI');
    can('read', 'Employee');
    cannot('read', 'Salary');
    cannot('manage', 'Invoice');
  }

  // ====================
  // MARKETING - Campaigns & Customer Management
  // ====================
  else if (user.role === 'MARKETING') {
    can('read', 'Customer');
    can('create', 'Customer');
    can('update', 'Customer');
    can('read', 'Task');
    can('create', 'Task');
    can('update', 'Task');
    can('read', 'Report');
    cannot('read', 'Salary');
    cannot('manage', 'Invoice');
  }

  // ====================
  // RND - Research & Development
  // ====================
  else if (user.role === 'RND') {
    can('read', 'Task');
    can('create', 'Task');
    can('update', 'Task');
    can('read', 'Employee');
    can('read', 'Inventory'); // Research might need inventory data
    cannot('read', 'Salary');
    cannot('manage', 'Invoice');
  }

  // ====================
  // EMPLOYEE - Basic Access (Default)
  // ====================
  else if (user.role === 'EMPLOYEE') {
    can('read', 'Task');
    can('create', 'Task');
    can('update', 'Task');
    can('read', 'Employee');
    can('read', 'Attendance');
    cannot('read', 'Salary');
    cannot('manage', 'Invoice');
    cannot('manage', 'Payment');
    cannot('read', 'Report');
  }

  // ====================
  // SPECIAL RULES - Complex Conditions
  // ====================
  
  // Inventory access for specific departments
  if (['CEO', 'CTO', 'CMO', 'MANAGER'].includes(user.role)) {
    can('manage', 'Inventory');
    can('manage', 'PurchaseOrder');
  }

  // Financial modules - Only executives and HR
  if (['CEO', 'CTO', 'HR'].includes(user.role)) {
    can('manage', 'Invoice');
    can('manage', 'Payment');
    can('read', 'Report');
  }

  return build();
}

/**
 * Check if user can perform an action on a subject
 * Usage: if (ability.can('read', 'Task')) { ... }
 * 
 * Note: For row-level checks (e.g., userId === user.id),
 * implement in service layer, not here
 */
export function checkAbility(
  ability: AppAbility,
  action: Actions,
  subject: Subjects,
): boolean {
  return ability.can(action, subject);
}
