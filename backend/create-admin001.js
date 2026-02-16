const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function createAdmin001() {
  console.log('Creating ADMIN001 user...\n');

  try {
    // Get the default company
    const company = await prisma.companies.findFirst({
      where: { id: '00000000-0000-0000-0000-000000000001' },
    });

    if (!company) {
      console.error('❌ Default company not found. Run seed first.');
      process.exit(1);
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('ADMIN001@2025', 10);

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: 'admin001@triverse.com' },
    });

    let user;
    if (existingUser) {
      console.log('⚠️  User already exists. Updating password...');
      user = await prisma.users.update({
        where: { email: 'admin001@triverse.com' },
        data: {
          password_hash: passwordHash,
          status: 'active',
          updated_at: new Date(),
        },
      });
    } else {
      // Create new user
      user = await prisma.users.create({
        data: {
          id: randomUUID(),
          email: 'admin001@triverse.com',
          password_hash: passwordHash,
          first_name: 'Admin',
          last_name: '001',
          status: 'active',
          email_verified_at: new Date(),
          updated_at: new Date(),
        },
      });
      console.log('✅ User created:', user.email);
    }

    // Check if employee profile exists
    const existingProfile = await prisma.employee_profiles.findUnique({
      where: { employee_id: 'ADMIN001' },
    });

    if (existingProfile) {
      console.log('⚠️  Employee profile already exists. Updating...');
      await prisma.employee_profiles.update({
        where: { employee_id: 'ADMIN001' },
        data: {
          user_id: user.id,
          designation: 'System Administrator',
          department: 'IT',
          role: 'CEO',
          date_of_joining: new Date(),
          updated_at: new Date(),
        },
      });
    } else {
      // Create employee profile
      await prisma.employee_profiles.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          employee_id: 'ADMIN001',
          designation: 'System Administrator',
          department: 'IT',
          role: 'CEO',
          date_of_joining: new Date(),
          updated_at: new Date(),
        },
      });
      console.log('✅ Employee profile created: ADMIN001');
    }

    // Get admin role
    const adminRole = await prisma.roles.findFirst({
      where: {
        company_id: company.id,
        name: 'Admin',
      },
    });

    if (!adminRole) {
      console.error('❌ Admin role not found. Run seed first.');
      process.exit(1);
    }

    // Check if role is already assigned
    const existingUserRole = await prisma.user_roles.findFirst({
      where: {
        user_id: user.id,
        role_id: adminRole.id,
        company_id: company.id,
      },
    });

    if (!existingUserRole) {
      // Assign admin role
      await prisma.user_roles.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          company_id: company.id,
          role_id: adminRole.id,
        },
      });
      console.log('✅ Admin role assigned');
    } else {
      console.log('⚠️  Admin role already assigned');
    }

    console.log('\n✅ ADMIN001 user setup completed successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Login Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('Employee ID:  ADMIN001');
    console.log('Email:        admin001@triverse.com');
    console.log('Password:     ADMIN001@2025');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error creating ADMIN001:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin001();
