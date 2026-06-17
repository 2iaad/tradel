import { z } from 'zod';

const envSchema = z.object({
    // app
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(3000), // coerce -> convert from string to number

    // db
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(5432), // coerce -> convert from string to number
    DB_HOST: z.string().min(1),
    DB_DATA: z.string().min(1),
    // jwt
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
