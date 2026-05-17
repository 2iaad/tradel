# Env variables

**process.env:** is available everywhere the moment dotenv loads your .env file, which happens when ConfigModule.forRoot() runs in AppModule.

**isGlobal: true** controls whether you need to import ConfigModule in each module to inject ConfigService.
Without it you'd need this in AuthModule to use ConfigService `imports: [ConfigModule]`.

With `isGlobal: true`  just inject ConfigService directly, no import needed
```ts
constructor(private config: ConfigService) {}
```