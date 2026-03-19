const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const STUDENT = {
  employeeId: 'STUDENT001',
  email: 'student001@triverse.com',
  password: 'STUDENT001@2025',
  firstName: 'Student',
  lastName: '001',
  designation: 'Student',
  department: 'Students',
  departmentCode: 'STU',
  profileRole: 'STUDENT',
  appRoleName: 'Employee',
};

async function createStudentView() {
  console.log('Setting up student view account...\n');

  try {
    const company = await prisma.companies.findFirst({
      where: { id: DEFAULT_COMPANY_ID },
    });

    if (!company) {
      console.error('Default company not found. Run seed first.');
      process.exit(1);
    }

    await ensureDepartment();

    const passwordHash = await bcrypt.hash(STUDENT.password, 10);

    const user = await prisma.users.upsert({
      where: { email: STUDENT.email },
      update: {
        password_hash: passwordHash,
        first_name: STUDENT.firstName,
        last_name: STUDENT.lastName,
        status: 'active',
        email_verified_at: new Date(),
        updated_at: new Date(),
      },
      create: {
        id: randomUUID(),
        email: STUDENT.email,
        password_hash: passwordHash,
        first_name: STUDENT.firstName,
        last_name: STUDENT.lastName,
        status: 'active',
        email_verified_at: new Date(),
        updated_at: new Date(),
      },
    });

    const existingProfile = await prisma.employee_profiles.findUnique({
      where: { employee_id: STUDENT.employeeId },
    });

    if (existingProfile) {
      await prisma.employee_profiles.update({
        where: { employee_id: STUDENT.employeeId },
        data: {
          user_id: user.id,
          designation: STUDENT.designation,
          department: STUDENT.department,
          role: STUDENT.profileRole,
          date_of_joining: existingProfile.date_of_joining || new Date(),
          updated_at: new Date(),
        },
      });
      console.log(`Updated profile ${STUDENT.employeeId}`);
    } else {
      await prisma.employee_profiles.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          employee_id: STUDENT.employeeId,
          designation: STUDENT.designation,
          department: STUDENT.department,
          role: STUDENT.profileRole,
          date_of_joining: new Date(),
          updated_at: new Date(),
        },
      });
      console.log(`Created profile ${STUDENT.employeeId}`);
    }

    const appRole = await ensureAppRole(company.id);

    const existingUserRole = await prisma.user_roles.findFirst({
      where: {
        user_id: user.id,
        role_id: appRole.id,
        company_id: company.id,
      },
    });

    if (!existingUserRole) {
      await prisma.user_roles.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          company_id: company.id,
          role_id: appRole.id,
        },
      });
      console.log(`Assigned app role ${appRole.name}`);
    } else {
      console.log(`App role ${appRole.name} already assigned`);
    }

    console.log('\nStudent view account is ready.\n');
    console.log('Login Credentials:');
    console.log(`Employee ID: ${STUDENT.employeeId}`);
    console.log(`Email:       ${STUDENT.email}`);
    console.log(`Password:    ${STUDENT.password}`);
    console.log(`Profile Role:${STUDENT.profileRole}`);
    console.log(`App Role:    ${appRole.name} (used for current limited UI access)\n`);
  } catch (error) {
    console.error('Error creating student view account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function ensureDepartment() {
  const existingDepartment = await prisma.department.findFirst({
    where: {
      OR: [
        { code: STUDENT.departmentCode },
        { name: { equals: STUDENT.department, mode: 'insensitive' } },
      ],
    },
  });

  if (existingDepartment) {
    await prisma.department.update({
      where: { id: existingDepartment.id },
      data: {
        name: STUDENT.department,
        code: STUDENT.departmentCode,
      },
    });
    console.log(`Department ready: ${STUDENT.department}`);
    return;
  }

  await prisma.department.create({
    data: {
      name: STUDENT.department,
      code: STUDENT.departmentCode,
    },
  });
  console.log(`Created department: ${STUDENT.department}`);
}

async function ensureAppRole(companyId) {
  const existingRole = await prisma.roles.findFirst({
    where: {
      company_id: companyId,
      name: STUDENT.appRoleName,
    },
  });

  if (existingRole) {
    return existingRole;
  }

  const role = await prisma.roles.create({
    data: {
      id: randomUUID(),
      company_id: companyId,
      name: STUDENT.appRoleName,
      description: 'Basic access role used for student/limited app views',
      is_system_role: true,
      updated_at: new Date(),
    },
  });

  return role;
}

createStudentView();
