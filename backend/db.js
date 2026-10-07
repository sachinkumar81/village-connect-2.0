const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "villageconnect",
  password: "S@ch1234",
  port: 5432,
});

module.exports = pool;