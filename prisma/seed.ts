import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { products } from './seed-data';

const prisma = new PrismaClient();

// Categories that products reference. Must exist before products (FK).
const CATEGORIES = [
  { slug: 'cosmetic_sponges',  nameEn: 'Cosmetic Sponges',  nameHy: 'Կոսմետիկ սպունգեր',   nameRu: 'Косметические спонжи', skuPrefix: 'SP', sortOrder: 1 },
  { slug: 'lip_liner',         nameEn: 'Lip Liner',         nameHy: 'Շրթունքների մատիտ',    nameRu: 'Карандаш для губ',     skuPrefix: 'LL', sortOrder: 2 },
  { slug: 'blush',             nameEn: 'Blush',             nameHy: 'Երանգավորիչ',          nameRu: 'Румяна',               skuPrefix: 'BL', sortOrder: 3 },
  { slug: 'stick',             nameEn: 'Stick',             nameHy: 'Սթիք',                 nameRu: 'Стик',                 skuPrefix: 'ST', sortOrder: 4 },
  { slug: 'lip_gloss',         nameEn: 'Lip Gloss',         nameHy: 'Շրթունքների փայլ',      nameRu: 'Блеск для губ',        skuPrefix: 'LG', sortOrder: 5 },
  { slug: 'highlighter',       nameEn: 'Highlighter',       nameHy: 'Լուսավորիչ',           nameRu: 'Сияющие румяна',       skuPrefix: 'LB', sortOrder: 6 },
  { slug: 'concealer',         nameEn: 'Concealer',         nameHy: 'Կոնսիլյար',            nameRu: 'Консилер',             skuPrefix: 'CO', sortOrder: 7 },
  { slug: 'eyeshadow_palette', nameEn: 'Eyeshadow Palette', nameHy: 'Ստվերների ներկապնակ', nameRu: 'Палетка теней',        skuPrefix: 'EP', sortOrder: 8 },
  { slug: 'setting_spray',     nameEn: 'Setting Spray',     nameHy: 'Ֆիքսացնող սփրեյ',      nameRu: 'Спрей-фиксатор',       skuPrefix: 'SS', sortOrder: 9 },
  { slug: 'false_eyelashes',   nameEn: 'False Eyelashes',   nameHy: 'Թարթիչներ',            nameRu: 'Накладные ресницы',    skuPrefix: 'FE', sortOrder: 10 },
  { slug: 'makeup_fixer',      nameEn: 'Makeup Fixer',      nameHy: 'Մակյաժի ֆիքսիչ',       nameRu: 'Фиксатор макияжа',     skuPrefix: 'MF', sortOrder: 11 },
];

async function main() {
  console.log('Seeding database…');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.contactApplication.deleteMany();
    await tx.product.deleteMany();

    for (const c of CATEGORIES) {
      await tx.category.upsert({
        where: { slug: c.slug },
        update: c,
        create: c,
      });
    }

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
          videos: p.videos,
          category: p.category,
          size: p.size,
          sku: p.sku,
          stockQuantity: p.stockQuantity,
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

  // Upsert admin user from env vars
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@cosmo.beauty';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  console.log(`Admin user ready: ${adminEmail}`);
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
