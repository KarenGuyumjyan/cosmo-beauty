import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database (keeping products & admins)…');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.contactApplication.deleteMany();
    // Product and AdminUser are intentionally left untouched.
  });

  console.log('Done. Products and admins preserved.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
