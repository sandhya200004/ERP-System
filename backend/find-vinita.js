const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findVinita() {
  try {
    const users = await prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'vinita', mode: 'insensitive' } },
          { first_name: { contains: 'vinita', mode: 'insensitive' } },
        ]
      },
      select: {
        email: true,
        first_name: true,
        last_name: true,
      }
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findVinita();
