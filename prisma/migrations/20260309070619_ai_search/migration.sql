-- DropForeignKey
ALTER TABLE "ai_usage_logs" DROP CONSTRAINT "ai_usage_logs_userId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "embedding" DOUBLE PRECISION[],
ADD COLUMN     "embeddingUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ai_usage_logs" ADD COLUMN     "service" TEXT NOT NULL DEFAULT 'CHAT',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "search_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "extractedFilters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "searchMode" TEXT NOT NULL DEFAULT 'PROD',
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
