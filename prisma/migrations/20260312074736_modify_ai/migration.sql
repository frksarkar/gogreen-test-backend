-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageEmbedding" DOUBLE PRECISION[],
ADD COLUMN     "imageEmbeddingUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "image_search_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "similarityScores" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_search_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "image_search_logs" ADD CONSTRAINT "image_search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
