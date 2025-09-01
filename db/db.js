const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "12345",
    port: process.env.PG_PORT || 5432,
});

pool.connect().then((client) => {
    console.log("PostgreSQL connected successfully");
    client.release();
})
.catch((err) => {
    console.error("PostgreSQL connection failed:", err.message);
    process.exit(1);
});

module.exports = pool;  
