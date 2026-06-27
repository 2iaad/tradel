import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // logger: false,
    });
    const logger = new Logger(AppModule.name);

    app.setGlobalPrefix('api'); // global convention for backend
    app.use(cookieParser()); // what makes req.cookies
    app.useGlobalPipes(new ValidationPipe()); // enable validation, bridge between the raw request and your DTO | Without it, NestJS ignores your DTO decorators completely.
    app.enableCors({
        origin: 'http://localhost:5173',
        credentials: true, // necessary for the browser to send/receive cookies
    });

    await app.listen(process.env.PORT ?? 3000);
    logger.log('Server running on port: ' + 3000);
}
bootstrap();
