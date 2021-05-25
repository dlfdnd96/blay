/**
 * @author slow_bear
 * @version 1.0
 * @fileoverview Connect mysql
 * @requires serverless-mysql
 */
const mysql = require('serverless-mysql')();

mysql.config({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  dateStrings: 'datetime',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = mysql;
