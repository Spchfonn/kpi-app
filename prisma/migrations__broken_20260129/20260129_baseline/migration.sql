-- CreateTable
CREATE TABLE `Employee` (
    `id` VARCHAR(191) NOT NULL,
    `prefixName` ENUM('MR', 'MRS', 'MS') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `employeeNo` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(0) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED') NULL DEFAULT 'UNSPECIFIED',
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `terminatedDate` DATETIME(3) NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `positionId` VARCHAR(191) NOT NULL,
    `levelId` VARCHAR(191) NOT NULL,
    `jobDescription` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_email_key`(`email` ASC),
    UNIQUE INDEX `Employee_employeeNo_key`(`employeeNo` ASC),
    INDEX `Employee_levelId_idx`(`levelId` ASC),
    INDEX `Employee_organizationId_idx`(`organizationId` ASC),
    INDEX `Employee_positionId_idx`(`positionId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmploymentHistory` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `positionId` VARCHAR(191) NOT NULL,
    `levelId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(0) NOT NULL,
    `endDate` DATETIME(0) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmploymentHistory_employeeId_endDate_idx`(`employeeId` ASC, `endDate` ASC),
    INDEX `EmploymentHistory_employeeId_startDate_idx`(`employeeId` ASC, `startDate` ASC),
    INDEX `EmploymentHistory_levelId_fkey`(`levelId` ASC),
    INDEX `EmploymentHistory_organizationId_startDate_idx`(`organizationId` ASC, `startDate` ASC),
    INDEX `EmploymentHistory_positionId_fkey`(`positionId` ASC),
    PRIMARY KEY (`id` ASC)
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

    UNIQUE INDEX `EvaluationAssignment_currentPlanId_key`(`currentPlanId` ASC),
    UNIQUE INDEX `EvaluationAssignment_cycleId_evaluatorId_evaluateeId_key`(`cycleId` ASC, `evaluatorId` ASC, `evaluateeId` ASC),
    INDEX `EvaluationAssignment_evaluateeId_cycleId_idx`(`evaluateeId` ASC, `cycleId` ASC),
    INDEX `EvaluationAssignment_evaluatorId_cycleId_idx`(`evaluatorId` ASC, `cycleId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationCycle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `startDate` DATETIME(0) NOT NULL,
    `endDate` DATETIME(0) NOT NULL,
    `status` ENUM('DEFINE', 'EVALUATE', 'SUMMARY') NOT NULL DEFAULT 'DEFINE',
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `publicId` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EvaluationCycle_code_key`(`code` ASC),
    UNIQUE INDEX `EvaluationCycle_publicId_key`(`publicId` ASC),
    PRIMARY KEY (`id` ASC)
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
    `endDate` DATETIME(0) NULL,
    `startDate` DATETIME(0) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `KpiNode_currentSubmissionId_key`(`currentSubmissionId` ASC),
    INDEX `KpiNode_parentId_idx`(`parentId` ASC),
    INDEX `KpiNode_planId_idx`(`planId` ASC),
    INDEX `KpiNode_planId_parentId_sortOrder_idx`(`planId` ASC, `parentId` ASC, `sortOrder` ASC),
    INDEX `KpiNode_typeId_fkey`(`typeId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiPlan` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `confirmRequestedAt` DATETIME(3) NULL,

    INDEX `KpiPlan_assignmentId_status_idx`(`assignmentId` ASC, `status` ASC),
    UNIQUE INDEX `KpiPlan_assignmentId_version_key`(`assignmentId` ASC, `version` ASC),
    PRIMARY KEY (`id` ASC)
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

    INDEX `KpiSubmission_nodeId_createdAt_idx`(`nodeId` ASC, `createdAt` ASC),
    UNIQUE INDEX `KpiSubmission_nodeId_version_key`(`nodeId` ASC, `version` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiType` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('QUANTITATIVE', 'QUALITATIVE', 'CUSTOM') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rubric` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Level` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Level_code_key`(`code` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('EVALUATEE_REQUEST_EVALUATOR_APPROVE_KPI', 'EVALUATEE_CONFIRM_EVALUATOR_KPI', 'EVALUATEE_REJECT_EVALUATOR_KPI', 'EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI', 'EVALUATOR_REQUEST_EVALUATEE_DEFINE_KPI', 'EVALUATOR_APPROVE_EVALUATEE_KPI', 'EVALUATOR_REJECT_EVALUATEE_KPI', 'EVALUATOR_CANCEL_REQUEST_EVALUATEE_CONFIRM_KPI') NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `cycleId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `meta` JSON NULL,

    INDEX `Notification_actorId_fkey`(`actorId` ASC),
    INDEX `Notification_createdAt_idx`(`createdAt` ASC),
    INDEX `Notification_type_idx`(`type` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NotificationRecipient_notificationId_userId_key`(`notificationId` ASC, `userId` ASC),
    INDEX `NotificationRecipient_userId_readAt_idx`(`userId` ASC, `readAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `managerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_code_key`(`code` ASC),
    INDEX `Organization_managerId_idx`(`managerId` ASC),
    INDEX `Organization_parentId_idx`(`parentId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Position_code_key`(`code` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Session_expiresAt_idx`(`expiresAt` ASC),
    INDEX `Session_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `employeeId` VARCHAR(191) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_email_key`(`email` ASC),
    UNIQUE INDEX `User_employeeId_key`(`employeeId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_currentPlanId_fkey` FOREIGN KEY (`currentPlanId`) REFERENCES `KpiPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `EvaluationCycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_evaluateeId_fkey` FOREIGN KEY (`evaluateeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationAssignment` ADD CONSTRAINT `EvaluationAssignment_evaluatorId_fkey` FOREIGN KEY (`evaluatorId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_currentSubmissionId_fkey` FOREIGN KEY (`currentSubmissionId`) REFERENCES `KpiSubmission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `KpiNode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `KpiPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiNode` ADD CONSTRAINT `KpiNode_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `KpiType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiPlan` ADD CONSTRAINT `KpiPlan_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `EvaluationAssignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KpiSubmission` ADD CONSTRAINT `KpiSubmission_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `KpiNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

