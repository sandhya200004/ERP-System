import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.users.findUnique({
    where: { email: 'veerajmatnale@triverse.com' },
    include: {
      user_roles: {
        include: {
          companies: true,
          roles: true,
        },
      },
    },
  });

  console.log('User:', JSON.stringify(user, null, 2));
  
  await prisma.$disconnect();
}

checkUser();
