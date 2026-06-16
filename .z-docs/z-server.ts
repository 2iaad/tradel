// HOW TO TALK TO POSTGRES WITHOUT AN ORM
//
// -> Install pg driver and types | npm install pg @types/pg
//
// Step 1 — Create a Client and connect to the database
// Step 2 — Run a CREATE TABLE query (DDL)
// Step 3 — Run INSERT queries to create rows (DML)
// Step 4 — Disconnect

import { Client } from 'pg';

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'admin',
    database: 'auth',
});

async function main() {
    // Step 1 — connect
    await client.connect();
    console.log('Connected to database');

    // Step 2 — create table
    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id    SERIAL PRIMARY KEY,
            name  TEXT    NOT NULL,
            email TEXT    NOT NULL UNIQUE
        )
    `);
    console.log('Table "users" ready');

    // Step 3 — insert 2 rows
    await client.query(
        `INSERT INTO users (name, email) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        ['Ziyad', 'ziyad2@example.com'],
    );
    await client.query(
        `INSERT INTO users (name, email) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        ['Adam', 'adam2@example.com'],
    );
    console.log('Inserted 2 users');

    // verify
    const result = await client.query(`SELECT * FROM users`);
    console.table(result.rows);

    // update rename Ziyad and Email Updated
    // const updateResult = await client.query(
    //     `UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *`,
    //     ['Ziyad Updated 2', 'ziyadUpdated@example.com', 2],
    // );
    // console.log('Updated:', updateResult.rows[0]);

    // delete — remove Adam
    // const deleteResult = await client.query(
    //     `DELETE FROM users WHERE email = $1 RETURNING *`,
    //     ['adam2@example.com'],
    // );
    // console.log('Deleted:', deleteResult.rows[0]);

    // console.log('-'.repeat(10));
    // console.table(result.fields);

    // Step 4 — disconnect
    await client.end();
    console.log('Disconnected');
}

main().catch((err) => {
    console.error(err);
    void client.end();
});
