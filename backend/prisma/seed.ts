import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create USD currency if not exists
  await prisma.currencies.upsert({
    where: { code: 'USD' },
    update: {},
    create: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimal_places: 2,
      is_active: true,
      updated_at: new Date(),
    },
  });

  // Create a default company
  const company = await prisma.companies.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TriVerse Enterprise',
      tax_id: 'TAX123456',
      email: 'admin@triverse.com',
      phone: '+1234567890',
      website: 'https://triverse.com',
      default_currency_code: 'USD',
      status: 'active',
      updated_at: new Date(),
    },
  });

  console.log('Company created:', company.name);

  // Hash the password
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Create admin user
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@triverse.com' },
    update: {
      password_hash: passwordHash,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'admin@triverse.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      status: 'active',
      email_verified_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log('Admin user created:', adminUser.email);

  // Create all permissions
  const permissionsList = [
    // Customers
    { name: 'customers:read', resource: 'customers', action: 'read', description: 'View customers' },
    { name: 'customers:create', resource: 'customers', action: 'create', description: 'Create customers' },
    { name: 'customers:update', resource: 'customers', action: 'update', description: 'Update customers' },
    { name: 'customers:delete', resource: 'customers', action: 'delete', description: 'Delete customers' },
    // Items
    { name: 'items:read', resource: 'items', action: 'read', description: 'View items' },
    { name: 'items:create', resource: 'items', action: 'create', description: 'Create items' },
    { name: 'items:update', resource: 'items', action: 'update', description: 'Update items' },
    { name: 'items:delete', resource: 'items', action: 'delete', description: 'Delete items' },
    // Invoices
    { name: 'invoices:read', resource: 'invoices', action: 'read', description: 'View invoices' },
    { name: 'invoices:create', resource: 'invoices', action: 'create', description: 'Create invoices' },
    { name: 'invoices:update', resource: 'invoices', action: 'update', description: 'Update invoices' },
    { name: 'invoices:delete', resource: 'invoices', action: 'delete', description: 'Delete invoices' },
    // Quotes
    { name: 'quotes:read', resource: 'quotes', action: 'read', description: 'View quotes' },
    { name: 'quotes:create', resource: 'quotes', action: 'create', description: 'Create quotes' },
    { name: 'quotes:update', resource: 'quotes', action: 'update', description: 'Update quotes' },
    { name: 'quotes:delete', resource: 'quotes', action: 'delete', description: 'Delete quotes' },
    // Payments
    { name: 'payments:read', resource: 'payments', action: 'read', description: 'View payments' },
    { name: 'payments:create', resource: 'payments', action: 'create', description: 'Create payments' },
    { name: 'payments:update', resource: 'payments', action: 'update', description: 'Update payments' },
    { name: 'payments:delete', resource: 'payments', action: 'delete', description: 'Delete payments' },
    // Attendance
    { name: 'attendance:read', resource: 'attendance', action: 'read', description: 'View attendance' },
    { name: 'attendance:create', resource: 'attendance', action: 'create', description: 'Create attendance records' },
    { name: 'attendance:update', resource: 'attendance', action: 'update', description: 'Update attendance' },
    { name: 'attendance:delete', resource: 'attendance', action: 'delete', description: 'Delete attendance' },
    // KPI
    { name: 'kpi:read', resource: 'kpi', action: 'read', description: 'View KPI' },
    { name: 'kpi:create', resource: 'kpi', action: 'create', description: 'Create KPI' },
    { name: 'kpi:update', resource: 'kpi', action: 'update', description: 'Update KPI' },
    { name: 'kpi:delete', resource: 'kpi', action: 'delete', description: 'Delete KPI' },
    // Reports
    { name: 'reports:read', resource: 'reports', action: 'read', description: 'View reports' },
    // Settings
    { name: 'settings:read', resource: 'settings', action: 'read', description: 'View settings' },
    { name: 'settings:update', resource: 'settings', action: 'update', description: 'Update settings' },
    // Users
    { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
    { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
    // Roles
    { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
    { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles' },
    { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
    { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
  ];

  const permissions = [];
  for (let i = 0; i < permissionsList.length; i++) {
    const perm = permissionsList[i];
    const permission = await prisma.permissions.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-0000000000${String(i + 10).padStart(2, '0')}`,
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });
    permissions.push(permission);
  }

  console.log(`Created ${permissions.length} permissions`);

  // Create admin role
  const adminRole = await prisma.roles.upsert({
    where: { 
      company_id_name: {
        company_id: company.id,
        name: 'Admin'
      }
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      company_id: company.id,
      name: 'Admin',
      description: 'Administrator with full access',
      is_system_role: true,
      updated_at: new Date(),
    },
  });

  console.log('Admin role created:', adminRole.name);

  // Assign all permissions to admin role
  for (const permission of permissions) {
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: permission.id,
        }
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: permission.id,
      },
    });
  }

  console.log('All permissions assigned to admin role');

  // Assign admin role to user  
  await prisma.user_roles.upsert({
    where: {
      id: '00000000-0000-0000-0000-000000000004',
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      user_id: adminUser.id,
      company_id: company.id,
      role_id: adminRole.id,
    },
  });

  console.log('Admin role assigned to user');
  console.log('\n✅ Seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Email: admin@triverse.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
