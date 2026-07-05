/*
  Warnings:

  - The values [FILTER] on the enum `AttributePropertyType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "AssignmentType" ADD VALUE 'MAIN_VARIANT';

-- AlterEnum
BEGIN;
CREATE TYPE "AttributePropertyType_new" AS ENUM ('VARIANT', 'MAIN_VARIANT', 'ATTRIBUTE');
ALTER TABLE "Attribute" ALTER COLUMN "propertyType" TYPE "AttributePropertyType_new" USING ("propertyType"::text::"AttributePropertyType_new");
ALTER TYPE "AttributePropertyType" RENAME TO "AttributePropertyType_old";
ALTER TYPE "AttributePropertyType_new" RENAME TO "AttributePropertyType";
DROP TYPE "public"."AttributePropertyType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "content" DROP CONSTRAINT "content_section_id_fkey";

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "mainVariantId" TEXT,
ADD COLUMN     "productVariantAssignmentId" TEXT;

-- AlterTable
ALTER TABLE "content" ALTER COLUMN "section_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AssignVariantValue" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignVariantValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignVariantValue_attributeId_idx" ON "AssignVariantValue"("attributeId");

-- CreateIndex
CREATE INDEX "AssignVariantValue_variantId_idx" ON "AssignVariantValue"("variantId");

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "content_section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignVariantValue" ADD CONSTRAINT "AssignVariantValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignVariantValue" ADD CONSTRAINT "AssignVariantValue_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productVariantAssignmentId_fkey" FOREIGN KEY ("productVariantAssignmentId") REFERENCES "ProductAttributeAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_mainVariantId_fkey" FOREIGN KEY ("mainVariantId") REFERENCES "Attribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
