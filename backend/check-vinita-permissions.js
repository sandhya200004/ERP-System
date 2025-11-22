const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVinita() {
  try {
    // Find Vinita
    const user = await prisma.users.findFirst({
      where: { email: 'vinita.patil@triverse.com' },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Vinita not found');
      return;
    }

    console.log('✅ Found Vinita:', user.email);
    console.log('User ID:', user.id);
    console.log('\nRoles and Permissions:');
    
    user.user_roles.forEach((ur) => {
      console.log(`\n  Role: ${ur.roles.name} (${ur.roles.role_key})`);
      console.log(`  Company ID: ${ur.company_id}`);
      console.log('  Permissions:');
      ur.roles.role_permissions.forEach((rp) => {
        console.log(`    - ${rp.permissions.name} (${rp.permissions.permission_key})`);
      });
    });

    // Check specifically for customer permissions
    const hasCustomerCreate = user.user_roles.some(ur =>
      ur.roles.role_permissions.some(rp =>
        rp.permissions.permission_key === 'customers:create'
      )
    );

    console.log('\n=== Customer Permissions ===');
    console.log('Has customers:create:', hasCustomerCreate ? '✅ YES' : '❌ NO');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVinita();
