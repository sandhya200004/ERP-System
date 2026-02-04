const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupTestCredentials() {
  try {
    // Get all employee profiles with their user info
    const profiles = await prisma.employee_profiles.findMany({
      include: {
        users: true
      }
    });

    console.log('\n=== TEST LOGIN CREDENTIALS ===\n');
    
    // Set a common test password for all users: "test123"
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    for (const profile of profiles) {
      const user = profile.users;
      if (user) {
        // Update password
        await prisma.users.update({
          where: { id: user.id },
          data: { password_hash: hashedPassword }
        });
        
        console.log(`Employee ID: ${profile.employee_id}`);
        console.log(`Password: test123`);
        console.log(`Name: ${user.first_name} ${user.last_name}`);
        console.log(`Email: ${user.email}`);
        console.log('---');
      }
    }
    
    console.log('\n✅ All users now have password: test123');
    console.log('You can login with any Employee ID + "test123"\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestCredentials();
