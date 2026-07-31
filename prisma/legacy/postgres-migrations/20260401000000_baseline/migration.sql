-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."DeliveryMethod" AS ENUM ('CDEK_PICKUP_POINT');

-- CreateEnum
CREATE TYPE "public"."DeliveryProvider" AS ENUM ('CDEK');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('cosmetic_sponges', 'lip_liner', 'blush', 'stick', 'lip_gloss', 'highlighter', 'concealer', 'eyeshadow_palette', 'setting_spray', 'false_eyelashes', 'makeup_fixer');

-- CreateEnum
CREATE TYPE "public"."ShippingMethod" AS ENUM ('YANDEX_DELIVERY', 'SELF_PICKUP', 'CDEK_PICKUP_POINT');

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "address" TEXT,
    "city" TEXT,
    "shippingMethod" "public"."ShippingMethod" NOT NULL DEFAULT 'SELF_PICKUP',
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "yookassaId" TEXT,
    "yookassaStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderDelivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "public"."DeliveryProvider" NOT NULL DEFAULT 'CDEK',
    "method" "public"."DeliveryMethod" NOT NULL DEFAULT 'CDEK_PICKUP_POINT',
    "city" TEXT NOT NULL,
    "cityCode" INTEGER NOT NULL,
    "pickupPointCode" TEXT NOT NULL,
    "pickupPointName" TEXT,
    "pickupPointAddress" TEXT,
    "cdekTariffCode" INTEGER NOT NULL,
    "cdekTariffName" TEXT,
    "cdekPrice" DECIMAL(10,2) NOT NULL,
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "cdekOrderUuid" TEXT,
    "cdekTrackNumber" TEXT,
    "cdekStatus" TEXT,
    "rawQuote" JSONB,
    "rawOrderResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHy" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "shortDescEn" TEXT NOT NULL,
    "shortDescHy" TEXT NOT NULL,
    "shortDescRu" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionHy" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "discountedPrice" INTEGER,
    "images" TEXT[],
    "videos" TEXT[],
    "category" "public"."ProductCategory" NOT NULL,
    "size" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 10,
    "includedItems" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "bestseller" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heightCm" INTEGER,
    "lengthCm" INTEGER,
    "weightGrams" INTEGER,
    "widthCm" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "public"."AdminUser"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Order_yookassaId_key" ON "public"."Order"("yookassaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OrderDelivery_orderId_key" ON "public"."OrderDelivery"("orderId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku" ASC);

-- AddForeignKey
ALTER TABLE "public"."OrderDelivery" ADD CONSTRAINT "OrderDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
