const mssql = require('mssql');

let pool;
module.exports = async () => {
  if (pool) {
    return pool;
  }

  const config = {
    pool: {},
    options: {},
  };
  config.user = process.env.DB_USERNAME; // e.g. 'my-db-user'
  config.password = process.env.DB_PASSWORD; // e.g. 'my-db-password'
  config.database = process.env.DB_NAME; // e.g. 'my-database'
  config.server = process.env.DB_ADDR;

  config.port = parseInt(process.env.DB_PORT);

  // [START_EXCLUDE]

  // [START cloud_sql_server_mssql_timeout]
  // 'connectionTimeout` is the maximum number of milliseconds to wait trying to establish an
  // initial connection. After the specified amount of time, an exception will be thrown.
  config.connectionTimeout = 7500;
  // 'acquireTimeoutMillis' is the number of milliseconds before a timeout occurs when acquiring a
  // connection from the pool.
  // config.pool.acquireTimeoutMillis = 30000;
  // 'idleTimeoutMillis' is the number of milliseconds a connection must sit idle in the pool
  // and not be checked out before it is automatically closed
  // config.pool.idleTimeoutMillis = 600000,
  // [END cloud_sql_server_mssql_timeout]

  // [START cloud_sql_server_mssql_limit]
  // 'max' limits the total number of concurrent connections this pool will keep. Ideal
  // values for this setting are highly variable on app design, infrastructure, and database.
  config.pool.max = 5;
  // 'min' is the minimum number of idle connections maintained in the pool.
  // Additional connections will be established to meet this value unless the pool is full.
  config.pool.min = 1;
  // [END cloud_sql_server_mssql_limit]

  // [START cloud_sql_server_mssql_backoff]
  // The node-mssql module uses a built-in retry strategy which does not implement backoff.
  // 'createRetryIntervalMillis' is the number of milliseconds to wait in between retries.
  config.pool.createRetryIntervalMillis = 200;
  // [END cloud_sql_server_mssql_backoff]

  config.options.enableArithAbort = true;

  // [END_EXCLUDE]
  pool = await mssql.connect(config);
  return pool;
};
