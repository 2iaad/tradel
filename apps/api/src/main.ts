import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.validation';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // logger: false,
    });
    const logger = new Logger(AppModule.name);
    const config = app.get<ConfigService<Env>>(ConfigService);

    app.setGlobalPrefix('api'); // global convention for backend
    app.use(cookieParser()); // set the req.cookies
    app.useGlobalPipes(new ValidationPipe({ transform: true })); // validate + run @Transform on dto
    app.enableCors({
        origin: config.get('allowedOrigins', { infer: true }),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true, // necessary for the browser to send/receive cookies
    });

    // documentation with swaager -----------------
    const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('Tradel API')
            .setDescription('Trading journal | users, accounts, trades, notes, analytics')
            .setVersion('1.0')
            .addBearerAuth() // add Authorize button for jwt access token
            .addTag('api')
            .build(),
    );
    SwaggerModule.setup('api/', app, document);
    logger.log('Swagger docs: http://localhost:3000/api');

    // ---------------------------------------------
    const port = config.getOrThrow('port', { infer: true });
    await app.listen(port);
    logger.log('Server running on port: ' + port);
}
bootstrap();
