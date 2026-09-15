import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.validation';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger({
            prefix: 'Tradel',
        }),
    });
    const logger = new Logger(AppModule.name);
    const config = app.get<ConfigService<Env>>(ConfigService);
    const port = config.get('port', { infer: true });
    const allowedOrigins = config.get('allowedOrigins', { infer: true });

    app.setGlobalPrefix('api'); // global convention for backend

    app.use(cookieParser()); // set the req.cookies
    app.use(helmet()); // security middleware

    // validate user input
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // drop extra properties that are not included in dto but {the request still succeeds}
            transform: true, // run @Transform on dto
            forbidNonWhitelisted: true, // {reject request} if extra properties added that are not included in dto
        }),
    );

    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true, // necessary for the browser to send/receive cookies
        exposedHeaders: ['Retry-After'], // make js access this header
    });

    // documentation with swaager -----------------
    const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('Tradel API')
            .setDescription('Trading journal | users, accounts, trades, notes, analytics')
            .setVersion('1.0')
            .addCookieAuth(
                'access_token',
                {
                    type: 'apiKey',
                    in: 'cookie',
                    description: 'Short-lived JWT access cookie',
                },
                'access_token',
            )
            .addCookieAuth(
                'refresh_token',
                {
                    type: 'apiKey',
                    in: 'cookie',
                    description: 'Long-lived token used only by refresh and logout',
                },
                'refresh_token',
            )
            .build(),
    );
    SwaggerModule.setup('api/', app, document);
    logger.log(`Swagger docs: /api`);

    // ---------------------------------------------
    await app.listen(port!);
    logger.log('Server running on port ' + port);
}
void bootstrap();
