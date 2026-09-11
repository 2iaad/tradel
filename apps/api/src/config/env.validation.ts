import { z } from 'zod';

const envSchema = z.object({
    // app
    nodeEnv: z.enum(['development', 'production', 'test']), // .default('development'),
    port: z.coerce.number().int().positive(), // .default(3000), // coerce -> convert from string to number
    allowedOrigins: z.url(), // .default('http://localhost:5173'),

    // db in prod uses DB_URL only so we add .optional
    dbName: z.string().min(1), //.optional(),
    dbUser: z.string().min(1), //.optional(),
    dbPassword: z.string().min(1), //.optional(),
    dbPort: z.coerce.number().int().positive(), // .default(5432), // coerce -> convert from string to number
    dbHost: z.string().min(1), //.optional(),
    dbData: z.string().min(1), //.optional(),
    dbUrl: z.url(),

    jwtAccessSecret: z.string().min(32),
    jwtRefreshSecret: z.string().min(32),
    jwtAccessTtl: z.string(), // .default('900s'),
    jwtRefreshTtl: z.string(), // .default('7d'),
});

export type Env = z.infer<typeof envSchema>;

/**
 *
 * @param config object where keys->strings and values->unknown (process.env)
 * @returns env variables as an object
 */
export function validate(config: { [key: string]: unknown }): Env {
    const result = envSchema.safeParse({
        nodeEnv: config.NODE_ENV,
        port: config.PORT,
        allowedOrigins: config.ALLOWED_ORIGINS,
        dbName: config.DB_NAME,
        dbUser: config.DB_USER,
        dbPassword: config.DB_PASSWORD,
        dbPort: config.DB_PORT,
        dbHost: config.DB_HOST,
        dbData: config.DB_DATA,
        dbUrl: config.DB_URL, // Heroku Postgres uses DATABASE_URL
        jwtAccessSecret: config.JWT_ACCESS_SECRET,
        jwtRefreshSecret: config.JWT_REFRESH_SECRET,
        jwtAccessTtl: config.JWT_ACCESS_TTL,
        jwtRefreshTtl: config.JWT_REFRESH_TTL,
    });

    if (!result.success) {
        const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
        const messages = result.error.issues
            .map((i) => red(`  ✖ ${i.path.join('.')}: ${i.message}`))
            .join('\n');

        console.error(`Env validation failed:\n${messages}`);
        process.exit(1);
    }

    return result.data;
}
