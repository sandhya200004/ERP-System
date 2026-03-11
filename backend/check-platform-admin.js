const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPlatformAdmin() {
  try {
    console.log('🔍 Checking for platform admin...\n');
    
    const admin = await prisma.platform_admins.findUnique({
      where: {
        email: 'veerajmatnale@gmail.com'
      }
    });
    
    if (admin) {
      console.log('✅ Platform Admin Found!\n');
      console.log('Account Details:');
      console.log('----------------');
      console.log('ID:', admin.id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.first_name, admin.last_name);
      console.log('Phone:', admin.phone);
      console.log('Super Admin:', admin.is_super_admin ? 'Yes' : 'No');
      console.log('Active:', admin.is_active ? 'Yes' : 'No');
      console.log('Created:', admin.created_at);
      console.log('\n✅ Account successfully created and ready to use!');
    } else {
      console.log('❌ No platform admin found with email: veerajmatnale@gmail.com');
      console.log('\nYou may need to check:');
      console.log('1. Database connection');
      console.log('2. API registration endpoint');
      console.log('3. Server logs for errors');
    }
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlatformAdmin();
