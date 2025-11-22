import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface PermissionGateProps {
  children: ReactNode;
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  fallback?: ReactNode;
  showError?: boolean; // If true, shows an error message instead of just hiding content
}

/**
 * Component to conditionally render content based on user permissions
 * 
 * @example
 * // User needs customers:create permission
 * <PermissionGate permissions={['customers:create']}>
 *   <Button>Create Customer</Button>
 * </PermissionGate>
 * 
 * @example
 * // User needs ALL of these permissions
 * <PermissionGate permissions={['invoices:create', 'invoices:update']} requireAll>
 *   <Button>Manage Invoice</Button>
 * </PermissionGate>
 * 
 * @example
 * // Show error page if no permission
 * <PermissionGate permissions={['reports:read']} showError>
 *   <ReportsPage />
 * </PermissionGate>
 */
export default function PermissionGate({
  children,
  permissions = [],
  requireAll = false,
  fallback = null,
  showError = false,
}: PermissionGateProps) {
  const { hasAllPermissions, hasAnyPermission } = usePermissions();
  const navigate = useNavigate();

  if (permissions.length === 0) {
    // No permissions required, always show content
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    if (showError) {
      return (
        <div style={{ padding: '100px 24px', textAlign: 'center' }}>
          <Result
            status="403"
            icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
            title="Access Denied"
            subTitle={`You don't have permission to access this resource. Required permissions: ${permissions.join(', ')}`}
            extra={
              <Button type="primary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            }
          />
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
