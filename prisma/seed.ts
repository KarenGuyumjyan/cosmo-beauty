import { PrismaClient, Prisma, ProductCategory } from '@prisma/client';
import { products } from '../lib/data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products from lib/data.ts…');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.contactApplication.deleteMany();
    await tx.product.deleteMany();

    for (const p of products) {
      await tx.product.create({
        data: {
          id: p.id,
          nameEn: p.name.en,
          nameHy: p.name.hy,
          nameRu: p.name.ru,
          shortDescEn: p.shortDescription.en,
          shortDescHy: p.shortDescription.hy,
          shortDescRu: p.shortDescription.ru,
          descriptionEn: p.description.en,
          descriptionHy: p.description.hy,
          descriptionRu: p.description.ru,
          price: p.price,
          discountedPrice: p.discountedPrice ?? null,
          images: p.images,
          category: p.category as ProductCategory,
          size: p.size,
          sku: p.sku,
          inStock: p.inStock,
          includedItems: p.includedItems
            ? JSON.parse(JSON.stringify(p.includedItems))
            : null,
          featured: p.featured ?? false,
          bestseller: p.bestseller ?? false,
        },
      });
    }
  });

  console.log(`Seeded ${products.length} products.`);
}

main()
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
