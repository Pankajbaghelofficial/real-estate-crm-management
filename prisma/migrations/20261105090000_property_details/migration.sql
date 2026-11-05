-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "area_sqft" DOUBLE PRECISION,
ADD COLUMN     "balconies" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "facing" TEXT,
ADD COLUMN     "floor_no" INTEGER,
ADD COLUMN     "furnishing" TEXT,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listing_type" TEXT NOT NULL DEFAULT 'Sale',
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "ownership" TEXT,
ADD COLUMN     "possession_status" TEXT,
ADD COLUMN     "property_age" TEXT,
ADD COLUMN     "rera_number" TEXT,
ADD COLUMN     "total_floors" INTEGER;

-- CreateIndex
CREATE INDEX "Property_status_listing_type_price_idx" ON "Property"("status", "listing_type", "price");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

