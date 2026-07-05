/*
  Warnings:

  - The values [SELLER_APPROVED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `max_level` to the `referral_rewards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PLACED', 'PROCESSING', 'PACKED', 'HANDED_TO_COURIER', 'REACHED_DISTRIBUTION_CENTER', 'DEPARTED_FROM_DISTRIBUTION_CENTER', 'HANDED_TO_RIDER', 'DELIVERY_ATTEMPT', 'DELIVERED', 'CANCELLED', 'FAILED_DELIVERY', 'RETURNED', 'REFUNDED');
ALTER TABLE "vendor_orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TABLE "order_status_log" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "referral_rewards" ADD COLUMN     "max_level" INTEGER NOT NULL;
