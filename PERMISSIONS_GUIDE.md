# Permission System Documentation

## Overview
The TriVerse ERP feature control system allows CEO/CTO/CMO to dynamically enable or disable features for different roles. Changes take effect immediately.

## Backend Components

### Feature Control Service
Located: `backend/src/modules/feature-control/feature-control.service.ts`

**System Features (10 total):**
- **CRM Module:** Customer Management
- **Inventory Module:** Item Management, Inventory Management
- **Sales Module:** Quotes, Invoicing
- **Finance Module:** Payments, Reports
- **HR Module:** Attendance, Tasks
- **Administration Module:** User Management, Role Management

Each feature has associated permissions (e.g., `customers:read`, `customers:create`, `customers:update`, `customers:delete`)

### API Endpoints
```
GET  /api/v1/feature-control/features                     - Get all system features
GET  /api/v1/feature-control/roles/:roleId/features       - Get features for a role
GET  /api/v1/feature-control/roles/features/all          - Get all roles with features
POST /api/v1/feature-control/roles/:roleId/toggle        - Toggle feature for role
```

**Toggle Request Body:**
```json
{
  "featureKey": "customers",
  "enabled": true
}
```

## Frontend Components

### 1. Feature Control Page
**File:** `frontend/src/pages/FeatureControlPage.tsx`

Full admin interface for managing features:
- Role selector dropdown
- Features grouped by module (CRM, Inventory, Sales, Finance, HR, Administration)
- Toggle switches for each feature
- Real-time status indicators
- Audit trail information

**Access:** Only users with `roles:read` and `roles:update` permissions

### 2. usePermissions Hook
**File:** `frontend/src/hooks/usePermissions.ts`

React hook for checking user permissions in components.

**Usage:**
```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { hasPermission, hasAllPermissions, hasAnyPermission, hasRole } = usePermissions();

  // Check single permission
  if (hasPermission('customers:create')) {
    // Show create button
  }

  // Check multiple permissions (user needs ALL)
  if (hasAllPermissions(['invoices:create', 'invoices:update'])) {
    // Show invoice management
  }

  // Check multiple permissions (user needs ANY)
  if (hasAnyPermission(['reports:read', 'reports:generate'])) {
    // Show reports section
  }

  // Check role
  if (hasRole('Admin')) {
    // Show admin features
  }
}
```

### 3. PermissionGate Component
**File:** `frontend/src/components/PermissionGate.tsx`

Component for conditionally rendering UI based on permissions.

**Basic Usage:**
```tsx
import PermissionGate from '../components/PermissionGate';

// Hide button if user doesn't have permission
<PermissionGate permissions={['customers:create']}>
  <Button type="primary">Create Customer</Button>
</PermissionGate>

// User needs ALL permissions
<PermissionGate permissions={['invoices:create', 'invoices:update']} requireAll>
  <Button>Manage Invoice</Button>
</PermissionGate>

// Show error page if no permission
<PermissionGate permissions={['reports:read']} showError>
  <ReportsPage />
</PermissionGate>

// Custom fallback content
<PermissionGate 
  permissions={['customers:delete']}
  fallback={<Text type="secondary">Insufficient permissions</Text>}
>
  <Button danger>Delete</Button>
</PermissionGate>
```

## Implementation Examples

### Example 1: CustomersPage (Already Implemented)
```tsx
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';

function CustomersPage() {
  const { hasPermission } = usePermissions();

  // Wrap create button
  return (
    <div>
      <PermissionGate permissions={['customers:create']}>
        <Button type="primary" onClick={handleCreate}>
          Add Customer
        </Button>
      </PermissionGate>

      {/* Conditional rendering in table columns */}
      {hasPermission('customers:update') && (
        <Button icon={<EditOutlined />} onClick={handleEdit} />
      )}
      
      {hasPermission('customers:delete') && (
        <Popconfirm title="Delete?" onConfirm={handleDelete}>
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )}
    </div>
  );
}
```

### Example 2: ItemsPage Pattern
```tsx
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';

function ItemsPage() {
  const { hasPermission } = usePermissions();

  return (
    <Card>
      {/* Create button - only show if user has permission */}
      <PermissionGate permissions={['items:create']}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Item
        </Button>
      </PermissionGate>

      {/* Table with conditional action buttons */}
      <Table
        columns={[
          // ... other columns
          {
            title: 'Actions',
            render: (_, record) => (
              <Space>
                {hasPermission('items:update') && (
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                )}
                {hasPermission('items:delete') && (
                  <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
```

### Example 3: Protected Route
```tsx
// In App.tsx
<Route
  path="/reports"
  element={
    <PermissionGate permissions={['reports:read']} showError>
      <ReportsPage />
    </PermissionGate>
  }
/>
```

## Best Practices

### 1. Use PermissionGate for UI Elements
- Wrap buttons, links, and entire sections with `<PermissionGate>`
- Use `showError` prop for full page protection
- Use `fallback` prop for alternative content

### 2. Use usePermissions Hook for Conditional Logic
- Use in table column renders
- Use for conditional form fields
- Use for complex permission checks

### 3. Consistent Permission Naming
Backend permissions follow pattern: `resource:action`
- Read: `customers:read`, `items:read`, `reports:read`
- Create: `customers:create`, `items:create`
- Update: `customers:update`, `items:update`
- Delete: `customers:delete`, `items:delete`

### 4. Always Check Permissions on Both Frontend and Backend
- Frontend: Hide/show UI elements (UX)
- Backend: Enforce access control (Security)

## Testing the System

### 1. Test Feature Toggle
1. Login as admin user
2. Navigate to Feature Control page (`/feature-control`)
3. Select a role from dropdown
4. Toggle a feature (e.g., disable "Customer Management")
5. Changes save immediately to database

### 2. Test Permission Enforcement
1. Login as user with disabled feature
2. Navigate to that module (e.g., `/customers`)
3. Create/Edit/Delete buttons should be hidden
4. Direct API calls should return 403 Forbidden

### 3. Test Real-time Updates
1. User A has role with "Customers" enabled
2. Admin disables "Customers" for that role
3. User A must logout and login again to see changes
4. After relogin, customer buttons are hidden

## Migration Guide

### To Apply Permissions to Existing Pages

**Step 1:** Import components
```tsx
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
```

**Step 2:** Add hook
```tsx
const { hasPermission } = usePermissions();
```

**Step 3:** Wrap create buttons
```tsx
<PermissionGate permissions={['resource:create']}>
  <Button type="primary" onClick={handleCreate}>Create</Button>
</PermissionGate>
```

**Step 4:** Update action columns
```tsx
{
  title: 'Actions',
  render: (_, record) => (
    <Space>
      {hasPermission('resource:update') && <Button onClick={handleEdit} />}
      {hasPermission('resource:delete') && <Button onClick={handleDelete} />}
    </Space>
  ),
}
```

## System Features Reference

| Feature Key | Module | Permissions |
|------------|--------|-------------|
| `customers` | CRM | `customers:read`, `customers:create`, `customers:update`, `customers:delete` |
| `items` | Inventory | `items:read`, `items:create`, `items:update`, `items:delete` |
| `inventory` | Inventory | `inventory:read`, `inventory:create`, `inventory:update`, `inventory:delete` |
| `quotes` | Sales | `quotes:read`, `quotes:create`, `quotes:update`, `quotes:delete` |
| `invoices` | Sales | `invoices:read`, `invoices:create`, `invoices:update`, `invoices:delete` |
| `payments` | Finance | `payments:read`, `payments:create`, `payments:update`, `payments:delete` |
| `reports` | Finance | `reports:read`, `reports:generate`, `reports:export` |
| `attendance` | HR | `attendance:read`, `attendance:create`, `attendance:update`, `attendance:delete` |
| `tasks` | HR | `tasks:read`, `tasks:create`, `tasks:update`, `tasks:delete` |
| `users` | Administration | `users:read`, `users:create`, `users:update`, `users:delete` |
| `roles` | Administration | `roles:read`, `roles:create`, `roles:update`, `roles:delete` |

## Troubleshooting

### Issue: User still sees disabled features
**Solution:** User must logout and login again to get fresh JWT token with updated permissions.

### Issue: PermissionGate not working
**Check:**
1. Is user logged in? (`useAuthStore` has valid user)
2. Does user object have `permissions` array?
3. Are permission strings matching exactly? (case-sensitive)

### Issue: Feature toggle not saving
**Check:**
1. Does user have `roles:update` permission?
2. Is backend feature control module loaded? (Check logs for `FeatureControlModule dependencies initialized`)
3. Check browser console for API errors

### Issue: Backend returns 403 even with permission
**Check:**
1. Is `@UseGuards(JwtAuthGuard, PermissionsGuard)` applied to controller?
2. Is `@RequirePermissions('resource:action')` decorator correct?
3. Check JWT token payload has correct `permissions` array
