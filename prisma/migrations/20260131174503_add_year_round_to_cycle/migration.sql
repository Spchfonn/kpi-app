/*
  Warnings:

  - Added the required column `year` to the `EvaluationCycle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `EvaluationCycle` ADD COLUMN `round` INTEGER NULL,
    ADD COLUMN `year` INTEGER NULL;

UPDATE `EvaluationCycle` SET `year` = YEAR(`startDate`) WHERE `year` IS NULL;

ALTER TABLE `EvaluationCycle` MODIFY COLUMN `year` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `EvaluationCycle_year_round_idx` ON `EvaluationCycle`(`year`, `round`);
