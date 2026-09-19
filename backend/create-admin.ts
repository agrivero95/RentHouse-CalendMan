import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com'; // Provide an email, required unique
  const username = 'admin';
  const rawPassword = 'admin123';
  const role = 'admin';

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  // Check if admin already exists
  const existing = await prisma.adminUser.findUnique({
    where: { username },
  });

  if (existing) {
    console.log('Admin user already exists, updating password...');
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { password: passwordHash, email, role },
    });
  } else {
    await prisma.adminUser.create({
      data: {
        username,
        email,
        password: passwordHash,
        role,
      },
    });
    console.log('Admin user created successfully');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });