-- Convert Product.category from the ProductCategory enum to a plain text slug.
-- Existing enum values (e.g. 'blush') already equal the slugs we want, so the
-- cast preserves every product's category with no data loss.
ALTER TABLE "Product" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

-- New Category table (source of truth for categories, editable from the admin).
CREATE TABLE "Category" (
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHy" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "skuPrefix" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("slug")
);

CREATE UNIQUE INDEX "Category_skuPrefix_key" ON "Category"("skuPrefix");

-- Seed the categories that previously existed as enum values, with their
-- localized labels and SKU prefixes (matching lib/data.ts and lib/product-sku.ts).
INSERT INTO "Category" ("slug", "nameEn", "nameHy", "nameRu", "skuPrefix", "sortOrder") VALUES
  ('cosmetic_sponges',  'Cosmetic Sponges',  'Կոսմետիկ սպունգեր',   'Косметические спонжи', 'SP', 1),
  ('lip_liner',         'Lip Liner',         'Շրթունքների մատիտ',    'Карандаш для губ',     'LL', 2),
  ('blush',             'Blush',             'Երանգավորիչ',          'Румяна',               'BL', 3),
  ('stick',             'Stick',             'Սթիք',                 'Стик',                 'ST', 4),
  ('lip_gloss',         'Lip Gloss',         'Շրթունքների փայլ',      'Блеск для губ',        'LG', 5),
  ('highlighter',       'Highlighter',       'Լուսավորիչ',           'Сияющие румяна',       'LB', 6),
  ('concealer',         'Concealer',         'Կոնսիլյար',            'Консилер',             'CO', 7),
  ('eyeshadow_palette', 'Eyeshadow Palette', 'Ստվերների ներկապնակ', 'Палетка теней',        'EP', 8),
  ('setting_spray',     'Setting Spray',     'Ֆիքսացնող սփրեյ',      'Спрей-фиксатор',       'SS', 9),
  ('false_eyelashes',   'False Eyelashes',   'Թարթիչներ',            'Накладные ресницы',    'FE', 10),
  ('makeup_fixer',      'Makeup Fixer',      'Մակյաժի ֆիքսիչ',       'Фиксатор макияжа',     'MF', 11);

-- Link products to categories. RESTRICT blocks deleting a category that still
-- has products (enforced in the admin action too, with a friendly message).
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_fkey"
  FOREIGN KEY ("category") REFERENCES "Category"("slug") ON UPDATE CASCADE ON DELETE RESTRICT;

-- The enum is no longer referenced by any column.
DROP TYPE "ProductCategory";
