-- AlterTable
ALTER TABLE `KpiNode` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `KpiNode_planId_parentId_sortOrder_idx` ON `KpiNode`(`planId`, `parentId`, `sortOrder`);
