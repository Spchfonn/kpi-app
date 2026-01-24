/*
  Warnings:

  - You are about to drop the column `assignmentId` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `notificationrecipient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `notificationrecipient` DROP FOREIGN KEY `NotificationRecipient_userId_fkey`;

-- DropIndex
DROP INDEX `NotificationRecipient_userId_isRead_idx` ON `notificationrecipient`;

-- AlterTable
ALTER TABLE `notification` DROP COLUMN `assignmentId`,
    DROP COLUMN `message`,
    DROP COLUMN `planId`,
    DROP COLUMN `title`;

-- AlterTable
ALTER TABLE `notificationrecipient` DROP COLUMN `isRead`;

-- CreateIndex
CREATE INDEX `NotificationRecipient_userId_readAt_idx` ON `NotificationRecipient`(`userId`, `readAt`);

-- AddForeignKey
ALTER TABLE `KpiSubmission` ADD CONSTRAINT `KpiSubmission_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `KpiNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
