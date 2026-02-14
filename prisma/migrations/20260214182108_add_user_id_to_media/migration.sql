/*
  Warnings:

  - Added the required column `userId` to the `images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `videos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "images" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "images_userId_idx" ON "images"("userId");

-- CreateIndex
CREATE INDEX "videos_userId_idx" ON "videos"("userId");
