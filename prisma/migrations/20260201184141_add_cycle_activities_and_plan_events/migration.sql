-- AlterTable
ALTER TABLE `EvaluationAssignment` ADD COLUMN `evaluatedPlanId` VARCHAR(191) NULL,
    ADD COLUMN `needsReEval` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `EvaluationCycle` ADD COLUMN `closedAt` DATETIME(0) NULL,
    ADD COLUMN `closedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `KpiNode` ADD COLUMN `rubric` JSON NULL;

-- AlterTable
ALTER TABLE `KpiPlan` ADD COLUMN `contentHash` VARCHAR(64) NULL;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `refPlanEventId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `CycleActivity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cycleId` INTEGER NOT NULL,
    `type` ENUM('DEFINE', 'EVALUATE', 'SUMMARY') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `startAt` DATETIME(0) NULL,
    `endAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedById` VARCHAR(191) NULL,

    INDEX `CycleActivity_cycleId_enabled_idx`(`cycleId`, `enabled`),
    INDEX `CycleActivity_updatedById_idx`(`updatedById`),
    UNIQUE INDEX `CycleActivity_cycleId_type_key`(`cycleId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiPlanConfirmEvent` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `type` ENUM('REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'REOPENED', 'COMMENTED') NOT NULL,
    `fromStatus` ENUM('DRAFT', 'REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED') NULL,
    `toStatus` ENUM('DRAFT', 'REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED') NULL,
    `target` ENUM('EVALUATOR', 'EVALUATEE') NULL,
    `actorId` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KpiPlanConfirmEvent_planId_createdAt_idx`(`planId`, `createdAt`),
    INDEX `KpiPlanConfirmEvent_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `EvaluationAssignment_evaluatedPlanId_idx` ON `EvaluationAssignment`(`evaluatedPlanId`);

-- CreateIndex
CREATE INDEX `EvaluationAssignment_currentPlanId_idx` ON `EvaluationAssignment`(`currentPlanId`);

-- CreateIndex
CREATE INDEX `EvaluationCycle_closedById_idx` ON `EvaluationCycle`(`closedById`);

-- CreateIndex
CREATE INDEX `KpiPlan_contentHash_idx` ON `KpiPlan`(`contentHash`);

-- CreateIndex
CREATE INDEX `Notification_refPlanEventId_idx` ON `Notification`(`refPlanEventId`);

-- AddForeignKey
ALTER TABLE `EvaluationCycle` ADD CONSTRAINT `EvaluationCycle_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CycleActivity` ADD CONSTRAINT `CycleActivity_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CycleActivity` ADD CONSTRAINT `CycleActivity_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `EvaluationCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_evaluatedPlanId_fkey` FOREIGN KEY (`evaluatedPlanId`) REFERENCES `KpiPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiPlanConfirmEvent` ADD CONSTRAINT `KpiPlanConfirmEvent_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `KpiPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiPlanConfirmEvent` ADD CONSTRAINT `KpiPlanConfirmEvent_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_refPlanEventId_fkey` FOREIGN KEY (`refPlanEventId`) REFERENCES `KpiPlanConfirmEvent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
