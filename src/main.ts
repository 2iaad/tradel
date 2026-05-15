import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // returns an application object
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
