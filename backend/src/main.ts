import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // logger: false,
    });
    const logger = new Logger(AppModule.name);

    app.setGlobalPrefix('api'); // global convention for backend
    app.use(cookieParser()); // set the req.cookies
    app.useGlobalPipes(new ValidationPipe({ transform: true })); // validate + run @Transform on dto
    app.enableCors({
        origin: 'http://localhost:5173',
        credentials: true, // necessary for the browser to send/receive cookies
    });

    // documentation with swaager -----------------
    const config = new DocumentBuilder()
        .setTitle('Tradel API')
        .setDescription('Trading journal | auth, accounts, trades')
        .setVersion('1.0')
        .addBearerAuth() // add Authorize button for jwt access token
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    // ---------------------------------------------

    await app.listen(process.env.PORT ?? 3000);
    logger.log('Server running on port: ' + 3000);
    logger.log('Swagger docs: http://localhost:3000/api/docs');
}
bootstrap();
