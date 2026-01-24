-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('KPI_ASSIGNED', 'KPI_SUBMITTED', 'KPI_REVISED', 'KPI_APPROVED', 'KPI_REJECTED', 'EVALUATION_SUBMITTED', 'EVALUATION_COMPLETED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `cycleId` INTEGER NULL,
    `assignmentId` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_type_idx`(`type`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NotificationRecipient_userId_isRead_idx`(`userId`, `isRead`),
    UNIQUE INDEX `NotificationRecipient_notificationId_userId_key`(`notificationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
