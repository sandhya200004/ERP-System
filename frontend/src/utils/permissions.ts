import type { UserRole } from '../store/authStore';

// Define permissions for each feature
export const Permissions = {
  // Dashboard
  VIEW_DASHBOARD: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'],
  VIEW_ANALYTICS: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  
  // Customers
  VIEW_CUSTOMERS: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'MARKETING'],
  CREATE_CUSTOMERS: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  EDIT_CUSTOMERS: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  DELETE_CUSTOMERS: ['CEO', 'CTO', 'CMO'],
  
  // Invoices
  VIEW_INVOICES: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'],
  CREATE_INVOICES: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  EDIT_INVOICES: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  DELETE_INVOICES: ['CEO', 'CTO', 'CMO'],
  
  // Payments
  VIEW_PAYMENTS: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'],
  CREATE_PAYMENTS: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  DELETE_PAYMENTS: ['CEO', 'CTO', 'CMO'],
  
  // Items/Products
  VIEW_ITEMS: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'],
  CREATE_ITEMS: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  EDIT_ITEMS: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  DELETE_ITEMS: ['CEO', 'CTO', 'CMO'],
  
  // Quotes & Proposals
  VIEW_QUOTES: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  CREATE_QUOTES: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  EDIT_QUOTES: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  DELETE_QUOTES: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  
  // Leads
  VIEW_LEADS: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  CREATE_LEADS: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  EDIT_LEADS: ['CEO', 'CTO', 'CMO', 'MANAGER', 'MARKETING'],
  DELETE_LEADS: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  
  // Attendance
  VIEW_OWN_ATTENDANCE: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'RND', 'EMPLOYEE'],
  VIEW_ALL_ATTENDANCE: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'],
  MARK_ATTENDANCE: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'RND', 'EMPLOYEE'],
  
  // KPI
  VIEW_OWN_KPI: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'RND', 'EMPLOYEE'],
  UPDATE_OWN_KPI: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'RND', 'EMPLOYEE'],
  VIEW_ALL_KPI: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'],
  MANAGE_KPI: ['CEO', 'CTO', 'HR', 'MANAGER'],
  
  // Reports
  VIEW_REPORTS: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'],
  EXPORT_REPORTS: ['CEO', 'CTO', 'CMO', 'MANAGER'],
  
  // Settings
  VIEW_SETTINGS: ['CEO', 'CTO', 'CMO', 'HR'],
  MANAGE_USERS: ['CEO', 'CTO', 'HR'],
  MANAGE_COMPANY: ['CEO', 'CTO'],
  
  // Profile
  VIEW_PROFILE: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'RND', 'EMPLOYEE'],
  EDIT_PROFILE: ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'RND', 'EMPLOYEE'],
} as const;

export type Permission = keyof typeof Permissions;

/**
 * Check if a user has a specific permission based on their role
 */
export const hasPermission = (userRole: UserRole | undefined, permission: Permission): boolean => {
  if (!userRole) return false;
  return (Permissions[permission] as readonly string[]).includes(userRole);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has all specified permissions
 */
export const hasAllPermissions = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Check if user is an admin (CEO, CTO, or HR)
 */
export const isAdmin = (userRole: UserRole | undefined): boolean => {
  if (!userRole) return false;
  return ['CEO', 'CTO', 'HR'].includes(userRole);
};

/**
 * Check if user is management level (CEO, CTO, CMO, HR, Manager)
 */
export const isManagement = (userRole: UserRole | undefined): boolean => {
  if (!userRole) return false;
  return ['CEO', 'CTO', 'CMO', 'HR', 'MANAGER'].includes(userRole);
};

/**
 * Get menu items based on user role
 */
export const getMenuItemsForRole = (userRole: UserRole | undefined): string[] => {
  if (!userRole) return ['profile'];

  const menuItems: string[] = [];

  // Everyone gets profile
  menuItems.push('profile');

  // Attendance for all
  menuItems.push('attendance');

  // KPI for all (but they only see their own)
  menuItems.push('kpi');

  // Dashboard for management
  if (hasPermission(userRole, 'VIEW_DASHBOARD')) {
    menuItems.push('dashboard');
  }

  // Customers
  if (hasPermission(userRole, 'VIEW_CUSTOMERS')) {
    menuItems.push('customers');
  }

  // Invoices
  if (hasPermission(userRole, 'VIEW_INVOICES')) {
    menuItems.push('invoices');
  }

  // Payments
  if (hasPermission(userRole, 'VIEW_PAYMENTS')) {
    menuItems.push('payments');
  }

  // Items
  if (hasPermission(userRole, 'VIEW_ITEMS')) {
    menuItems.push('items');
  }

  // Quotes
  if (hasPermission(userRole, 'VIEW_QUOTES')) {
    menuItems.push('quotes');
  }

  // Proposals
  if (hasPermission(userRole, 'VIEW_QUOTES')) {
    menuItems.push('proposals');
  }

  // Leads
  if (hasPermission(userRole, 'VIEW_LEADS')) {
    menuItems.push('leads');
  }

  // Reports
  if (hasPermission(userRole, 'VIEW_REPORTS')) {
    menuItems.push('reports');
  }

  return menuItems;
};
