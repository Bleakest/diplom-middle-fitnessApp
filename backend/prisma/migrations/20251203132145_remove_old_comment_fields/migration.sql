/*
  Warnings:

  - You are about to drop the column `commentedAt` on the `Progress` table. All the data in the column will be lost.
  - You are about to drop the column `trainerComment` on the `Progress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Progress" DROP COLUMN "commentedAt",
DROP COLUMN "trainerComment";
