import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // global convention
  app.useGlobalPipes(new ValidationPipe()); // enable validation, bridge between the raw request and your DTO | Without it, NestJS ignores your DTO decorators completely.
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
