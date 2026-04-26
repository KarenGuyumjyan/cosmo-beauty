-- DropForeignKey
ALTER TABLE "OrderDelivery" DROP CONSTRAINT "OrderDelivery_orderId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cdekPrice" INTEGER,
ADD COLUMN     "cdekRawResponse" JSONB,
ADD COLUMN     "cdekTrackingNumber" TEXT,
ADD COLUMN     "cdekUuid" TEXT,
ADD COLUMN     "cityCode" INTEGER,
ADD COLUMN     "finalPrice" INTEGER,
ADD COLUMN     "pickupPointAddress" TEXT,
ADD COLUMN     "pickupPointCode" TEXT,
ADD COLUMN     "pickupPointName" TEXT,
ADD COLUMN     "tariffCode" INTEGER,
DROP COLUMN "shippingMethod",
ADD COLUMN     "shippingMethod" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "heightCm",
DROP COLUMN "lengthCm",
DROP COLUMN "weightGrams",
DROP COLUMN "widthCm";

-- DropTable
DROP TABLE "OrderDelivery";

-- DropEnum
DROP TYPE "DeliveryMethod";

-- DropEnum
DROP TYPE "DeliveryProvider";

-- DropEnum
DROP TYPE "ShippingMethod";
