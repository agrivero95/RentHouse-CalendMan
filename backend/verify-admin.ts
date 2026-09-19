import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.adminUser.findMany({
    select: { id: true, username: true, email: true, role: true },
  });
  console.log('Admin users:', admins);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });