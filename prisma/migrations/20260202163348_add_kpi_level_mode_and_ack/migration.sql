-- AlterTable
ALTER TABLE `EvaluationCycle` ADD COLUMN `kpiLevelMode` ENUM('TWO_LEVEL', 'THREE_LEVEL') NOT NULL DEFAULT 'TWO_LEVEL';

-- CreateTable
CREATE TABLE `EvaluateeCycleAcknowledgement` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` INTEGER NOT NULL,
    `evaluateeId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `acknowledgedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `note` VARCHAR(255) NULL,

    INDEX `EvaluateeCycleAcknowledgement_cycleId_acknowledgedAt_idx`(`cycleId`, `acknowledgedAt`),
    INDEX `EvaluateeCycleAcknowledgement_evaluateeId_cycleId_idx`(`evaluateeId`, `cycleId`),
    UNIQUE INDEX `EvaluateeCycleAcknowledgement_cycleId_evaluateeId_key`(`cycleId`, `evaluateeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EvaluateeCycleAcknowledgement` ADD CONSTRAINT `EvaluateeCycleAcknowledgement_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `EvaluationCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluateeCycleAcknowledgement` ADD CONSTRAINT `EvaluateeCycleAcknowledgement_evaluateeId_fkey` FOREIGN KEY (`evaluateeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluateeCycleAcknowledgement` ADD CONSTRAINT `EvaluateeCycleAcknowledgement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
