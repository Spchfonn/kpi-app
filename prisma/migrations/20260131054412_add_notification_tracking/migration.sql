-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `refAssignmentId` VARCHAR(191) NULL,
    ADD COLUMN `refPlanId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `NotificationRecipient` ADD COLUMN `actionAt` DATETIME(3) NULL,
    ADD COLUMN `actionStatus` ENUM('OPEN', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX `NotificationRecipient_userId_actionStatus_idx` ON `NotificationRecipient`(`userId`, `actionStatus`);
