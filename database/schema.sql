-- ==============================================================
-- Krishi Mitra (ಕೃಷಿ ಮಿತ್ರ) Database Schema
-- Target RDBMS: MySQL 8.0+
-- Default Port: 3306
-- Character Set: utf8mb4 (Required for Kannada text & symbols)
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `krishi_mitra_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `krishi_mitra_db`;

-- 1. Farmers Profile Table
CREATE TABLE IF NOT EXISTS `farmers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `fruits_id` VARCHAR(64) UNIQUE NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone_number` VARCHAR(15) NOT NULL,
    `aadhaar_last_four` VARCHAR(4) NULL,
    `district` VARCHAR(100) NOT NULL,
    `district_kn` VARCHAR(100) NOT NULL,
    `taluk` VARCHAR(100) NULL,
    `village` VARCHAR(100) NULL,
    `caste_category` ENUM('SC', 'ST', 'OBC', 'General') NOT NULL DEFAULT 'General',
    `annual_income` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_land_acres` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    `farmer_category` ENUM('Marginal', 'Small', 'Medium', 'Large') NOT NULL DEFAULT 'Small',
    `soil_type` VARCHAR(60) NULL DEFAULT 'Red Loamy',
    `irrigation_type` VARCHAR(60) NOT NULL DEFAULT 'Rainfed',
    `has_borewell` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_farmer_phone` (`phone_number`),
    INDEX `idx_farmer_district` (`district`),
    INDEX `idx_farmer_category` (`farmer_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Crops Cultivated Table
CREATE TABLE IF NOT EXISTS `crops` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `farmer_id` INT NOT NULL,
    `crop_name` VARCHAR(100) NOT NULL,
    `crop_name_kn` VARCHAR(100) NOT NULL,
    `crop_category` ENUM('Siridhanya_Millet', 'Cereal', 'Pulse', 'Oilseed', 'Cash_Crop', 'Horticulture') NOT NULL,
    `acres` DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    `season` ENUM('Kharif', 'Rabi', 'Summer', 'Annual') NOT NULL DEFAULT 'Kharif',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_crops_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Government Schemes Table
CREATE TABLE IF NOT EXISTS `government_schemes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `scheme_code` VARCHAR(50) UNIQUE NOT NULL,
    `name_en` VARCHAR(200) NOT NULL,
    `name_kn` VARCHAR(200) NOT NULL,
    `department_en` VARCHAR(200) NOT NULL,
    `department_kn` VARCHAR(200) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `level` ENUM('Karnataka_State', 'Central_Government') NOT NULL DEFAULT 'Karnataka_State',
    `benefit_type` ENUM('Direct_Benefit_Transfer', 'Subsidy_Capital', 'Credit_Interest_Subvention', 'Insurance', 'Input_Subsidy') NOT NULL,
    `benefit_amount_desc_en` TEXT NOT NULL,
    `benefit_amount_desc_kn` TEXT NOT NULL,
    `summary_en` TEXT NOT NULL,
    `summary_kn` TEXT NOT NULL,
    `application_portal` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_scheme_category` (`category`),
    INDEX `idx_scheme_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Scheme Deterministic Eligibility Rules Table
CREATE TABLE IF NOT EXISTS `scheme_eligibility_rules` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `scheme_id` INT NOT NULL,
    `rule_code` VARCHAR(60) NOT NULL,
    `parameter_name` VARCHAR(60) NOT NULL,
    `operator` ENUM('=', '!=', '<', '<=', '>', '>=', 'IN', 'CONTAINS') NOT NULL,
    `target_value` VARCHAR(255) NOT NULL,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT TRUE,
    `explanation_kn` TEXT NOT NULL,
    `explanation_en` TEXT NOT NULL,
    CONSTRAINT `fk_rules_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `government_schemes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Scheme Required Documents Table
CREATE TABLE IF NOT EXISTS `scheme_documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `scheme_id` INT NOT NULL,
    `document_name_en` VARCHAR(150) NOT NULL,
    `document_name_kn` VARCHAR(150) NOT NULL,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT TRUE,
    `issuing_authority_kn` VARCHAR(150) NULL,
    CONSTRAINT `fk_docs_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `government_schemes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Voice Conversations Table
CREATE TABLE IF NOT EXISTS `voice_conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) UNIQUE NOT NULL,
    `farmer_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_convo_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Voice Conversation Messages Table
CREATE TABLE IF NOT EXISTS `voice_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL,
    `sender` ENUM('user', 'assistant') NOT NULL,
    `transcript_kn` TEXT NOT NULL,
    `transcript_en` TEXT NULL,
    `intent_detected` VARCHAR(80) NULL,
    `parameters_extracted_json` JSON NULL,
    `audio_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `voice_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Eligibility Evaluation Audit Table
CREATE TABLE IF NOT EXISTS `eligibility_evaluations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `farmer_id` INT NOT NULL,
    `scheme_id` INT NOT NULL,
    `status` ENUM('ELIGIBLE', 'PARTIALLY_ELIGIBLE', 'INELIGIBLE') NOT NULL,
    `match_score` INT NOT NULL DEFAULT 0,
    `reasons_json` JSON NOT NULL,
    `missing_criteria_json` JSON NULL,
    `evaluated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_eval_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_eval_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `government_schemes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
