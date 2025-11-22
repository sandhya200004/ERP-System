import { useAuthStore } from '../store/authStore';

/**
 * Hook to check if the current user has specific permissions
 * @param requiredPermissions - Array of permissions to check (e.g., ['customers:create', 'customers:update'])
 * @returns Object with hasPermission function and hasAllPermissions, hasAnyPermission helpers
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const userPermissions = user?.permissions || [];

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission);
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => userPermissions.includes(permission));
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => userPermissions.includes(permission));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    return user?.role?.name === roleName;
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    permissions: userPermissions,
  };
}
