-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: kpi_app_db
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--


--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('1f57032e-fdc7-48ca-be2c-0497b1cb8e8a','38eadadb4994461c7c59cb3f70fb90ed439459081c21778574a7cbdbb4bddc21','2026-01-21 07:53:39.590','20260113094507_init_kpi_schema',NULL,NULL,'2026-01-21 07:53:39.469',1),('8090ced0-9d2d-43ac-8e37-568b89232fac','42be3d5fbc66d988f4904f3824e9238b48f5aa4a3a05403e7d0e1147396827e7','2026-01-21 07:53:39.620','20260114095202_add_employment_history',NULL,NULL,'2026-01-21 07:53:39.591',1),('aaee4364-b538-43de-8a60-8f404596ab9e','2cf5952a7b99bbe3796cdfcd400c80d1050aa2e10431b379a1de9a353bf28eb9','2026-01-21 10:07:26.430','20260120082630_add_kpinode_sort_order',NULL,NULL,'2026-01-21 10:07:26.421',1),('bfb3a294-4436-4299-a976-e83572930cce','9ade9c4ba5951bb05896c26fdf57c4a1bcc3abafbd1832eb137895d4afa1c6f1','2026-01-21 07:53:50.910','20260121075350_remove_job_title',NULL,NULL,'2026-01-21 07:53:50.884',1),('c8602b05-8696-44ea-af5b-fdeec29a911a','5ec1043d965b8cab8166e35d4d54ac272de597f55c60f719f94ff2b8047fbdbf','2026-01-21 07:53:39.645','20260120075522_add_kpinode_dates',NULL,NULL,'2026-01-21 07:53:39.641',1),('f8cc7a1d-88ce-4cdb-a984-f176912970d1','b86eae9bea04ba2e1aa36266c4e46b47b7a938366a7c1bf1f2ede3a4f9c83526','2026-01-21 07:53:39.468','20260111074259_create_evaluation_cycle',NULL,NULL,'2026-01-21 07:53:39.465',1),('ff124947-4887-4733-9011-5a7b4ae3041a','705a57318258a471e2727665bdd56739037f70d59a933209a55139eb9208a3ea','2026-01-21 07:53:39.641','20260115142615_revise_datetime',NULL,NULL,'2026-01-21 07:53:39.620',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Employee`
--

DROP TABLE IF EXISTS `Employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Employee` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefixName` enum('MR','MRS','MS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birthDate` datetime DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER','UNSPECIFIED') COLLATE utf8mb4_unicode_ci DEFAULT 'UNSPECIFIED',
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startDate` datetime(3) NOT NULL,
  `terminatedDate` datetime(3) DEFAULT NULL,
  `organizationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `positionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `levelId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jobDescription` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Employee_employeeNo_key` (`employeeNo`),
  UNIQUE KEY `Employee_email_key` (`email`),
  KEY `Employee_organizationId_idx` (`organizationId`),
  KEY `Employee_positionId_idx` (`positionId`),
  KEY `Employee_levelId_idx` (`levelId`),
  CONSTRAINT `Employee_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Employee_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Employee_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Employee`
--

LOCK TABLES `Employee` WRITE;
/*!40000 ALTER TABLE `Employee` DISABLE KEYS */;
INSERT INTO `Employee` VALUES ('2f0fea47-6c86-4d47-9bae-f9316853e8e6','MR','สวีดัส','สวัสดี','ดี','EMP-0001',NULL,'MALE','saweedus@example.com',NULL,'2025-12-31 17:00:00.000',NULL,'79d84099-b139-4c29-b8f5-638859e63467','a029cd95-9e31-4142-87ee-1213030b2ac1','2ee23a10-bd88-4ff7-929a-3a1f8a6ece88',NULL,1,'2026-01-21 08:02:31.609','2026-01-21 08:02:31.609'),('4032d460-8e08-4f88-8ddd-6df61af8bf0d','MS','รักงาน','สู้ชีวิต','น่ารัก','EMP-0002',NULL,'FEMALE','rukngan@example.com',NULL,'2025-12-31 17:00:00.000',NULL,'79d84099-b139-4c29-b8f5-638859e63467','a029cd95-9e31-4142-87ee-1213030b2ac1','ca0a963c-0a93-4c1a-842d-63ae17f792da',NULL,1,'2026-01-21 08:04:10.217','2026-01-21 08:04:10.217'),('7f3c2e9a-8b4a-4f6c-9d1b-6a2f1c8e5b47','MR','สุขใจ','สมฤดี','สุข','EMP-003',NULL,'MALE','sukjai@example.com',NULL,'2025-12-31 00:00:00.000',NULL,'79d84099-b139-4c29-b8f5-638859e63467','a029cd95-9e31-4142-87ee-1213030b2ac1','ca0a963c-0a93-4c1a-842d-63ae17f792da',NULL,1,'2026-01-26 01:49:06.766','2026-01-26 01:49:03.000');
/*!40000 ALTER TABLE `Employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EmploymentHistory`
--

DROP TABLE IF EXISTS `EmploymentHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EmploymentHistory` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `positionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `levelId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organizationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `EmploymentHistory_employeeId_startDate_idx` (`employeeId`,`startDate`),
  KEY `EmploymentHistory_employeeId_endDate_idx` (`employeeId`,`endDate`),
  KEY `EmploymentHistory_organizationId_startDate_idx` (`organizationId`,`startDate`),
  KEY `EmploymentHistory_positionId_fkey` (`positionId`),
  KEY `EmploymentHistory_levelId_fkey` (`levelId`),
  CONSTRAINT `EmploymentHistory_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EmploymentHistory_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `Level` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EmploymentHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EmploymentHistory_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EmploymentHistory`
--

LOCK TABLES `EmploymentHistory` WRITE;
/*!40000 ALTER TABLE `EmploymentHistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `EmploymentHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EvaluationAssignment`
--

DROP TABLE IF EXISTS `EvaluationAssignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EvaluationAssignment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycleId` int NOT NULL,
  `evaluatorId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluateeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weightPercent` decimal(5,2) NOT NULL,
  `currentPlanId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `EvaluationAssignment_cycleId_evaluatorId_evaluateeId_key` (`cycleId`,`evaluatorId`,`evaluateeId`),
  UNIQUE KEY `EvaluationAssignment_currentPlanId_key` (`currentPlanId`),
  KEY `EvaluationAssignment_evaluateeId_cycleId_idx` (`evaluateeId`,`cycleId`),
  KEY `EvaluationAssignment_evaluatorId_cycleId_idx` (`evaluatorId`,`cycleId`),
  CONSTRAINT `EvaluationAssignment_currentPlanId_fkey` FOREIGN KEY (`currentPlanId`) REFERENCES `KpiPlan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `EvaluationAssignment_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `EvaluationCycle` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EvaluationAssignment_evaluateeId_fkey` FOREIGN KEY (`evaluateeId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EvaluationAssignment_evaluatorId_fkey` FOREIGN KEY (`evaluatorId`) REFERENCES `Employee` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EvaluationAssignment`
--

LOCK TABLES `EvaluationAssignment` WRITE;
/*!40000 ALTER TABLE `EvaluationAssignment` DISABLE KEYS */;
INSERT INTO `EvaluationAssignment` VALUES ('5e61f2a4-9b7a-4f1d-8c3e-2a0d6c9f71b8',1,'7f3c2e9a-8b4a-4f6c-9d1b-6a2f1c8e5b47','2f0fea47-6c86-4d47-9bae-f9316853e8e6',100.00,'a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','2026-01-26 01:51:11.288','2026-01-26 01:50:47.000'),('d8f2b533-2733-4b7f-b86e-ac945a62bc8b',1,'2f0fea47-6c86-4d47-9bae-f9316853e8e6','4032d460-8e08-4f88-8ddd-6df61af8bf0d',100.00,'9b0a1d2b-6958-4342-b361-4d903cfb74ee','2026-01-21 08:12:56.196','2026-01-24 18:28:56.004');
/*!40000 ALTER TABLE `EvaluationAssignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EvaluationCycle`
--

DROP TABLE IF EXISTS `EvaluationCycle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EvaluationCycle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `status` enum('DEFINE','EVALUATE','SUMMARY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DEFINE',
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `publicId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `EvaluationCycle_publicId_key` (`publicId`),
  UNIQUE KEY `EvaluationCycle_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EvaluationCycle`
--

LOCK TABLES `EvaluationCycle` WRITE;
/*!40000 ALTER TABLE `EvaluationCycle` DISABLE KEYS */;
INSERT INTO `EvaluationCycle` VALUES (1,'ปีการประเมิน 2569 รอบที่ 1','2025-12-31 17:00:00','2026-06-29 17:00:00','DEFINE','EC-20260101-20260630','2026-01-21 08:05:32.055','994b6e5c-db32-42ae-bc1e-e9b0dbea9b2e','2026-01-22 21:00:40.138'),(2,'ปีการประเมิน 2568 รอบที่ 2','2025-06-30 17:00:00','2025-12-30 17:00:00','DEFINE','EC-20250701-20251231','2026-01-22 20:32:15.574','1815b19f-519b-4173-abfc-e965f146d54a','2026-01-22 20:32:15.574'),(3,'ปีการประเมิน 2568 รอบที่ 1','2024-12-31 17:00:00','2025-06-29 17:00:00','DEFINE','EC-20250101-20250630','2026-01-22 21:00:27.765','b00fb3b8-8034-4f1a-8d13-4c09b571b403','2026-01-22 21:00:27.765');
/*!40000 ALTER TABLE `EvaluationCycle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KpiNode`
--

DROP TABLE IF EXISTS `KpiNode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KpiNode` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `planId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nodeType` enum('GROUP','ITEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weightPercent` decimal(5,2) NOT NULL,
  `typeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currentSubmissionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `endDate` datetime DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `KpiNode_currentSubmissionId_key` (`currentSubmissionId`),
  KEY `KpiNode_planId_idx` (`planId`),
  KEY `KpiNode_parentId_idx` (`parentId`),
  KEY `KpiNode_typeId_fkey` (`typeId`),
  KEY `KpiNode_planId_parentId_sortOrder_idx` (`planId`,`parentId`,`sortOrder`),
  CONSTRAINT `KpiNode_currentSubmissionId_fkey` FOREIGN KEY (`currentSubmissionId`) REFERENCES `KpiSubmission` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `KpiNode_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `KpiNode` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `KpiNode_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `KpiPlan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `KpiNode_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `KpiType` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KpiNode`
--

LOCK TABLES `KpiNode` WRITE;
/*!40000 ALTER TABLE `KpiNode` DISABLE KEYS */;
INSERT INTO `KpiNode` VALUES ('00ac2f3d-3420-49ff-aaf5-65efc18fbcf5','a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','ITEM','การทำงานร่วมกันและการสื่อสารภายในทีม','สื่อสารชัดเจน ตอบสนองต่อทีม ช่วยแก้ปัญหา และให้/รับ feedback อย่างสร้างสรรค์','61d6423a-e8e5-4c8d-a1c0-067a6f4dea23',100.00,'efaabc88-f7ea-4c77-b4b8-e372b15b72a7',NULL,NULL,'2026-01-26 14:29:50.959','2026-01-26 14:29:50.959','2026-06-30 23:59:59','2026-01-01 00:00:00',10),('47e3957b-b66e-4b48-813c-192d71e4989a','9b0a1d2b-6958-4342-b361-4d903cfb74ee','ITEM','การส่งมอบฟีเจอร์ตามแผนงาน','พัฒนาและส่งมอบฟีเจอร์ตามแผน Sprint/โครงการ พร้อมคุณภาพที่เหมาะสม','b6737286-bc20-49e0-9433-7528bdb5f0db',100.00,'fdcb823b-4176-421b-a75b-338fc9256a19','เปอร์เซ็นต์','88349d00-fa43-41ac-91e0-0078a4d9fdf2','2026-01-26 16:17:59.661','2026-01-27 14:43:00.845','2026-06-30 23:59:59','2026-01-01 00:00:00',10),('49d887ea-b25c-4066-94b8-21faf8e7abd3','a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','GROUP','ประสิทธิภาพด้านเทคนิค','ผลการปฏิบัติงานด้านเทคนิคของตำแหน่งวิศวกรซอฟต์แวร์',NULL,70.00,NULL,NULL,NULL,'2026-01-26 14:29:50.950','2026-01-26 14:29:50.950',NULL,NULL,10),('55b88bfc-08d9-4d47-9831-47d74f66a861','a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','ITEM','คุณภาพและความสามารถในการดูแลรักษาโค้ด','โค้ดอ่านง่าย มีมาตรฐาน ลดปัญหาเชิงเทคนิค และรองรับการขยายระบบ','49d887ea-b25c-4066-94b8-21faf8e7abd3',30.00,'24b16692-a5ff-40e7-9ec8-e0160c1fc965',NULL,NULL,'2026-01-26 14:29:50.955','2026-01-26 14:29:50.955','2026-06-30 23:59:59','2026-01-01 00:00:00',20),('60f46feb-b1ee-458b-8571-a4de6a26953f','9b0a1d2b-6958-4342-b361-4d903cfb74ee','GROUP','พฤติกรรมและการทำงานร่วมกันในทีม','พฤติกรรมการทำงานร่วมกัน การสื่อสาร และความรับผิดชอบต่อทีม',NULL,20.00,NULL,NULL,NULL,'2026-01-26 16:17:59.660','2026-01-27 06:30:55.170',NULL,NULL,40),('61d6423a-e8e5-4c8d-a1c0-067a6f4dea23','a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','GROUP','พฤติกรรมและการทำงานร่วมกันในทีม','พฤติกรรมการทำงานร่วมกัน การสื่อสาร และความรับผิดชอบต่อทีม',NULL,30.00,NULL,NULL,NULL,'2026-01-26 14:29:50.958','2026-01-26 14:29:50.958',NULL,NULL,20),('64b835c0-418e-43a3-9a9a-3781eb9adb6e','9b0a1d2b-6958-4342-b361-4d903cfb74ee','ITEM','ปรับปรุงแผนการลงทุนให้สอดคล้องกับงบประมาณ/ความเสี่ยง','','f7c70cda-861b-4640-8bda-e01a17ad5ac1',100.00,'c517ed72-b588-43aa-b811-f00e3ed8651a',NULL,'22c89371-768f-4d9b-873e-b19c9b4f870e','2026-01-21 10:13:06.509','2026-01-27 14:43:00.851','2026-06-30 00:00:00','2026-01-01 00:00:00',10),('70d592ac-d5aa-499a-a6ac-20d2d3863d0d','a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','ITEM','ประสิทธิภาพในการแก้ไขข้อผิดพลาดของระบบ','แก้ไขบัคได้ตรงจุด ลดการเกิดซ้ำ และลด regression ที่กระทบผู้ใช้งาน','49d887ea-b25c-4066-94b8-21faf8e7abd3',30.00,'d22f50e1-4e43-43f8-ac89-a0a81c958fac',NULL,NULL,'2026-01-26 14:29:50.956','2026-01-26 14:29:50.956','2026-06-30 23:59:59','2026-01-01 00:00:00',30),('7e89e1d8-468f-4417-9f92-b321c7322be3','9b0a1d2b-6958-4342-b361-4d903cfb74ee','ITEM','วันที่ส่งรายงานเหตุผลประกอบการเบิกจ่าย','','fe9cf330-b715-48d0-b465-eb569aaeda00',50.00,'052fb15b-248a-4f12-8ce3-16d9bb5d61fe','วัน','cf48db1e-7ab1-4a4c-868b-f8a579996bfc','2026-01-21 10:13:06.505','2026-01-27 14:43:00.857','2026-06-30 00:00:00','2026-01-01 00:00:00',20),('7f349fb8-6a02-4cb0-899d-e3f13a50a23a','9b0a1d2b-6958-4342-b361-4d903cfb74ee','ITEM','การวิเคราะห์ต้นทุนและผลตอบแทน','','fe9cf330-b715-48d0-b465-eb569aaeda00',50.00,'b8828dd0-dc7b-402c-988d-36fd22a7604b',NULL,'733e2834-6d7f-4460-b15d-8731e5ae2e87','2026-01-21 10:13:06.503','2026-01-27 14:43:00.862','2026-06-30 00:00:00','2026-01-01 00:00:00',10),('b6737286-bc20-49e0-9433-7528bdb5f0db','9b0a1d2b-6958-4342-b361-4d903cfb74ee','GROUP','ประสิทธิภาพด้านเทคนิค','ผลการปฏิบัติงานด้านเทคนิคของตำแหน่งวิศวกรซอฟต์แวร์',NULL,30.00,NULL,NULL,NULL,'2026-01-26 16:17:59.658','2026-01-27 06:30:55.166',NULL,NULL,30),('dc09d35f-51ae-4e18-bbd2-01e169315a13','a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','ITEM','การส่งมอบฟีเจอร์ตามแผนงาน','พัฒนาและส่งมอบฟีเจอร์ตามแผน Sprint/โครงการ พร้อมคุณภาพที่เหมาะสม','49d887ea-b25c-4066-94b8-21faf8e7abd3',40.00,'fdcb823b-4176-421b-a75b-338fc9256a19','เปอร์เซ็นต์',NULL,'2026-01-26 14:29:50.952','2026-01-26 14:29:50.952','2026-06-30 23:59:59','2026-01-01 00:00:00',10),('f7c70cda-861b-4640-8bda-e01a17ad5ac1','9b0a1d2b-6958-4342-b361-4d903cfb74ee','GROUP','ความสามารถในการบริหารแผนลงทุน',NULL,NULL,20.00,NULL,NULL,NULL,'2026-01-21 10:13:06.507','2026-01-27 06:30:55.162',NULL,NULL,20),('fe9cf330-b715-48d0-b465-eb569aaeda00','9b0a1d2b-6958-4342-b361-4d903cfb74ee','GROUP','การบริหารจัดการเพื่อสร้างคุณค่าเชิงเศรษฐศาสตร์ (EVM)',NULL,NULL,30.00,NULL,NULL,NULL,'2026-01-21 10:13:06.501','2026-01-27 06:30:55.137',NULL,NULL,10),('ffa2eb3f-62f2-4885-8656-7d85a02bf85e','9b0a1d2b-6958-4342-b361-4d903cfb74ee','ITEM','การทำงานร่วมกันและการสื่อสารภายในทีม','สื่อสารชัดเจน ตอบสนองต่อทีม ช่วยแก้ปัญหา และให้/รับ feedback อย่างสร้างสรรค์','60f46feb-b1ee-458b-8571-a4de6a26953f',100.00,'efaabc88-f7ea-4c77-b4b8-e372b15b72a7',NULL,'44ef7095-3154-4cdb-baec-f7487550a279','2026-01-26 16:17:59.663','2026-01-27 14:43:00.866','2026-06-30 23:59:59','2026-01-01 00:00:00',10);
/*!40000 ALTER TABLE `KpiNode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KpiPlan`
--

DROP TABLE IF EXISTS `KpiPlan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KpiPlan` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignmentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int NOT NULL,
  `status` enum('DRAFT','ACTIVE','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `KpiPlan_assignmentId_version_key` (`assignmentId`,`version`),
  KEY `KpiPlan_assignmentId_status_idx` (`assignmentId`,`status`),
  CONSTRAINT `KpiPlan_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `EvaluationAssignment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KpiPlan`
--

LOCK TABLES `KpiPlan` WRITE;
/*!40000 ALTER TABLE `KpiPlan` DISABLE KEYS */;
INSERT INTO `KpiPlan` VALUES ('9b0a1d2b-6958-4342-b361-4d903cfb74ee','d8f2b533-2733-4b7f-b86e-ac945a62bc8b',1,'DRAFT','2026-01-21 08:45:46.236','2026-01-21 08:45:46.236'),('a8d4c1e2-6f9b-4a7d-8e35-0b2f6c9d517a','5e61f2a4-9b7a-4f1d-8c3e-2a0d6c9f71b8',1,'DRAFT','2026-01-26 01:57:25.646','2026-01-26 01:57:18.000'),('e52b840b-ec4d-4c1a-899e-20ec759f7f1d','d8f2b533-2733-4b7f-b86e-ac945a62bc8b',2,'DRAFT','2026-01-24 18:28:55.994','2026-01-24 18:28:55.994');
/*!40000 ALTER TABLE `KpiPlan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KpiSubmission`
--

DROP TABLE IF EXISTS `KpiSubmission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KpiSubmission` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nodeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int NOT NULL,
  `payload` json NOT NULL,
  `calculatedScore` int DEFAULT NULL,
  `finalScore` int DEFAULT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `KpiSubmission_nodeId_version_key` (`nodeId`,`version`),
  KEY `KpiSubmission_nodeId_createdAt_idx` (`nodeId`,`createdAt`),
  CONSTRAINT `KpiSubmission_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `KpiNode` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KpiSubmission`
--

LOCK TABLES `KpiSubmission` WRITE;
/*!40000 ALTER TABLE `KpiSubmission` DISABLE KEYS */;
INSERT INTO `KpiSubmission` VALUES ('00487d73-ff42-4c77-be59-11c8f4278c0c','47e3957b-b66e-4b48-813c-192d71e4989a',14,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:39:23.480','2026-01-27 14:39:23.480'),('00dde1e5-f656-474d-8e72-3d0a95c97e1f','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',19,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:42:58.583','2026-01-27 14:42:58.583'),('02725361-0882-4ede-838c-007cfc23dffe','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',18,'{\"score\": 3}',3,3,NULL,'2026-01-27 14:41:08.829','2026-01-27 14:42:11.003'),('04aed4ca-f4dd-4fe4-a041-86b96e2bd53b','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',8,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:25:58.466','2026-01-27 14:25:58.466'),('082ee542-820e-4ef7-8699-b58c4474b704','7e89e1d8-468f-4417-9f92-b321c7322be3',11,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:27:26.839','2026-01-27 14:27:26.839'),('0aa5dfe6-5e24-49d8-a2e7-bafb7b9fe20b','47e3957b-b66e-4b48-813c-192d71e4989a',1,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 09:44:58.016','2026-01-27 09:44:58.016'),('0b06cfbe-e55b-46c4-b3f1-d42f7c06244b','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',19,'{\"checkedIds\": [\"3\", \"1\"]}',NULL,NULL,NULL,'2026-01-27 14:42:58.581','2026-01-27 14:42:58.581'),('0eddb79b-d1a0-45ff-99ea-4b2a8fa9e28e','7e89e1d8-468f-4417-9f92-b321c7322be3',12,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:39:21.439','2026-01-27 14:39:21.439'),('10e9f7fb-6420-441e-86ef-0d5ab20883cf','7e89e1d8-468f-4417-9f92-b321c7322be3',1,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 09:44:58.037','2026-01-27 09:44:58.037'),('1235866e-864f-417b-bc1e-7fc4f7e8a258','47e3957b-b66e-4b48-813c-192d71e4989a',15,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:39:24.371','2026-01-27 14:39:24.371'),('12799d9e-dd22-49c8-ab9d-3f0794ab95d3','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',7,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:25:56.449','2026-01-27 14:25:56.449'),('184c1710-914e-44fb-aa62-9a119f0d9318','64b835c0-418e-43a3-9a9a-3781eb9adb6e',15,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:39:24.378','2026-01-27 14:39:24.378'),('1e4048e9-f1da-4212-8575-437f66feceee','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',16,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:40:06.867','2026-01-27 14:40:06.867'),('1e52d439-0534-40bb-85cf-1995eb641684','47e3957b-b66e-4b48-813c-192d71e4989a',3,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 09:46:06.606','2026-01-27 09:46:06.606'),('22c89371-768f-4d9b-873e-b19c9b4f870e','64b835c0-418e-43a3-9a9a-3781eb9adb6e',20,'{\"score\": 5}',5,5,NULL,'2026-01-27 14:43:00.848','2026-01-27 14:43:01.876'),('24cb19ee-9568-4f13-9a74-94f2e737d2dc','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',9,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:25:59.494','2026-01-27 14:25:59.494'),('250cd2b6-be81-4401-84a5-e582fbe985f6','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',7,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:25:56.445','2026-01-27 14:25:56.445'),('28d948cb-0cdb-4a39-a38c-b12526e32a34','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',13,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:39:22.491','2026-01-27 14:39:22.491'),('2e632917-7558-4738-9678-6921ca2d58ad','64b835c0-418e-43a3-9a9a-3781eb9adb6e',6,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 09:46:09.678','2026-01-27 09:46:09.678'),('2f7b6690-2ed9-4a1f-84f7-48548af94d0c','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',17,'{\"checkedIds\": [\"3\", \"1\"]}',NULL,NULL,NULL,'2026-01-27 14:41:07.815','2026-01-27 14:41:07.815'),('36bc3b59-8457-41ef-967a-0b1a84bcf886','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',12,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:39:21.443','2026-01-27 14:39:21.443'),('37059582-3cde-45e6-8bcd-bd2352a0c5dd','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',6,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 09:46:09.690','2026-01-27 09:46:09.690'),('3bcab5b1-4710-4c3b-964a-6aed6994d58f','47e3957b-b66e-4b48-813c-192d71e4989a',6,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 09:46:09.671','2026-01-27 09:46:09.671'),('3e012d3e-12ef-4c5a-8293-ee8f61d24e40','64b835c0-418e-43a3-9a9a-3781eb9adb6e',18,'{\"score\": 5}',5,5,NULL,'2026-01-27 14:41:08.816','2026-01-27 14:42:11.000'),('409b3682-df44-4625-8096-ae04f89dfb29','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',13,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:39:22.498','2026-01-27 14:39:22.498'),('422ee137-8348-413d-b900-3a940b5a2390','64b835c0-418e-43a3-9a9a-3781eb9adb6e',9,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:25:59.483','2026-01-27 14:25:59.483'),('43244fec-a608-4013-a260-295f73c8a57b','47e3957b-b66e-4b48-813c-192d71e4989a',18,'{\"score\": 4}',4,4,NULL,'2026-01-27 14:41:08.806','2026-01-27 14:42:11.001'),('44ef7095-3154-4cdb-baec-f7487550a279','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',20,'{\"score\": 4}',4,4,NULL,'2026-01-27 14:43:00.864','2026-01-27 14:43:01.881'),('47d0acb2-6cda-46e3-a95b-80209d6a67b5','47e3957b-b66e-4b48-813c-192d71e4989a',13,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:39:22.473','2026-01-27 14:39:22.473'),('4cf267f2-ba33-410c-aa78-eefeda275c37','47e3957b-b66e-4b48-813c-192d71e4989a',9,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:25:59.476','2026-01-27 14:25:59.476'),('4debd594-8e72-43ca-8e48-ad816e2bd322','47e3957b-b66e-4b48-813c-192d71e4989a',19,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:42:58.558','2026-01-27 14:42:58.558'),('5048f440-149b-4389-bdad-0d1ee6cfd383','7e89e1d8-468f-4417-9f92-b321c7322be3',14,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:39:23.490','2026-01-27 14:39:23.490'),('50fc5a03-c023-49b9-b8a9-784f6018c63a','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',8,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:25:58.460','2026-01-27 14:25:58.460'),('51c3b9b2-cf47-4115-8ad4-95c190511046','7e89e1d8-468f-4417-9f92-b321c7322be3',17,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:41:07.812','2026-01-27 14:41:07.812'),('5228c386-acac-41cd-b14b-f6bf9e3e70eb','7e89e1d8-468f-4417-9f92-b321c7322be3',6,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 09:46:09.684','2026-01-27 09:46:09.684'),('5910963b-876e-4c1a-8ecb-b3a4e9284ec0','64b835c0-418e-43a3-9a9a-3781eb9adb6e',12,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:39:21.436','2026-01-27 14:39:21.436'),('5a824af1-cda6-4f64-a18a-8590b98c24ae','64b835c0-418e-43a3-9a9a-3781eb9adb6e',3,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 09:46:06.617','2026-01-27 09:46:06.617'),('613d500d-39e6-444f-a3ac-759b5a43ec74','64b835c0-418e-43a3-9a9a-3781eb9adb6e',14,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:39:23.486','2026-01-27 14:39:23.486'),('633bd478-fd43-431c-8c8f-e5a4ffce2f5e','64b835c0-418e-43a3-9a9a-3781eb9adb6e',1,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 09:44:58.033','2026-01-27 09:44:58.033'),('63b7c19a-b002-40d1-8753-f0d45a9da05f','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',15,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:39:24.388','2026-01-27 14:39:24.388'),('65b85c50-81e3-4bf9-aa62-1ee634619b95','7e89e1d8-468f-4417-9f92-b321c7322be3',9,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:25:59.489','2026-01-27 14:25:59.489'),('671761da-7b6d-4519-a47f-04299d87b34b','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',4,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 09:46:07.632','2026-01-27 09:46:07.632'),('673e385c-f3c6-487e-9faa-19456555042e','7e89e1d8-468f-4417-9f92-b321c7322be3',10,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:27:25.477','2026-01-27 14:27:25.477'),('69577c6b-7e5b-4e94-8741-dcbb73bd55bf','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',5,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 09:46:08.548','2026-01-27 09:46:08.548'),('6a116490-097a-4f8a-9dc4-3aacfaaa417b','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',5,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 09:46:08.554','2026-01-27 09:46:08.554'),('6b3778d5-3c41-4c14-a407-c20a4a8c00b5','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',3,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 09:46:06.628','2026-01-27 09:46:06.628'),('6e0f7f5f-c7df-434b-93f4-81ab0e77f8d0','47e3957b-b66e-4b48-813c-192d71e4989a',16,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:40:06.852','2026-01-27 14:40:06.852'),('706b844e-9e4f-4021-a91b-9e15ae9e7c14','64b835c0-418e-43a3-9a9a-3781eb9adb6e',5,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 09:46:08.534','2026-01-27 09:46:08.534'),('710c16e1-94ed-4de8-bac7-e35d99d78fe1','7e89e1d8-468f-4417-9f92-b321c7322be3',16,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:40:06.861','2026-01-27 14:40:06.861'),('733e2834-6d7f-4460-b15d-8731e5ae2e87','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',20,'{\"checkedIds\": [\"3\", \"1\"]}',3,3,NULL,'2026-01-27 14:43:00.860','2026-01-27 14:43:01.870'),('7375f616-ecd7-4bec-86ab-8115b7fa51b8','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',11,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:27:26.844','2026-01-27 14:27:26.844'),('77c8170f-a016-4b9d-bbf2-cfc8b57d7944','7e89e1d8-468f-4417-9f92-b321c7322be3',4,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 09:46:07.625','2026-01-27 09:46:07.625'),('798a67bc-24d3-4734-8f0d-3ec6525412e1','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',15,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:39:24.392','2026-01-27 14:39:24.392'),('7ca943e3-0c4f-4b30-8638-06c4997bf8cc','7e89e1d8-468f-4417-9f92-b321c7322be3',3,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 09:46:06.624','2026-01-27 09:46:06.624'),('8035d652-77e8-4da7-b7e0-834f8f387971','64b835c0-418e-43a3-9a9a-3781eb9adb6e',11,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:27:26.834','2026-01-27 14:27:26.834'),('80a59abc-a9af-4416-990f-53824f2dbae3','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',11,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:27:26.849','2026-01-27 14:27:26.849'),('88349d00-fa43-41ac-91e0-0078a4d9fdf2','47e3957b-b66e-4b48-813c-192d71e4989a',20,'{\"score\": 4}',4,4,NULL,'2026-01-27 14:43:00.842','2026-01-27 14:43:01.879'),('8d1d938b-1dd0-4cc4-8e42-64c2c976f60f','47e3957b-b66e-4b48-813c-192d71e4989a',10,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:27:25.464','2026-01-27 14:27:25.464'),('8e84020d-875e-4587-ac93-f3345f15c536','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',3,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 09:46:06.632','2026-01-27 09:46:06.632'),('963f9bbf-bb7d-4115-89c3-29b98ffa9b6f','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',1,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 09:44:58.045','2026-01-27 09:44:58.045'),('9663b5be-79ce-4c57-8d8c-a6935d8f8286','7e89e1d8-468f-4417-9f92-b321c7322be3',2,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 09:46:05.197','2026-01-27 09:46:05.197'),('a88f2fde-4f14-48d1-a4c5-cc95bd7b6c71','7e89e1d8-468f-4417-9f92-b321c7322be3',18,'{\"score\": 2}',2,2,NULL,'2026-01-27 14:41:08.821','2026-01-27 14:42:11.004'),('a8de1856-93f5-492a-99aa-cf5a21d301ea','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',12,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:39:21.447','2026-01-27 14:39:21.447'),('a937acaf-1e72-4e6e-b136-856e31f906ee','64b835c0-418e-43a3-9a9a-3781eb9adb6e',7,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:25:56.437','2026-01-27 14:25:56.437'),('a97d1fd2-0317-4b28-82ff-b74b6f97e680','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',14,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:39:23.495','2026-01-27 14:39:23.495'),('ab04696d-81c1-4528-9a23-e42145913e5a','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',10,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:27:25.485','2026-01-27 14:27:25.485'),('ae5f3ffa-b154-41dd-963c-f1b7815f37a2','7e89e1d8-468f-4417-9f92-b321c7322be3',19,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:42:58.577','2026-01-27 14:42:58.577'),('aef18a8d-c215-413c-926e-8f898d35059c','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',14,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:39:23.503','2026-01-27 14:39:23.503'),('afb010cc-bcd5-414a-884f-4de66ae046f4','47e3957b-b66e-4b48-813c-192d71e4989a',5,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 09:46:08.527','2026-01-27 09:46:08.527'),('b0d817d9-7656-4dd5-bf30-5df28c1c22fb','7e89e1d8-468f-4417-9f92-b321c7322be3',13,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:39:22.485','2026-01-27 14:39:22.485'),('b2d8e81d-13de-4738-87d8-a22ba0a0d701','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',10,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 14:27:25.482','2026-01-27 14:27:25.482'),('b3565110-6691-4522-b1a9-658e4a7152fc','47e3957b-b66e-4b48-813c-192d71e4989a',17,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:41:07.800','2026-01-27 14:41:07.800'),('b46c151d-a3ad-420b-aac6-dc1270d679e9','47e3957b-b66e-4b48-813c-192d71e4989a',2,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 09:46:05.186','2026-01-27 09:46:05.186'),('ba6d0533-ab1c-4e77-a482-620d0e46fb27','47e3957b-b66e-4b48-813c-192d71e4989a',4,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 09:46:07.608','2026-01-27 09:46:07.608'),('bc4d63af-8749-4a20-9be8-eb00cd35b40b','64b835c0-418e-43a3-9a9a-3781eb9adb6e',16,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:40:06.857','2026-01-27 14:40:06.857'),('bc56561e-e3ca-47ec-bcd1-66007bd90010','64b835c0-418e-43a3-9a9a-3781eb9adb6e',13,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:39:22.480','2026-01-27 14:39:22.480'),('bf1917cd-8bc9-49f7-9f3c-e05835f0efd1','7e89e1d8-468f-4417-9f92-b321c7322be3',8,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:25:58.454','2026-01-27 14:25:58.454'),('c1ebaaa3-26ff-4922-84af-517f34bb8b51','7e89e1d8-468f-4417-9f92-b321c7322be3',5,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 09:46:08.540','2026-01-27 09:46:08.540'),('c357f8e7-02e0-446c-9806-db25e70869b4','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',9,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:25:59.501','2026-01-27 14:25:59.501'),('c3ca9b0c-8fd0-4ee9-b1b4-81742258bf0e','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',6,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 09:46:09.700','2026-01-27 09:46:09.700'),('c7cd1ed2-5a1c-42b2-8cba-ab69a4234f4f','64b835c0-418e-43a3-9a9a-3781eb9adb6e',19,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:42:58.564','2026-01-27 14:42:58.564'),('c95f23aa-1a36-44dd-9a0f-b5db6d56f797','64b835c0-418e-43a3-9a9a-3781eb9adb6e',2,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 09:46:05.193','2026-01-27 09:46:05.193'),('cb351731-1759-4686-a7e8-f0e197d38856','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',17,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 14:41:07.816','2026-01-27 14:41:07.816'),('cf48db1e-7ab1-4a4c-868b-f8a579996bfc','7e89e1d8-468f-4417-9f92-b321c7322be3',20,'{\"score\": 3}',3,3,NULL,'2026-01-27 14:43:00.854','2026-01-27 14:43:01.883'),('d1373a9f-b620-40c3-8664-1a593dd7cbdb','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',2,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 09:46:05.200','2026-01-27 09:46:05.200'),('d1c5c813-07ae-4b07-baa0-8c4fda14db12','64b835c0-418e-43a3-9a9a-3781eb9adb6e',8,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:25:58.449','2026-01-27 14:25:58.449'),('d504a35e-e3e5-4f56-8fb8-fabb0ae3a4ab','64b835c0-418e-43a3-9a9a-3781eb9adb6e',4,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 09:46:07.615','2026-01-27 09:46:07.615'),('d58a7bbe-d876-4dc2-abc8-b095ad115f8f','64b835c0-418e-43a3-9a9a-3781eb9adb6e',10,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:27:25.473','2026-01-27 14:27:25.473'),('d615dc1e-98ac-46d3-8293-12ab7d42a49c','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',16,'{\"checkedIds\": [\"3\", \"1\"]}',NULL,NULL,NULL,'2026-01-27 14:40:06.863','2026-01-27 14:40:06.863'),('d841cc20-d85c-4b90-be8d-65367636450b','ffa2eb3f-62f2-4885-8656-7d85a02bf85e',2,'{\"score\": 3}',NULL,NULL,NULL,'2026-01-27 09:46:05.203','2026-01-27 09:46:05.203'),('da3a61ad-878b-4500-8fd3-b4622b727391','47e3957b-b66e-4b48-813c-192d71e4989a',7,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:25:56.417','2026-01-27 14:25:56.417'),('da5fb675-f444-4675-9c7c-fb82ef83ec01','47e3957b-b66e-4b48-813c-192d71e4989a',8,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:25:58.441','2026-01-27 14:25:58.441'),('dd68703f-84fa-4a27-a63c-91b5618b89e8','7e89e1d8-468f-4417-9f92-b321c7322be3',7,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:25:56.441','2026-01-27 14:25:56.441'),('e0bf65cf-69e2-47c0-80c9-ad180132652e','7e89e1d8-468f-4417-9f92-b321c7322be3',15,'{\"score\": 2}',NULL,NULL,NULL,'2026-01-27 14:39:24.383','2026-01-27 14:39:24.383'),('e0e1a9ed-970b-4e4d-af22-1201aef12737','47e3957b-b66e-4b48-813c-192d71e4989a',11,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:27:26.827','2026-01-27 14:27:26.827'),('e5d09253-d1ca-4fb3-8ee7-a3b4562c786f','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',1,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 09:44:58.041','2026-01-27 09:44:58.041'),('f290ba1a-86ab-4ee7-9753-cf93954a828b','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',18,'{\"checkedIds\": [\"3\", \"1\"]}',3,3,NULL,'2026-01-27 14:41:08.824','2026-01-27 14:42:10.997'),('fa733c22-2589-4365-b3db-2c6efddfd6d5','7f349fb8-6a02-4cb0-899d-e3f13a50a23a',4,'{\"checkedIds\": [\"2\", \"3\"]}',NULL,NULL,NULL,'2026-01-27 09:46:07.629','2026-01-27 09:46:07.629'),('fc7564f5-d502-4c68-8b16-fd5faff6b9cd','47e3957b-b66e-4b48-813c-192d71e4989a',12,'{\"score\": 4}',NULL,NULL,NULL,'2026-01-27 14:39:21.430','2026-01-27 14:39:21.430'),('fd459105-14a9-40d2-83db-40901e09d1d8','64b835c0-418e-43a3-9a9a-3781eb9adb6e',17,'{\"score\": 5}',NULL,NULL,NULL,'2026-01-27 14:41:07.807','2026-01-27 14:41:07.807');
/*!40000 ALTER TABLE `KpiSubmission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KpiType`
--

DROP TABLE IF EXISTS `KpiType`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KpiType` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('QUANTITATIVE','QUALITATIVE','CUSTOM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rubric` json NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KpiType`
--

LOCK TABLES `KpiType` WRITE;
/*!40000 ALTER TABLE `KpiType` DISABLE KEYS */;
INSERT INTO `KpiType` VALUES ('052fb15b-248a-4f12-8ce3-16d9bb5d61fe','QUANTITATIVE','เชิงปริมาณ (วัน)','{\"kind\": \"QUANTITATIVE_1_TO_5\", \"levels\": [{\"unit\": \"วัน\", \"score\": 1, \"value\": 10}, {\"unit\": \"วัน\", \"score\": 2, \"value\": 8}, {\"unit\": \"วัน\", \"score\": 3, \"value\": 6}, {\"unit\": \"วัน\", \"score\": 4, \"value\": 4}, {\"unit\": \"วัน\", \"score\": 5, \"value\": 2}]}','2026-01-21 09:40:31.648','2026-01-21 09:40:31.648'),('24b16692-a5ff-40e7-9ec8-e0160c1fc965','CUSTOM','คุณภาพและความสามารถในการดูแลรักษาโค้ด','{\"kind\": \"CUSTOM_DESCRIPTION_1_TO_5\", \"levels\": [{\"desc\": \"ต้องปรับปรุงมาก\", \"score\": 1}, {\"desc\": \"ต้องปรับปรุง\", \"score\": 2}, {\"desc\": \"พอใช้\", \"score\": 3}, {\"desc\": \"ดี\", \"score\": 4}, {\"desc\": \"ดีมาก\", \"score\": 5}]}','2026-01-26 14:22:14.540','2026-01-26 14:22:14.540'),('b8828dd0-dc7b-402c-988d-36fd22a7604b','QUALITATIVE','เชิงคุณภาพ (Checklist)','{\"kind\": \"QUALITATIVE_CHECKLIST\", \"checklist\": [{\"item\": \"ส่งเอกสารครบ\", \"weight_percent\": 40}, {\"item\": \"ส่งตรงเวลา\", \"weight_percent\": 40}, {\"item\": \"มีหลักฐานแนบ\", \"weight_percent\": 20}]}','2026-01-21 09:40:50.538','2026-01-21 09:40:50.538'),('c517ed72-b588-43aa-b811-f00e3ed8651a','CUSTOM','กำหนดเอง (คำอธิบาย 1-5)','{\"kind\": \"CUSTOM_DESCRIPTION_1_TO_5\", \"levels\": [{\"desc\": \"ต้องปรับปรุงมาก\", \"score\": 1}, {\"desc\": \"ต้องปรับปรุง\", \"score\": 2}, {\"desc\": \"พอใช้\", \"score\": 3}, {\"desc\": \"ดี\", \"score\": 4}, {\"desc\": \"ดีมาก\", \"score\": 5}]}','2026-01-21 09:41:17.533','2026-01-21 09:41:17.533'),('d22f50e1-4e43-43f8-ac89-a0a81c958fac','CUSTOM','ประสิทธิภาพในการแก้ไขข้อผิดพลาดของระบบ','{\"kind\": \"CUSTOM_DESCRIPTION_1_TO_5\", \"levels\": [{\"desc\": \"กระทบระบบ/ผู้ใช้อย่างมีนัยสำคัญ\", \"score\": 1}, {\"desc\": \"ปิดบัคช้า/มี regression บ่อย\", \"score\": 2}, {\"desc\": \"ปิดบัคได้ตามปกติ\", \"score\": 3}, {\"desc\": \"ปิดบัคทัน SLA เป็นส่วนใหญ่ regression น้อย\", \"score\": 4}, {\"desc\": \"ปิดบัคทัน SLA และแทบไม่มี regression\", \"score\": 5}]}','2026-01-26 14:23:31.757','2026-01-26 14:23:31.757'),('efaabc88-f7ea-4c77-b4b8-e372b15b72a7','CUSTOM','การทำงานร่วมกันและการสื่อสารภายในทีม','{\"kind\": \"CUSTOM_DESCRIPTION_1_TO_5\", \"levels\": [{\"desc\": \"สื่อสารชัดเจน proactive ช่วยทีมสม่ำเสมอ\", \"score\": 5}, {\"desc\": \"สื่อสารดี ติดตามงาน ช่วยทีม\", \"score\": 4}, {\"desc\": \"สื่อสารตามปกติ\", \"score\": 3}, {\"desc\": \"สื่อสารไม่สม่ำเสมอ ทำให้งานติดขัด\", \"score\": 2}, {\"desc\": \"สื่อสารไม่ชัดเจน ส่งผลกระทบต่อทีม\", \"score\": 1}]}','2026-01-26 14:27:55.023','2026-01-26 14:27:55.023'),('fdcb823b-4176-421b-a75b-338fc9256a19','QUANTITATIVE','การส่งมอบฟีเจอร์ตามแผนงาน','{\"kind\": \"QUANTITATIVE_1_TO_5\", \"levels\": [{\"unit\": \"เปอร์เซ็นต์\", \"score\": 1, \"value\": 0}, {\"unit\": \"เปอร์เซ็นต์\", \"score\": 2, \"value\": 80}, {\"unit\": \"เปอร์เซ็นต์\", \"score\": 3, \"value\": 90}, {\"unit\": \"เปอร์เซ็นต์\", \"score\": 4, \"value\": 95}, {\"unit\": \"เปอร์เซ็นต์\", \"score\": 5, \"value\": 100}]}','2026-01-26 14:19:32.602','2026-01-26 14:19:32.602');
/*!40000 ALTER TABLE `KpiType` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Level`
--

DROP TABLE IF EXISTS `Level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Level` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Level_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Level`
--

LOCK TABLES `Level` WRITE;
/*!40000 ALTER TABLE `Level` DISABLE KEYS */;
INSERT INTO `Level` VALUES ('2ee23a10-bd88-4ff7-929a-3a1f8a6ece88','L2','Mid-level','2026-01-21 07:56:05.914','2026-01-21 07:56:05.914'),('c2a9d4f7-3b8e-4c1a-9f62-1e5a7b0d8c43','L3','High-level','2026-01-26 01:49:53.688','2026-01-26 01:49:45.000'),('ca0a963c-0a93-4c1a-842d-63ae17f792da','L1','Low-level','2026-01-21 07:56:13.517','2026-01-21 07:56:13.517');
/*!40000 ALTER TABLE `Level` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Organization`
--

DROP TABLE IF EXISTS `Organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Organization` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `managerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Organization_code_key` (`code`),
  KEY `Organization_parentId_idx` (`parentId`),
  KEY `Organization_managerId_idx` (`managerId`),
  CONSTRAINT `Organization_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Organization_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Organization` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Organization`
--

LOCK TABLES `Organization` WRITE;
/*!40000 ALTER TABLE `Organization` DISABLE KEYS */;
INSERT INTO `Organization` VALUES ('79d84099-b139-4c29-b8f5-638859e63467','ORG-SW','Software',NULL,NULL,'2026-01-21 07:55:06.101','2026-01-21 07:55:06.101');
/*!40000 ALTER TABLE `Organization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Position`
--

DROP TABLE IF EXISTS `Position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Position` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Position_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Position`
--

LOCK TABLES `Position` WRITE;
/*!40000 ALTER TABLE `Position` DISABLE KEYS */;
INSERT INTO `Position` VALUES ('a029cd95-9e31-4142-87ee-1213030b2ac1','POS-SE','Software Engineer','2026-01-21 07:55:38.303','2026-01-21 07:55:38.303');
/*!40000 ALTER TABLE `Position` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_employeeId_key` (`employeeId`),
  CONSTRAINT `User_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES ('e7b6d6c7-8a34-4a4e-9e47-8d9a2c4a6f1b','saweedus@example.com','$2b$10$9hfcvCU6u1OkCaq30ZUmhON.rxnkaWIYQuWg0rSz.ZC40dkT53ZYy',1,'2f0fea47-6c86-4d47-9bae-f9316853e8e6',NULL,'2026-01-24 15:04:26.051','2026-01-24 15:04:17.000');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-27 22:56:16
