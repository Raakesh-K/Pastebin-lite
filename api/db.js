const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL DB");
});

pool.on("error", (err) => {
  console.error("DB ERROR:", err);
});

module.exports = pool;
