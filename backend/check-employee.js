const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking employee_profiles...\n');
  
  const employees = await prisma.employee_profiles.findMany({
    include: {
      users: {
        select: {
          id: true,
          email: true,
          status: true,
          password_hash: true,
        }
      }
    },
    take: 3
  });
  
  console.log(`Found ${employees.length} employees:`);
  employees.forEach(emp => {
    console.log(`\nEmployee ID: ${emp.employee_id}`);
    console.log(`Designation: ${emp.designation}`);
    console.log(`Role: ${emp.role}`);
    console.log(`User Email: ${emp.users?.email}`);
    console.log(`User Status: ${emp.users?.status}`);
    console.log(`Has Password: ${emp.users?.password_hash ? 'YES' : 'NO'}`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
