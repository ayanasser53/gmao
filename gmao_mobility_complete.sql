-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: gmao_mobility
-- ------------------------------------------------------
-- Server version	8.0.46

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

--
-- Current Database: `gmao_mobility`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `gmao_mobility` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `gmao_mobility`;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_id` bigint NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DONE','IN_PROGRESS','LATE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `performed_date` date NOT NULL,
  `performed_end_time` time(6) NOT NULL,
  `spent_hours` int NOT NULL DEFAULT '0',
  `spent_minutes` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activities_chk_1` CHECK (((`spent_hours` >= 0) and (`spent_minutes` between 0 and 59)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,1,'dfdss','IN_PROGRESS','2026-07-15 15:16:07','2026-07-15 15:16:07','2026-07-15','15:15:00.000000',1,30),(2,1,'FQG','IN_PROGRESS','2026-07-15 15:16:47','2026-07-15 15:16:47','2026-07-15','15:16:00.000000',1,15);
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_measures`
--

DROP TABLE IF EXISTS `activity_measures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_measures` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_id` bigint NOT NULL,
  `measure_id` bigint NOT NULL,
  `value` decimal(15,4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_id` (`activity_id`),
  KEY `measure_id` (`measure_id`),
  CONSTRAINT `activity_measures_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_measures_ibfk_2` FOREIGN KEY (`measure_id`) REFERENCES `measures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_measures`
--

LOCK TABLES `activity_measures` WRITE;
/*!40000 ALTER TABLE `activity_measures` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_measures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_spare_parts`
--

DROP TABLE IF EXISTS `activity_spare_parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_spare_parts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_id` bigint NOT NULL,
  `spare_part_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `activity_id` (`activity_id`),
  KEY `spare_part_id` (`spare_part_id`),
  CONSTRAINT `activity_spare_parts_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_spare_parts_ibfk_2` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`),
  CONSTRAINT `activity_spare_parts_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_spare_parts`
--

LOCK TABLES `activity_spare_parts` WRITE;
/*!40000 ALTER TABLE `activity_spare_parts` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_spare_parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checklist_items`
--

DROP TABLE IF EXISTS `checklist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `checklist_id` bigint NOT NULL,
  `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `checklist_id` (`checklist_id`),
  CONSTRAINT `checklist_items_ibfk_1` FOREIGN KEY (`checklist_id`) REFERENCES `checklists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checklist_items`
--

LOCK TABLES `checklist_items` WRITE;
/*!40000 ALTER TABLE `checklist_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `checklist_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checklists`
--

DROP TABLE IF EXISTS `checklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklists` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checklists`
--

LOCK TABLES `checklists` WRITE;
/*!40000 ALTER TABLE `checklists` DISABLE KEYS */;
/*!40000 ALTER TABLE `checklists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cost_centers`
--

DROP TABLE IF EXISTS `cost_centers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cost_centers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cost_centers`
--

LOCK TABLES `cost_centers` WRITE;
/*!40000 ALTER TABLE `cost_centers` DISABLE KEYS */;
INSERT INTO `cost_centers` VALUES (1,'124001','2026-07-13 11:15:52'),(2,'124002','2026-07-13 11:15:52'),(3,'564001','2026-07-13 11:15:52'),(4,'564002','2026-07-13 11:15:52'),(5,'630T','2026-07-13 11:15:52'),(6,'B14001','2026-07-13 11:15:52'),(7,'KOST001','2026-07-13 11:15:52'),(8,'Production','2026-07-13 11:15:52'),(9,'Production 2','2026-07-13 11:15:52'),(10,'Shop','2026-07-13 11:15:52');
/*!40000 ALTER TABLE `cost_centers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment`
--

DROP TABLE IF EXISTS `equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cost_center_id` bigint DEFAULT NULL,
  `gtin_ean_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_equipment_id` bigint DEFAULT NULL,
  `visibility` enum('PUBLIC','PRIVATE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRIVATE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cost_center_id` (`cost_center_id`),
  KEY `fk_equipment_parent` (`parent_equipment_id`),
  CONSTRAINT `equipment_ibfk_1` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_equipment_parent` FOREIGN KEY (`parent_equipment_id`) REFERENCES `equipment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment`
--

LOCK TABLES `equipment` WRITE;
/*!40000 ALTER TABLE `equipment` DISABLE KEYS */;
INSERT INTO `equipment` VALUES (2,'/uploads/equipment/a87784b3-7aa9-4b4f-b376-18a221e0baa0.png','equipement1','equipement1',9,'1111','111',NULL,'PRIVATE','2026-07-13 13:05:31','2026-07-14 18:18:57'),(3,'/uploads/equipment/51abac5c-fa27-4d73-8e6c-dd456a7667a9.png','dfs','dfgg',NULL,NULL,NULL,NULL,'PRIVATE','2026-07-13 18:22:35','2026-07-14 18:19:48'),(4,'/uploads/equipment/ef2241d8-74a5-4eb7-8aa4-9579769d4af1.png','retrtrea','fsdqfggeg',7,'zefzergzg','H3455',NULL,'PRIVATE','2026-07-14 18:06:47','2026-07-14 18:06:47');
/*!40000 ALTER TABLE `equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_links`
--

DROP TABLE IF EXISTS `equipment_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_links` (
  `equipment_id` bigint NOT NULL,
  `linked_equipment_id` bigint NOT NULL,
  PRIMARY KEY (`equipment_id`,`linked_equipment_id`),
  KEY `FKhub6nebdatpbce598d02rsyhi` (`linked_equipment_id`),
  CONSTRAINT `FK29gv24mm0933cn5facw6s6kii` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`),
  CONSTRAINT `FKhub6nebdatpbce598d02rsyhi` FOREIGN KEY (`linked_equipment_id`) REFERENCES `equipment` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_links`
--

LOCK TABLES `equipment_links` WRITE;
/*!40000 ALTER TABLE `equipment_links` DISABLE KEYS */;
INSERT INTO `equipment_links` VALUES (4,3);
/*!40000 ALTER TABLE `equipment_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_spare_parts`
--

DROP TABLE IF EXISTS `equipment_spare_parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_spare_parts` (
  `equipment_id` bigint NOT NULL,
  `spare_part_id` bigint NOT NULL,
  PRIMARY KEY (`equipment_id`,`spare_part_id`),
  KEY `FKpu83bqc2xixu365c596dyfkvl` (`spare_part_id`),
  CONSTRAINT `FKiw3us76sqivo573jxxt0whvek` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`),
  CONSTRAINT `FKpu83bqc2xixu365c596dyfkvl` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_spare_parts`
--

LOCK TABLES `equipment_spare_parts` WRITE;
/*!40000 ALTER TABLE `equipment_spare_parts` DISABLE KEYS */;
INSERT INTO `equipment_spare_parts` VALUES (3,1),(4,1),(2,2);
/*!40000 ALTER TABLE `equipment_spare_parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment_tags`
--

DROP TABLE IF EXISTS `equipment_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_tags` (
  `equipment_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`equipment_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `equipment_tags_ibfk_1` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `equipment_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment_tags`
--

LOCK TABLES `equipment_tags` WRITE;
/*!40000 ALTER TABLE `equipment_tags` DISABLE KEYS */;
INSERT INTO `equipment_tags` VALUES (2,3),(2,4),(3,4),(2,5),(3,5),(4,5);
/*!40000 ALTER TABLE `equipment_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_plan_assignees`
--

DROP TABLE IF EXISTS `maintenance_plan_assignees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_plan_assignees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `maintenance_plan_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `team_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `maintenance_plan_id` (`maintenance_plan_id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `maintenance_plan_assignees_ibfk_1` FOREIGN KEY (`maintenance_plan_id`) REFERENCES `maintenance_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_plan_assignees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_plan_assignees_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_plan_assignees_chk_1` CHECK ((((`user_id` is not null) and (`team_id` is null)) or ((`user_id` is null) and (`team_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_plan_assignees`
--

LOCK TABLES `maintenance_plan_assignees` WRITE;
/*!40000 ALTER TABLE `maintenance_plan_assignees` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_plan_assignees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_plan_observers`
--

DROP TABLE IF EXISTS `maintenance_plan_observers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_plan_observers` (
  `maintenance_plan_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`maintenance_plan_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `maintenance_plan_observers_ibfk_1` FOREIGN KEY (`maintenance_plan_id`) REFERENCES `maintenance_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_plan_observers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_plan_observers`
--

LOCK TABLES `maintenance_plan_observers` WRITE;
/*!40000 ALTER TABLE `maintenance_plan_observers` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_plan_observers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_plan_spare_parts`
--

DROP TABLE IF EXISTS `maintenance_plan_spare_parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_plan_spare_parts` (
  `maintenance_plan_id` bigint NOT NULL,
  `spare_part_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`maintenance_plan_id`,`spare_part_id`),
  KEY `spare_part_id` (`spare_part_id`),
  CONSTRAINT `maintenance_plan_spare_parts_ibfk_1` FOREIGN KEY (`maintenance_plan_id`) REFERENCES `maintenance_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_plan_spare_parts_ibfk_2` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_plan_spare_parts_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_plan_spare_parts`
--

LOCK TABLES `maintenance_plan_spare_parts` WRITE;
/*!40000 ALTER TABLE `maintenance_plan_spare_parts` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_plan_spare_parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_plan_tags`
--

DROP TABLE IF EXISTS `maintenance_plan_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_plan_tags` (
  `maintenance_plan_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`maintenance_plan_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `maintenance_plan_tags_ibfk_1` FOREIGN KEY (`maintenance_plan_id`) REFERENCES `maintenance_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_plan_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_plan_tags`
--

LOCK TABLES `maintenance_plan_tags` WRITE;
/*!40000 ALTER TABLE `maintenance_plan_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_plan_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_plans`
--

DROP TABLE IF EXISTS `maintenance_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_plans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `equipment_only` tinyint(1) NOT NULL DEFAULT '1',
  `equipment_id` bigint NOT NULL,
  `description` varchar(3000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `planned_maintenance_hours` int NOT NULL DEFAULT '0',
  `planned_maintenance_minutes` int NOT NULL DEFAULT '0',
  `planned_stopped_hours` int NOT NULL DEFAULT '0',
  `planned_stopped_minutes` int NOT NULL DEFAULT '0',
  `status` enum('IN_PROGRESS','DONE','LATE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_PROGRESS',
  `checklist_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `regulatory` tinyint(1) NOT NULL DEFAULT '0',
  `trigger_type` enum('FIXED_DATE','TASK_CLOSURE','EXTERNAL_API','COUNTER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIXED_DATE',
  `frequency_value` int NOT NULL DEFAULT '1',
  `frequency_unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `next_due_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `checklist_id` (`checklist_id`),
  CONSTRAINT `maintenance_plans_ibfk_1` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`),
  CONSTRAINT `maintenance_plans_ibfk_2` FOREIGN KEY (`checklist_id`) REFERENCES `checklists` (`id`) ON DELETE SET NULL,
  CONSTRAINT `maintenance_plans_chk_1` CHECK (((`planned_maintenance_hours` >= 0) and (`planned_maintenance_minutes` between 0 and 59))),
  CONSTRAINT `maintenance_plans_chk_2` CHECK (((`planned_stopped_hours` >= 0) and (`planned_stopped_minutes` between 0 and 59)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_plans`
--

LOCK TABLES `maintenance_plans` WRITE;
/*!40000 ALTER TABLE `maintenance_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `measures`
--

DROP TABLE IF EXISTS `measures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `measures` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `unit_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_measure_code` (`code`),
  KEY `fk_measure_unit` (`unit_id`),
  CONSTRAINT `fk_measure_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `measures`
--

LOCK TABLES `measures` WRITE;
/*!40000 ALTER TABLE `measures` DISABLE KEYS */;
INSERT INTO `measures` VALUES (1,'Pressure','pressure','Mesure de la pression de l\'equipement.',1,'2026-07-11 13:00:36','2026-07-11 17:44:09'),(2,'Temps darrt','temps_arret','Dure totale darrt de lquipement.',2,'2026-07-11 13:00:36','2026-07-11 13:01:22');
/*!40000 ALTER TABLE `measures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_lines`
--

DROP TABLE IF EXISTS `purchase_order_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_lines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `purchase_order_id` bigint NOT NULL,
  `line_type` enum('SPARE_PART','FREE_TEXT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `spare_part_id` bigint DEFAULT NULL,
  `free_text` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `spare_part_id` (`spare_part_id`),
  CONSTRAINT `purchase_order_lines_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_lines_ibfk_2` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_order_lines_chk_1` CHECK ((`quantity` > 0)),
  CONSTRAINT `purchase_order_lines_chk_2` CHECK ((`unit_price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_lines`
--

LOCK TABLES `purchase_order_lines` WRITE;
/*!40000 ALTER TABLE `purchase_order_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `supplier_id` bigint DEFAULT NULL,
  `reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `notes` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','ORDERED','RECEIVED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spare_part_links`
--

DROP TABLE IF EXISTS `spare_part_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_part_links` (
  `spare_part_id` bigint NOT NULL,
  `linked_spare_part_id` bigint NOT NULL,
  PRIMARY KEY (`spare_part_id`,`linked_spare_part_id`),
  KEY `FKh2kxpaibnox2y8h3yqb0n6e2j` (`linked_spare_part_id`),
  CONSTRAINT `FKh2kxpaibnox2y8h3yqb0n6e2j` FOREIGN KEY (`linked_spare_part_id`) REFERENCES `spare_parts` (`id`),
  CONSTRAINT `FKt0t1iw30uhcw7a83cuxc7b1yt` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spare_part_links`
--

LOCK TABLES `spare_part_links` WRITE;
/*!40000 ALTER TABLE `spare_part_links` DISABLE KEYS */;
INSERT INTO `spare_part_links` VALUES (2,1);
/*!40000 ALTER TABLE `spare_part_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spare_part_stock_movements`
--

DROP TABLE IF EXISTS `spare_part_stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_part_stock_movements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `movement_date` datetime(6) NOT NULL,
  `movement_type` varchar(255) NOT NULL,
  `quantity` decimal(38,2) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `source` varchar(255) NOT NULL,
  `unit_cost` decimal(38,2) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `spare_part_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbulo0mr3o6e7acsmtntushr3p` (`spare_part_id`),
  CONSTRAINT `FKbulo0mr3o6e7acsmtntushr3p` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spare_part_stock_movements`
--

LOCK TABLES `spare_part_stock_movements` WRITE;
/*!40000 ALTER TABLE `spare_part_stock_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `spare_part_stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spare_part_tags`
--

DROP TABLE IF EXISTS `spare_part_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_part_tags` (
  `spare_part_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`spare_part_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `spare_part_tags_ibfk_1` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spare_part_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spare_part_tags`
--

LOCK TABLES `spare_part_tags` WRITE;
/*!40000 ALTER TABLE `spare_part_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `spare_part_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spare_parts`
--

DROP TABLE IF EXISTS `spare_parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_parts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(38,2) DEFAULT NULL,
  `currency` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` int NOT NULL DEFAULT '0',
  `minimum_stock` decimal(38,2) DEFAULT NULL,
  `maximum_stock` decimal(38,2) DEFAULT NULL,
  `replenishment_lot` int NOT NULL DEFAULT '1',
  `location_id` bigint DEFAULT NULL,
  `cost_center_id` bigint DEFAULT NULL,
  `gtin_ean_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visibility` enum('PUBLIC','PRIVATE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRIVATE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `article_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost_center` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gtin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacturer_reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(38,2) DEFAULT NULL,
  `reorder_quantity` decimal(38,2) DEFAULT NULL,
  `supplier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKte0ae3mddvxty8li5at990qtk` (`code`),
  KEY `location_id` (`location_id`),
  KEY `cost_center_id` (`cost_center_id`),
  KEY `FK9456yuqmeyj2oybmq52q0pcx7` (`supplier_id`),
  CONSTRAINT `FK9456yuqmeyj2oybmq52q0pcx7` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `spare_parts_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `spare_parts_ibfk_2` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `spare_parts_chk_1` CHECK ((`unit_price` >= 0)),
  CONSTRAINT `spare_parts_chk_2` CHECK ((`amount` >= 0)),
  CONSTRAINT `spare_parts_chk_3` CHECK ((`replenishment_lot` > 0)),
  CONSTRAINT `spare_parts_chk_4` CHECK (((`minimum_stock` is null) or (`minimum_stock` >= 0))),
  CONSTRAINT `spare_parts_chk_5` CHECK (((`maximum_stock` is null) or (`maximum_stock` >= 0))),
  CONSTRAINT `spare_parts_chk_6` CHECK (((`minimum_stock` is null) or (`maximum_stock` is null) or (`minimum_stock` <= `maximum_stock`)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spare_parts`
--

LOCK TABLES `spare_parts` WRITE;
/*!40000 ALTER TABLE `spare_parts` DISABLE KEYS */;
INSERT INTO `spare_parts` VALUES (1,'/uploads/spare-parts/77177b54-7055-42d2-8ceb-b88a4963479a.png','fsdjkhjk','',234.00,'EUR',0,3.00,3.00,1,NULL,3,NULL,NULL,'PRIVATE','2026-07-14 12:59:25','2026-07-14 17:55:02','','sdqdf','QDF',NULL,'',NULL,'','H4356456',9.00,1.00,NULL),(2,'/uploads/spare-parts/4fe23f57-75e7-466a-9ee5-d1176e455963.png','dsfgdfd','DGFGTRTRRH',146.00,'EUR',0,5.00,9.00,1,NULL,5,NULL,NULL,'PRIVATE','2026-07-14 18:11:31','2026-07-14 18:18:02','GDFST','dfggg','MM-000002',NULL,'ERZTGERTG',NULL,'45','A4355',56.00,1.00,NULL);
/*!40000 ALTER TABLE `spare_parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_catalog_items`
--

DROP TABLE IF EXISTS `supplier_catalog_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_catalog_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `equipment_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacturer_part_number` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gtin_ean_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `supplier_catalog_items_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_catalog_items`
--

LOCK TABLES `supplier_catalog_items` WRITE;
/*!40000 ALTER TABLE `supplier_catalog_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_catalog_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visibility` enum('PRIVATE','PUBLIC') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `siren_or_siret` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'sjcks','','snop@gmail.com','snop.ma','11','0666666666','0666666666','sdc','tanger','Maroc','PRIVATE','2026-07-14 09:10:20','2026-07-14 09:10:20','https://th.bing.com/th/id/OIP.MGpBLBWCP2ZL8y9NQF-ltQHaDX?w=295&h=159&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3','1111','11');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tag_groups`
--

DROP TABLE IF EXISTS `tag_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `single_choice` tinyint(1) NOT NULL DEFAULT '0',
  `mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tag_groups`
--

LOCK TABLES `tag_groups` WRITE;
/*!40000 ALTER TABLE `tag_groups` DISABLE KEYS */;
INSERT INTO `tag_groups` VALUES (1,'Type de maintenance',1,1,'2026-07-13 07:03:57','2026-07-13 07:03:57'),(2,'Priorit',1,0,'2026-07-13 07:03:57','2026-07-13 07:03:57'),(3,'Zone de production',0,0,'2026-07-13 07:03:57','2026-07-13 07:03:57');
/*!40000 ALTER TABLE `tag_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#9E9E9E',
  `group_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `uk_tag_code` (`code`),
  UNIQUE KEY `uk_tags_code` (`code`),
  UNIQUE KEY `uk_tags_name` (`name`),
  KEY `fk_tag_group` (`group_id`),
  CONSTRAINT `fk_tag_group` FOREIGN KEY (`group_id`) REFERENCES `tag_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'Prventive','preventive','#9E9E9E',1,'2026-07-13 07:04:11','2026-07-13 07:04:11'),(2,'Corrective','corrective','#6B7280',1,'2026-07-13 07:04:11','2026-07-13 07:04:11'),(3,'Priorit leve','high_priority','#EF4444',2,'2026-07-13 07:04:11','2026-07-13 07:04:11'),(4,'Priorit moyenne','medium_priority','#F59E0B',2,'2026-07-13 07:04:11','2026-07-13 07:04:11'),(5,'Priorit faible','low_priority','#10B981',2,'2026-07-13 07:04:11','2026-07-13 07:04:11');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_assignees`
--

DROP TABLE IF EXISTS `task_assignees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_assignees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `team_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `task_assignees_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignees_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignees_chk_1` CHECK ((((`user_id` is not null) and (`team_id` is null)) or ((`user_id` is null) and (`team_id` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_assignees`
--

LOCK TABLES `task_assignees` WRITE;
/*!40000 ALTER TABLE `task_assignees` DISABLE KEYS */;
INSERT INTO `task_assignees` VALUES (1,1,4,NULL);
/*!40000 ALTER TABLE `task_assignees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_documents`
--

DROP TABLE IF EXISTS `task_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_id` bigint NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `task_documents_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_documents`
--

LOCK TABLES `task_documents` WRITE;
/*!40000 ALTER TABLE `task_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_spare_parts`
--

DROP TABLE IF EXISTS `task_spare_parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_spare_parts` (
  `task_id` bigint NOT NULL,
  `spare_part_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`task_id`,`spare_part_id`),
  KEY `spare_part_id` (`spare_part_id`),
  CONSTRAINT `task_spare_parts_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_spare_parts_ibfk_2` FOREIGN KEY (`spare_part_id`) REFERENCES `spare_parts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_spare_parts_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_spare_parts`
--

LOCK TABLES `task_spare_parts` WRITE;
/*!40000 ALTER TABLE `task_spare_parts` DISABLE KEYS */;
INSERT INTO `task_spare_parts` VALUES (1,2,1);
/*!40000 ALTER TABLE `task_spare_parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_tags`
--

DROP TABLE IF EXISTS `task_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_tags` (
  `task_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`task_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `task_tags_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_tags`
--

LOCK TABLES `task_tags` WRITE;
/*!40000 ALTER TABLE `task_tags` DISABLE KEYS */;
INSERT INTO `task_tags` VALUES (1,2);
/*!40000 ALTER TABLE `task_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `equipment_only` tinyint(1) NOT NULL DEFAULT '1',
  `equipment_id` bigint NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `all_day` tinyint(1) NOT NULL DEFAULT '0',
  `start_date` date NOT NULL,
  `start_hour` time DEFAULT NULL,
  `end_date` date NOT NULL,
  `end_hour` time DEFAULT NULL,
  `planned_maintenance_hours` int NOT NULL DEFAULT '0',
  `planned_maintenance_minutes` int NOT NULL DEFAULT '0',
  `planned_stopped_hours` int NOT NULL DEFAULT '0',
  `planned_stopped_minutes` int NOT NULL DEFAULT '0',
  `status` enum('DONE','IN_PROGRESS','LATE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `checklist_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `checklist_id` (`checklist_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`),
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`checklist_id`) REFERENCES `checklists` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tasks_chk_1` CHECK (((`planned_maintenance_hours` >= 0) and (`planned_maintenance_minutes` between 0 and 59))),
  CONSTRAINT `tasks_chk_2` CHECK (((`planned_stopped_hours` >= 0) and (`planned_stopped_minutes` between 0 and 59)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,1,4,'GHKFKYUFYUFYU VHLJJ',1,'2026-07-15',NULL,'2026-07-15',NULL,3,0,3,0,'IN_PROGRESS',NULL,'2026-07-15 10:14:16','2026-07-15 10:15:11');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `team_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`team_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_tags`
--

DROP TABLE IF EXISTS `team_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_tags` (
  `team_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`team_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `team_tags_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_tags`
--

LOCK TABLES `team_tags` WRITE;
/*!40000 ALTER TABLE `team_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_type` enum('NUMBER','TEXT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NUMBER',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `uk_unit_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'Bars','bar','bar','NUMBER','2026-07-11 12:52:56','2026-07-11 12:52:56'),(2,'Hour','h','hour','NUMBER','2026-07-11 12:52:56','2026-07-11 12:52:56'),(3,'Minutes','min','minutes','NUMBER','2026-07-11 12:52:56','2026-07-11 12:52:56'),(4,'Celsius','C','celsius','NUMBER','2026-07-11 12:52:56','2026-07-11 12:52:56'),(6,'Pascal','Pa','pascal','NUMBER','2026-07-11 15:34:09','2026-07-11 15:34:09'),(7,'aya','min','aya','TEXT','2026-07-11 16:14:59','2026-07-11 16:14:59');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_tags`
--

DROP TABLE IF EXISTS `user_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tags` (
  `user_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `user_tags_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_tags`
--

LOCK TABLES `user_tags` WRITE;
/*!40000 ALTER TABLE `user_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ADMIN',
  `hourly_rate` decimal(38,2) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'Fatima','Ibaararen','admin@gmao.com','0600000000','$2a$10$zlLFwovntedYOra0S.BXT.h/fX5Td/AplViXbmiiVmDsqaPVZTCYq','ADMIN',NULL,1,'2026-07-10 07:59:55','2026-07-10 07:59:55'),(2,NULL,'aya','nasser','nasseraya7777@gmao.com','0677889934','$2a$10$kXpa1VvtLDhGxJqnnEyGiuKUhKoX8hyOAuPkUPOtQOO8Aryqnf2uq','ADMIN',NULL,1,'2026-07-10 09:23:21','2026-07-10 09:23:21'),(3,NULL,'aya','nasser','nasseraya7776@gmao.com','0677889934','$2a$10$VSbFK8mp/S4wq1ZiF/oEreLBjrjUWiqbp82Wxunmzb3mbla7Hdy5O','ADMIN',NULL,1,'2026-07-10 11:04:35','2026-07-10 11:04:35'),(4,NULL,'aya','aya','aya@gmail.com','0666666666','$2a$10$84Cc/uU4H/dBno1VCdaMxeOeyVSloJcgQBIUNchNzCHX/TZ017Lvi','ADMIN',NULL,1,'2026-07-10 11:05:27','2026-07-10 11:05:27'),(5,NULL,'aya','nasser','nasser@gmail.com','0666666666','$2a$10$TJLPw75Op5ytHOfwqhDeLutV0ITOuw5QiDkAB2s2Gffz4d7bJSv3S','ADMIN',NULL,1,'2026-07-10 11:31:01','2026-07-10 11:31:01');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'gmao_mobility'
--

--
-- Dumping routines for database 'gmao_mobility'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-17  7:13:06
