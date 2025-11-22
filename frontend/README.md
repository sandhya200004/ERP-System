# TriVerse ERP Frontend

React-based frontend application for TriVerse ERP.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Ant Design 5** - UI component library
- **Vite** - Build tool
- **Zustand** - State management
- **React Query** - Server state management
- **React Router** - Routing
- **Axios** - HTTP client
- **Recharts** - Charts and graphs

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── common/         # Generic components (Button, Input, etc.)
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   └── forms/          # Reusable form components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── customers/     # Customer management
│   ├── items/         # Item management
│   ├── quotes/        # Quote management
│   ├── invoices/      # Invoice management
│   ├── payments/      # Payment management
│   ├── reports/       # Reports & analytics
│   └── settings/      # Settings
├── layouts/           # Page layouts
│   ├── AuthLayout.tsx
│   ├── DashboardLayout.tsx
│   └── PublicLayout.tsx
├── services/          # API services
│   ├── api.ts        # Axios instance
│   ├── auth.service.ts
│   ├── customer.service.ts
│   └── ...
├── store/             # Zustand stores
│   ├── authStore.ts
│   ├── companyStore.ts
│   └── ...
├── hooks/             # Custom React hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── ...
├── utils/             # Utility functions
│   ├── format.ts     # Formatting helpers
│   ├── validation.ts # Validation helpers
│   └── constants.ts  # Constants
├── types/             # TypeScript types
│   ├── api.types.ts
│   ├── entities.types.ts
│   └── ...
├── App.tsx            # Root component
└── main.tsx           # Entry point
```

## Feature Module Structure

Each feature module follows this pattern:

```
features/customers/
├── components/           # Feature-specific components
│   ├── CustomerList.tsx
│   ├── CustomerForm.tsx
│   └── CustomerDetail.tsx
├── hooks/               # Feature-specific hooks
│   └── useCustomers.ts
├── types/               # Feature-specific types
│   └── customer.types.ts
└── index.ts             # Public exports
```

## Key Screens

### 1. Dashboard
- Sales overview
- Recent invoices
- Outstanding payments
- Quick actions

### 2. Customers
- Customer list with search/filter
- Create/edit customer form
- Customer detail view

### 3. Items
- Item list with search/filter
- Create/edit item form
- Item detail view

### 4. Quotes
- Quote list with status filter
- Create/edit quote form
- Quote detail with line items
- Send quote modal
- Convert to invoice action

### 5. Invoices
- Invoice list with status filter
- Create/edit invoice form
- Invoice detail with line items
- Finalize invoice action
- Send invoice modal
- Payment application

### 6. Payments
- Payment list
- Create payment form
- Apply payment to invoices

### 7. Reports
- Sales report with charts
- A/R aging report
- Tax summary report

### 8. Settings
- Company settings
- Branch management
- User management
- Tax configuration
- Currency settings

## State Management

### Auth Store (Zustand)
```typescript
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  login: (credentials) => Promise<void>,
  logout: () => void,
  refreshAccessToken: () => Promise<void>
}
```

### Company Store (Zustand)
```typescript
{
  currentCompany: Company | null,
  currentBranch: Branch | null,
  companies: Company[],
  setCompany: (companyId: string) => void,
  setBranch: (branchId: string) => void
}
```

## API Integration

All API calls go through centralized service files:

```typescript
// services/customer.service.ts
export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};
```

## Styling

- Use Ant Design components as much as possible
- Use CSS modules for custom styles
- Follow Ant Design theme customization in `src/theme.ts`

## Forms

All forms use Ant Design Form component with validation:

```typescript
<Form
  form={form}
  layout="vertical"
  onFinish={handleSubmit}
>
  <Form.Item
    name="name"
    label="Name"
    rules={[{ required: true, message: 'Name is required' }]}
  >
    <Input />
  </Form.Item>
</Form>
```

## Permissions

Use `usePermissions` hook to check user permissions:

```typescript
const { hasPermission } = usePermissions();

{hasPermission('customers.create') && (
  <Button onClick={handleCreate}>Create Customer</Button>
)}
```

## Development Guidelines

1. **Component Naming**: Use PascalCase (e.g., `CustomerList.tsx`)
2. **File Organization**: Keep related files together
3. **Type Safety**: Always define proper TypeScript types
4. **Error Handling**: Use try-catch and display user-friendly messages
5. **Loading States**: Show loading indicators for async operations
6. **Accessibility**: Follow WCAG guidelines
7. **Responsive**: Ensure mobile-friendly layouts
