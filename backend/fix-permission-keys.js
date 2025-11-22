const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermissions() {
  try {
    // Get all permissions that have NULL permission_key
    const permissions = await prisma.permissions.findMany({
      where: { permission_key: null }
    });

    console.log(`Found ${permissions.length} permissions with NULL permission_key`);

    // Update each permission to set permission_key = name
    for (const perm of permissions) {
      await prisma.permissions.update({
        where: { id: perm.id },
        data: { permission_key: perm.name }
      });
      console.log(`✅ Updated: ${perm.name} -> permission_key: ${perm.name}`);
    }

    console.log('\n✅ All permissions fixed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPermissions();
