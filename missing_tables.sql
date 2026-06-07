-- ============================================================
-- Missing tables for lab_animal_db
-- Generated from TypeORM entity files
-- MySQL 8 syntax
-- ============================================================

-- 1. feeding_records
CREATE TABLE IF NOT EXISTS `feeding_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `animal_id` INT NOT NULL,
  `feed_date` DATE NOT NULL,
  `feed_time` TIME DEFAULT NULL,
  `food_type` VARCHAR(100) NOT NULL,
  `quantity` DECIMAL(10,2) DEFAULT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'g',
  `water_ml` DECIMAL(10,2) DEFAULT NULL,
  `feeder` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_feeding_animal` (`animal_id`),
  CONSTRAINT `fk_feeding_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. experiment_milestones
CREATE TABLE IF NOT EXISTS `experiment_milestones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `experiment_id` INT NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `planned_date` DATE NOT NULL,
  `actual_date` DATE DEFAULT NULL,
  `status` ENUM('pending','completed','overdue') NOT NULL DEFAULT 'pending',
  `assignee` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_milestone_experiment` (`experiment_id`),
  CONSTRAINT `fk_milestone_experiment` FOREIGN KEY (`experiment_id`) REFERENCES `experiments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. animal_transfers
CREATE TABLE IF NOT EXISTS `animal_transfers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `animal_id` INT NOT NULL,
  `from_department` VARCHAR(100) NOT NULL,
  `to_department` VARCHAR(100) NOT NULL,
  `reason` ENUM('experiment_borrow','permanent_transfer','return_to_supplier') NOT NULL,
  `transfer_date` DATE NOT NULL,
  `expected_return_date` DATE DEFAULT NULL,
  `actual_return_date` DATE DEFAULT NULL,
  `status` ENUM('pending','in_transit','completed','returned') NOT NULL DEFAULT 'pending',
  `handler` VARCHAR(100) NOT NULL,
  `approver` VARCHAR(100) DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_transfer_animal` (`animal_id`),
  CONSTRAINT `fk_transfer_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. death_records
CREATE TABLE IF NOT EXISTS `death_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `animal_id` INT NOT NULL,
  `death_datetime` DATETIME NOT NULL,
  `causeCategory` ENUM('natural','experiment_termination','accidental','euthanasia') NOT NULL,
  `causeDescription` TEXT DEFAULT NULL,
  `found_by` VARCHAR(100) DEFAULT NULL,
  `confirming_vet` VARCHAR(100) DEFAULT NULL,
  `disposalMethod` ENUM('necropsy','incineration','cryopreservation') NOT NULL,
  `necropsyStatus` ENUM('not_needed','pending','completed') NOT NULL DEFAULT 'not_needed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_death_animal` (`animal_id`),
  CONSTRAINT `fk_death_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. necropsy_reports
CREATE TABLE IF NOT EXISTS `necropsy_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `death_record_id` INT NOT NULL,
  `necropsy_date` DATE NOT NULL,
  `performed_by` VARCHAR(100) DEFAULT NULL,
  `gross_findings` TEXT DEFAULT NULL,
  `histopathology_findings` TEXT DEFAULT NULL,
  `finalDiagnosis` TEXT DEFAULT NULL,
  `image_urls` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_necropsy_death_record` (`death_record_id`),
  CONSTRAINT `fk_necropsy_death_record` FOREIGN KEY (`death_record_id`) REFERENCES `death_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. inventory_items
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `category` ENUM('drug','consumable','reagent','equipment') NOT NULL,
  `specification` VARCHAR(200) DEFAULT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `current_quantity` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `safety_stock` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `storage_location` VARCHAR(200) DEFAULT NULL,
  `expiry_date` DATE DEFAULT NULL,
  `supplier` VARCHAR(200) DEFAULT NULL,
  `unit_price` DECIMAL(10,2) DEFAULT NULL,
  `remark` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. inventory_transactions
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item_id` INT NOT NULL,
  `type` ENUM('in','out','adjust') NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `transaction_date` DATETIME NOT NULL,
  `operator` VARCHAR(100) DEFAULT NULL,
  `experiment_id` INT DEFAULT NULL,
  `reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_invtx_item` (`item_id`),
  CONSTRAINT `fk_invtx_item` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. weight_records
CREATE TABLE IF NOT EXISTS `weight_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `animal_id` INT NOT NULL,
  `weigh_date` DATE NOT NULL,
  `weigh_time` TIME DEFAULT NULL,
  `weight` DECIMAL(10,2) NOT NULL,
  `weigher` VARCHAR(100) DEFAULT NULL,
  `device_no` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_weight_animal` (`animal_id`),
  CONSTRAINT `fk_weight_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. announcements
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `type` ENUM('notice','warning','update') NOT NULL DEFAULT 'notice',
  `publisher_id` INT NOT NULL,
  `publish_time` TIMESTAMP DEFAULT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_announcement_publisher` (`publisher_id`),
  CONSTRAINT `fk_announcement_publisher` FOREIGN KEY (`publisher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `send_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `related_type` VARCHAR(50) DEFAULT NULL,
  `related_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_message_sender` (`sender_id`),
  KEY `fk_message_receiver` (`receiver_id`),
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. animal_usage_requests
CREATE TABLE IF NOT EXISTS `animal_usage_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT NOT NULL,
  `request_date` DATE NOT NULL,
  `experiment_id` INT DEFAULT NULL,
  `species` VARCHAR(50) NOT NULL,
  `strain` VARCHAR(50) DEFAULT NULL,
  `quantity` INT NOT NULL,
  `genderRequirement` ENUM('male','female','any') NOT NULL DEFAULT 'any',
  `min_weight` DECIMAL(10,2) DEFAULT NULL,
  `max_weight` DECIMAL(10,2) DEFAULT NULL,
  `purpose` TEXT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('draft','submitted','approved','rejected','withdrawn') NOT NULL DEFAULT 'draft',
  `approver_id` INT DEFAULT NULL,
  `approval_time` DATETIME DEFAULT NULL,
  `approval_comment` TEXT DEFAULT NULL,
  `allocation_result` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_usage_req_applicant` (`applicant_id`),
  KEY `fk_usage_req_approver` (`approver_id`),
  KEY `fk_usage_req_experiment` (`experiment_id`),
  CONSTRAINT `fk_usage_req_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usage_req_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_usage_req_experiment` FOREIGN KEY (`experiment_id`) REFERENCES `experiments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. animal_photos
CREATE TABLE IF NOT EXISTS `animal_photos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `animal_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `thumbnail_url` VARCHAR(500) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `shot_date` DATE DEFAULT NULL,
  `tags` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `uploader` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_photo_animal` (`animal_id`),
  CONSTRAINT `fk_photo_animal` FOREIGN KEY (`animal_id`) REFERENCES `animals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. backup_records
CREATE TABLE IF NOT EXISTS `backup_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `backup_type` ENUM('auto','manual') NOT NULL DEFAULT 'manual',
  `status` ENUM('success','failed','running') NOT NULL DEFAULT 'running',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `duration_ms` BIGINT NOT NULL DEFAULT 0,
  `remark` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
