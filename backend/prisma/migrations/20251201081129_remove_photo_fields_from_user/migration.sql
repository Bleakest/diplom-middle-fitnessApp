/*
  Warnings:

  - You are about to drop the column `photoBack` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `photoFront` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `photoSide` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "photoBack",
DROP COLUMN "photoFront",
DROP COLUMN "photoSide";
