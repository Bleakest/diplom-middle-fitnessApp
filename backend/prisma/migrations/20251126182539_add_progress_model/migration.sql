/*
  Warnings:

  - You are about to drop the column `arm` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `chest` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hips` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `leg` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `waist` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "arm",
DROP COLUMN "chest",
DROP COLUMN "height",
DROP COLUMN "hips",
DROP COLUMN "leg",
DROP COLUMN "waist",
DROP COLUMN "weight",
ALTER COLUMN "goal" DROP NOT NULL,
ALTER COLUMN "restrictions" DROP NOT NULL,
ALTER COLUMN "experience" DROP NOT NULL,
ALTER COLUMN "diet" DROP NOT NULL,
ALTER COLUMN "photoFront" DROP NOT NULL,
ALTER COLUMN "photoSide" DROP NOT NULL,
ALTER COLUMN "photoBack" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION NOT NULL,
    "waist" DOUBLE PRECISION NOT NULL,
    "hips" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "arm" DOUBLE PRECISION,
    "leg" DOUBLE PRECISION,
    "photoFront" TEXT,
    "photoSide" TEXT,
    "photoBack" TEXT,
    "trainerComment" TEXT,
    "commentedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Progress_userId_date_idx" ON "Progress"("userId", "date");

-- CreateIndex
CREATE INDEX "Progress_userId_createdAt_idx" ON "Progress"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
