-- CreateTable
CREATE TABLE `Category` (
    `slug` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(255) NOT NULL,
    `nameHy` VARCHAR(255) NOT NULL,
    `nameRu` VARCHAR(255) NOT NULL,
    `skuPrefix` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_skuPrefix_key`(`skuPrefix`),
    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(255) NOT NULL,
    `nameHy` VARCHAR(255) NOT NULL,
    `nameRu` VARCHAR(255) NOT NULL,
    `shortDescEn` TEXT NOT NULL,
    `shortDescHy` TEXT NOT NULL,
    `shortDescRu` TEXT NOT NULL,
    `descriptionEn` TEXT NOT NULL,
    `descriptionHy` TEXT NOT NULL,
    `descriptionRu` TEXT NOT NULL,
    `price` INTEGER NOT NULL,
    `discountedPrice` INTEGER NULL,
    `images` JSON NOT NULL,
    `videos` JSON NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `weightGrams` INTEGER NULL,
    `lengthCm` INTEGER NULL,
    `widthCm` INTEGER NULL,
    `heightCm` INTEGER NULL,
    `sku` VARCHAR(191) NOT NULL,
    `stockQuantity` INTEGER NOT NULL DEFAULT 10,
    `includedItems` JSON NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `bestseller` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactApplication` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(255) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `address` VARCHAR(500) NULL,
    `city` VARCHAR(191) NULL,
    `shippingMethod` VARCHAR(191) NOT NULL DEFAULT '',
    `cityCode` INTEGER NULL,
    `pickupPointCode` VARCHAR(191) NULL,
    `pickupPointName` VARCHAR(500) NULL,
    `pickupPointAddress` VARCHAR(500) NULL,
    `tariffCode` INTEGER NULL,
    `cdekPrice` INTEGER NULL,
    `finalPrice` INTEGER NULL,
    `shippingCost` INTEGER NOT NULL DEFAULT 0,
    `subtotal` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `yookassaId` VARCHAR(191) NULL,
    `yookassaStatus` VARCHAR(191) NULL,
    `cdekUuid` VARCHAR(191) NULL,
    `cdekTrackingNumber` VARCHAR(191) NULL,
    `cdekRawResponse` JSON NULL,
    `cdekStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Order_yookassaId_key`(`yookassaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_category_fkey` FOREIGN KEY (`category`) REFERENCES `Category`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
