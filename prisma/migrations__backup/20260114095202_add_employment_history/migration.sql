-- CreateTable
CREATE TABLE `EmploymentHistory` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `jobTitleId` VARCHAR(191) NOT NULL,
    `positionId` VARCHAR(191) NOT NULL,
    `levelId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmploymentHistory_employeeId_startDate_idx`(`employeeId`, `startDate`),
    INDEX `EmploymentHistory_employeeId_endDate_idx`(`employeeId`, `endDate`),
    INDEX `EmploymentHistory_organizationId_startDate_idx`(`organizationId`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_jobTitleId_fkey` FOREIGN KEY (`jobTitleId`) REFERENCES `JobTitle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentHistory` ADD CONSTRAINT `EmploymentHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
