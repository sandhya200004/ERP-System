const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all employees with login credentials...\n');
  
  const employees = await prisma.employee_profiles.findMany({
    include: {
      users: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          status: true,
        }
      }
    },
    orderBy: {
      employee_id: 'asc'
    }
  });
  
  console.log(`\n========== EMPLOYEE LOGIN CREDENTIALS ==========\n`);
  console.log(`Total Employees Found: ${employees.length}\n`);
  
  employees.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.users?.first_name} ${emp.users?.last_name || ''}`);
    console.log(`   Email: ${emp.users?.email}`);
    console.log(`   Employee ID: ${emp.employee_id}`);
    console.log(`   Password: ${emp.employee_id}@2025`);
    console.log(`   Role: ${emp.role}`);
    console.log(`   Status: ${emp.users?.status}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
