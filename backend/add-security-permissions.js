const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSecurityPermissions() {
  try {
    console.log('Adding security permissions...\n');

    // Get the Admin role
    const adminRole = await prisma.roles.findFirst({
      where: { name: 'Admin' }
    });

    if (!adminRole) {
      console.error('❌ Admin role not found');
      process.exit(1);
    }

    console.log(`✅ Found Admin role: ${adminRole.id}`);

    // Security permissions to create
    const securityPermissions = [
      { name: 'security:metrics:read', resource: 'SecurityMetrics', action: 'read' },
      { name: 'security:alerts:read', resource: 'SecurityAlerts', action: 'read' },
      { name: 'security:alerts:manage', resource: 'SecurityAlerts', action: 'manage' },
      { name: 'security:status:read', resource: 'SecurityStatus', action: 'read' },
      { name: 'security:auditlogs:read', resource: 'AuditLogs', action: 'read' },
      { name: 'security:auditlogs:export', resource: 'AuditLogs', action: 'export' },
    ];

    const createdPermissions = [];

    for (const perm of securityPermissions) {
      // Check if permission already exists
      let permission = await prisma.permissions.findFirst({
        where: {
          name: perm.name
        }
      });

      if (!permission) {
        // Create permission
        permission = await prisma.permissions.create({
          data: {
            id: require('crypto').randomUUID(),
            name: perm.name,
            resource: perm.resource,
            action: perm.action,
            description: `${perm.action} access to ${perm.resource}`,
            created_at: new Date()
          }
        });
        console.log(`✅ Created permission: ${perm.name}`);
      } else {
        console.log(`⚠️  Permission already exists: ${perm.name}`);
      }

      createdPermissions.push(permission);

      // Assign to Admin role if not already assigned
      const existingAssignment = await prisma.role_permissions.findFirst({
        where: {
          role_id: adminRole.id,
          permission_id: permission.id
        }
      });

      if (!existingAssignment) {
        await prisma.role_permissions.create({
          data: {
            role_id: adminRole.id,
            permission_id: permission.id,
            created_at: new Date()
          }
        });
        console.log(`   ✓ Assigned to Admin role`);
      }
    }

    console.log(`\n✅ Security permissions setup complete!`);
    console.log(`   Created/verified: ${createdPermissions.length} permissions`);
    console.log(`   All assigned to Admin role`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSecurityPermissions();
