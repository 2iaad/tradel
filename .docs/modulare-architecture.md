# Modular Architecture

NestJS module graph as it exists in `src/`. Each box is a module; nodes inside
are its controllers/providers. Solid arrows = module imports, dashed arrows =
constructor injection (dependency).

Solid arrows (`==>`) are the import tree, branching down from `AppModule`.
Dashed arrows (`-.->`) are constructor injections.

```mermaid
flowchart TB
    AppModule["AppModule (root)<br/>bootstrapped by main.ts"]

    subgraph ConfigModule["ConfigModule @Global"]
        ConfigService["ConfigService"]
        validate["env.validation.ts<br/>zod validate()"]
        ConfigService -. validates env via .-> validate
    end

    subgraph DatabaseModule["DatabaseModule @Global"]
        DatabaseService["DatabaseService<br/>(pg Pool, OnModuleInit/Destroy)"]
    end

    subgraph AuthModule["AuthModule"]
        JwtModule["JwtModule.registerAsync"]
        AuthController["AuthController<br/>POST /auth/register • /auth/login"]
        AuthService["AuthService<br/>bcrypt hash/compare"]
        UsersRepository["UsersRepository<br/>(src/users, provided here)"]
    end

    %% import tree (AppModule at the top)
    AppModule ==> ConfigModule
    AppModule ==> DatabaseModule
    AppModule ==> AuthModule
    AuthModule ==> JwtModule

    %% injections
    AuthController -. injects .-> AuthService
    AuthService -. injects .-> UsersRepository
    AuthService -. injects .-> JwtModule
    AuthService -. injects .-> ConfigService
    UsersRepository -. injects .-> DatabaseService
    DatabaseService -. injects .-> ConfigService
    JwtModule -. useFactory inject .-> ConfigService
```

**Notes**
- `ConfigModule` and `DatabaseModule` are `@Global`, so their exports
  (`ConfigService`, `DatabaseService`) are injectable anywhere without re-importing.
- There is no `UsersModule`; `UsersRepository` lives in `src/users/` but is
  registered as a provider inside `AuthModule`.
