#!/usr/bin/env node

import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { spawnSync } from 'node:child_process';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = process.env.DBML_ENV_FILE
    ? resolve(process.cwd(), process.env.DBML_ENV_FILE)
    : resolve(backendDirectory, '.env');

if (existsSync(envFile)) {
    loadEnvFile(envFile);
}

const connectionString = getConnectionString();
const databaseUrl = new URL(connectionString);

if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    fail('DB_URL must be a PostgreSQL connection string.');
}

// Avoid including extension/system schemas in the generated diagram.
if (!databaseUrl.searchParams.has('schemas')) {
    databaseUrl.searchParams.set('schemas', process.env.DBML_SCHEMAS ?? 'public');
}

const outputFile = resolve(
    process.cwd(),
    process.argv[2] ?? resolve(backendDirectory, 'database.dbml'),
);
const temporaryOutputFile = resolve(
    dirname(outputFile),
    `.${basename(outputFile)}.${process.pid}.tmp`,
);
const cliFile = resolve(backendDirectory, 'node_modules/@dbml/cli/bin/db2dbml.js');

if (!existsSync(cliFile)) {
    fail('DBML CLI is not installed. Run `npm install` in the backend directory.');
}

console.log(`Generating DBML at ${outputFile}...`);

mkdirSync(dirname(outputFile), { recursive: true });
rmSync(temporaryOutputFile, { force: true });

const result = spawnSync(
    process.execPath,
    [cliFile, 'postgres', databaseUrl.toString(), '--out-file', temporaryOutputFile],
    { encoding: 'utf8' },
);

process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

if (result.error) {
    rmSync(temporaryOutputFile, { force: true });
    fail(`Could not start db2dbml: ${result.error.message}`);
}

const cliOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
if (result.status !== 0 || /(^|\n)\s*ERROR:/i.test(cliOutput) || !existsSync(temporaryOutputFile)) {
    rmSync(temporaryOutputFile, { force: true });
    fail('db2dbml did not produce a schema. Check the database connection above.');
}

renameSync(temporaryOutputFile, outputFile);
console.log('DBML schema generated successfully.');

function getConnectionString() {
    if (process.env.DB_URL) return process.env.DB_URL;
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const requiredKeys = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME'];
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
        fail(`Missing database configuration: set DB_URL or ${missingKeys.join(', ')}.`);
    }

    const url = new URL('postgresql://localhost');
    url.username = process.env.DB_USER;
    url.password = process.env.DB_PASSWORD;
    url.hostname = process.env.DB_HOST;
    url.port = process.env.DB_PORT ?? '5432';
    url.pathname = process.env.DB_NAME;

    return url.toString();
}

function fail(message) {
    console.error(`DBML generation failed: ${message}`);
    process.exit(1);
}
