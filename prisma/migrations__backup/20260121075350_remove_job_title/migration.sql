/*
  Warnings:

  - You are about to drop the column `jobTitleId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitleId` on the `EmploymentHistory` table. All the data in the column will be lost.
  - You are about to drop the `JobTitle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Employee` DROP FOREIGN KEY `Employee_jobTitleId_fkey`;

-- DropForeignKey
ALTER TABLE `EmploymentHistory` DROP FOREIGN KEY `EmploymentHistory_jobTitleId_fkey`;

-- DropIndex
DROP INDEX `Employee_jobTitleId_idx` ON `Employee`;

-- DropIndex
DROP INDEX `EmploymentHistory_jobTitleId_fkey` ON `EmploymentHistory`;

-- AlterTable
ALTER TABLE `Employee` DROP COLUMN `jobTitleId`;

-- AlterTable
ALTER TABLE `EmploymentHistory` DROP COLUMN `jobTitleId`;

-- DropTable
DROP TABLE `JobTitle`;
