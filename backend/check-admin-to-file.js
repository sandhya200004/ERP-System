const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function checkPlatformAdmin() {
  let output = '';
  try {
    output += '🔍 Checking for platform admin...\n\n';
    
    const admin = await prisma.platform_admins.findUnique({
      where: {
        email: 'veerajmatnale@gmail.com'
      }
    });
    
    if (admin) {
      output += '✅ Platform Admin Found!\n\n';
      output += 'Account Details:\n';
      output += '----------------\n';
      output += `ID: ${admin.id}\n`;
      output += `Email: ${admin.email}\n`;
      output += `Name: ${admin.first_name} ${admin.last_name}\n`;
      output += `Phone: ${admin.phone}\n`;
      output += `Super Admin: ${admin.is_super_admin ? 'Yes' : 'No'}\n`;
      output += `Active: ${admin.is_active ? 'Yes' : 'No'}\n`;
      output += `Created: ${admin.created_at}\n`;
      output += '\n✅ Account successfully created and ready to use!\n';
    } else {
      output += '❌ No platform admin found with email: veerajmatnale@gmail.com\n';
      output += '\nYou may need to check:\n';
      output += '1. Database connection\n';
      output += '2. API registration endpoint\n';
      output += '3. Server logs for errors\n';
    }
  } catch (error) {
    output += `❌ Error checking database: ${error.message}\n`;
  } finally {
    await prisma.$disconnect();
  }
  
  // Write to file
  fs.writeFileSync('platform-admin-check.txt', output);
  console.log(output);
}

checkPlatformAdmin();
