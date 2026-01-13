/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `EvaluationCycle` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `EvaluationCycle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `EvaluationCycle` table without a default value. This is not possible if the table is not empty.
  - The required column `publicId` was added to the `EvaluationCycle` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `EvaluationCycle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `EvaluationCycle` ADD COLUMN `code` VARCHAR(191) NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `publicId` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ALTER COLUMN `startDate` DROP DEFAULT,
    ALTER COLUMN `endDate` DROP DEFAULT;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `managerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_code_key`(`code`),
    INDEX `Organization_parentId_idx`(`parentId`),
    INDEX `Organization_managerId_idx`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobTitle` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `JobTitle_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Position_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Level` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Level_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` VARCHAR(191) NOT NULL,
    `prefixName` ENUM('MR', 'MRS', 'MS') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `employeeNo` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED') NULL DEFAULT 'UNSPECIFIED',
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `terminatedDate` DATETIME(3) NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `jobTitleId` VARCHAR(191) NOT NULL,
    `positionId` VARCHAR(191) NOT NULL,
    `levelId` VARCHAR(191) NOT NULL,
    `jobDescription` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_employeeNo_key`(`employeeNo`),
    UNIQUE INDEX `Employee_email_key`(`email`),
    INDEX `Employee_organizationId_idx`(`organizationId`),
    INDEX `Employee_jobTitleId_idx`(`jobTitleId`),
    INDEX `Employee_positionId_idx`(`positionId`),
    INDEX `Employee_levelId_idx`(`levelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` INTEGER NOT NULL,
    `evaluatorId` VARCHAR(191) NOT NULL,
    `evaluateeId` VARCHAR(191) NOT NULL,
    `weightPercent` DECIMAL(5, 2) NOT NULL,
    `currentPlanId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EvaluationAssignment_currentPlanId_key`(`currentPlanId`),
    INDEX `EvaluationAssignment_evaluateeId_cycleId_idx`(`evaluateeId`, `cycleId`),
    INDEX `EvaluationAssignment_evaluatorId_cycleId_idx`(`evaluatorId`, `cycleId`),
    UNIQUE INDEX `EvaluationAssignment_cycleId_evaluatorId_evaluateeId_key`(`cycleId`, `evaluatorId`, `evaluateeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiType` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('QUANTITATIVE', 'QUALITATIVE', 'CUSTOM') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rubric` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiPlan` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KpiPlan_assignmentId_status_idx`(`assignmentId`, `status`),
    UNIQUE INDEX `KpiPlan_assignmentId_version_key`(`assignmentId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiNode` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `nodeType` ENUM('GROUP', 'ITEM') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `weightPercent` DECIMAL(5, 2) NOT NULL,
    `typeId` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `currentSubmissionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KpiNode_currentSubmissionId_key`(`currentSubmissionId`),
    INDEX `KpiNode_planId_idx`(`planId`),
    INDEX `KpiNode_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `payload` JSON NOT NULL,
    `calculatedScore` INTEGER NULL,
    `finalScore` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KpiSubmission_nodeId_createdAt_idx`(`nodeId`, `createdAt`),
    UNIQUE INDEX `KpiSubmission_nodeId_version_key`(`nodeId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `EvaluationCycle_publicId_key` ON `EvaluationCycle`(`publicId`);

-- CreateIndex
CREATE UNIQUE INDEX `EvaluationCycle_code_key` ON `EvaluationCycle`(`code`);

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_jobTitleId_fkey` FOREIGN KEY (`jobTitleId`) REFERENCES `JobTitle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `EvaluationCycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_evaluatorId_fkey` FOREIGN KEY (`evaluatorId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_evaluateeId_fkey` FOREIGN KEY (`evaluateeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_currentPlanId_fkey` FOREIGN KEY (`currentPlanId`) REFERENCES `KpiPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiPlan` ADD CONSTRAINT `KpiPlan_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `EvaluationAssignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `KpiPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `KpiNode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `KpiType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_currentSubmissionId_fkey` FOREIGN KEY (`currentSubmissionId`) REFERENCES `KpiSubmission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiSubmission` ADD CONSTRAINT `KpiSubmission_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `KpiNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
