import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_mrintcorp",
    port: 3306
});

export default pool;