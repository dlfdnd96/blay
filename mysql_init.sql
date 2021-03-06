/*
* File Description: Initialize blay database setting
* Author: slow_bear
*/

-- Create DEV_BlayDB database
CREATE DATABASE IF NOT EXISTS `DEV_BlayDB` DEFAULT CHARACTER SET=utf8;

-- Create Accounts table
CREATE TABLE IF NOT EXISTS `DEV_BlayDB`.`Accounts`(
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(40) NOT NULL UNIQUE,
  `password` VARCHAR(100) NOT NULL,
  `verified` CHAR(1) NOT NULL DEFAULT 'N',
  `nickname` VARCHAR(50) NULL DEFAULT NULL,
  `simple_introduce` VARCHAR(200) NULL DEFAULT NULL,
  `position` TINYINT(2) UNSIGNED NOT NULL DEFAULT 0,
  `avatar_id` VARCHAR(10) NULL DEFAULT NULL,
  `created_date` DATETIME NOT NULL,
  `deleted_date` DATETIME NOT NULL,
  `news_email_yn` CHAR(1) NOT NULL,
  `plan_level` TINYINT DEFAULT '0',
  PRIMARY KEY (id)
);

-- Create ResetPasswordAccounts table
CREATE TABLE IF NOT EXISTS `DEV_BlayDB`.`ResetPasswordAccounts`(
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(40) NOT NULL,
  `created_date` DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX `idx_ResetPasswordAccounts_email` (`email`)
);
