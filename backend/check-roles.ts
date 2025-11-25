import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const userRoles = await prisma.user_roles.findMany({
    where: { user_id: '00000000-0000-0000-0000-000000000002' },
  });

  console.log('User Roles Records:', JSON.stringify(userRoles, null, 2));
  
  await prisma.$disconnect();
}

checkData();
