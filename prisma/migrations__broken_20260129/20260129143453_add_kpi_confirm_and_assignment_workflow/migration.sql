-- AlterTable
ALTER TABLE `EvaluationAssignment` ADD COLUMN `evalStatus` ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED') NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN `submittedAt` DATETIME(3) NULL,
    ADD COLUMN `submittedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `KpiPlan` ADD COLUMN `confirmRequestedById` VARCHAR(191) NULL,
    ADD COLUMN `confirmStatus` ENUM('DRAFT', 'REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `confirmTarget` ENUM('EVALUATOR', 'EVALUATEE') NULL,
    ADD COLUMN `confirmedAt` DATETIME(3) NULL,
    ADD COLUMN `confirmedById` VARCHAR(191) NULL,
    ADD COLUMN `rejectReason` VARCHAR(191) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedById` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `KpiPlan_assignmentId_confirmStatus_idx` ON `KpiPlan`(`assignmentId`, `confirmStatus`);

-- CreateIndex
CREATE INDEX `KpiPlan_confirmStatus_confirmTarget_idx` ON `KpiPlan`(`confirmStatus`, `confirmTarget`);

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiPlan` ADD CONSTRAINT `KpiPlan_confirmRequestedById_fkey` FOREIGN KEY (`confirmRequestedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiPlan` ADD CONSTRAINT `KpiPlan_confirmedById_fkey` FOREIGN KEY (`confirmedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiPlan` ADD CONSTRAINT `KpiPlan_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_email_key` TO `user_email_key`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_employeeId_key` TO `user_employeeId_key`;
