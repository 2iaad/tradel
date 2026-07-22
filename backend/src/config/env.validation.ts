import { z } from 'zod';

const envSchema = z.object({
    // app
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000), // coerce -> convert from string to number

    // db in prod uses DB_URL only so we add .optional
    DB_NAME: z.string().min(1).optional(),
    DB_USER: z.string().min(1).optional(),
    DB_PASSWORD: z.string().min(1).optional(),
    DB_PORT: z.coerce.number().int().positive().default(5432), // coerce -> convert from string to number
    DB_HOST: z.string().min(1).optional(),
    DB_DATA: z.string().min(1).optional(),
    DB_URL: z.url(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('900s'),
    JWT_REFRESH_TTL: z.string().default('7d'),
});

export type Env = z.infer<typeof envSchema>;

/**
 *
 * @param config object where keys->strings and values->unknown (process.env)
 * @returns env variables as an object
 */
export function validate(config: { [key: string]: unknown }): Env {
    // Heroku Postgres injects DATABASE_URL; the rest of the app expects DB_URL.
    if (!config.DB_URL && config.DATABASE_URL) config.DB_URL = config.DATABASE_URL;
    const result = envSchema.safeParse(config);

    if (!result.success) {
        const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
        const messages = result.error.issues
            .map((i) => red(`  ✖ ${i.path.join('.')}: ${i.message}`))
            .join('\n');

        console.error(`Env validation failed:\n${messages}`);
        process.exit(1);
        // throw new Error(`Env validation failed:\n${messages}`);
    }

    return result.data;
}
