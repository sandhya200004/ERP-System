const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetVinitaPassword() {
  try {
    const email = 'vinita.patil@triverse.com';
    const newPassword = 'Vinita@123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user
    await prisma.users.update({
      where: { email },
      data: { password_hash: hashedPassword }
    });
    
    console.log('✅ Password reset successfully for:', email);
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetVinitaPassword();
