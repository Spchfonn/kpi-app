/*
  Warnings:

  - You are about to alter the column `birthDate` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `startDate` on the `EmploymentHistory` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `endDate` on the `EmploymentHistory` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `startDate` on the `EvaluationCycle` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `endDate` on the `EvaluationCycle` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- AlterTable
ALTER TABLE `Employee` MODIFY `birthDate` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `EmploymentHistory` MODIFY `startDate` DATETIME(0) NOT NULL,
    MODIFY `endDate` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `EvaluationCycle` MODIFY `startDate` DATETIME(0) NOT NULL,
    MODIFY `endDate` DATETIME(0) NOT NULL;
