/*
* File Nmae: mysql_init.sql
* File Description: Initialize blay database setting
* Author: slow_bear
* Date: 2020.12.22
* Version: 1.0
* Updates
  (1) 2020.12.22: Create file, slow_bear
  (2) 2021.01.03: Add CheckExistEmailAndName procedure, slow_bear
*/

-- Create DEV_BlayDB database
CREATE DATABASE IF NOT EXISTS `DEV_BlayDB` DEFAULT CHARACTER SET=utf8;

-- Create Accounts table
CREATE TABLE IF NOT EXISTS `DEV_BlayDB`.`Accounts`(
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(15) NOT NULL,
  `email` VARCHAR(40) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `created_date` DATETIME NOT NULL,
  `verified` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `verification_url` VARCHAR(100) NOT NULL,
  `plan_level` TINYINT DEFAULT '0',
  `deleted_date` DATETIME NOT NULL,
  PRIMARY KEY (id)
);

-- Create CheckExistEmailAndName procedure
DROP PROCEDURE IF EXISTS `DEV_BlayDB`.`CheckExistEmailAndName`;

DELIMITER $$
CREATE PROCEDURE `DEV_BlayDB`.`CheckExistEmailAndName`(
  IN pUserEmail VARCHAR(40),
  IN pUserName VARCHAR(15))
BEGIN
  DECLARE errorExistEmail VARCHAR(40);
  DECLARE errorExistName VARCHAR(40);

  SET errorExistEmail = 'Already exist email';
  SET errorExistName = 'Already exist name';

  SET @existEmail = NULL;
  SET @existName = NULL;

  IF (SELECT 1 = 1 FROM Accounts WHERE `email` = pUserEmail) THEN
  BEGIN
    SET @existEmail = errorExistEmail;
  END;
  END IF;

  IF (SELECT 1 = 1 FROM Accounts WHERE `name` = pUserName) THEN
  BEGIN
    SET @existName = errorExistName;
  END;
  END IF;
END $$

DELIMITER ;