import compression from 'compression';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(compression());
  app.use(cookieParser());

  app.disable('x-powered-by');
  app.enableCors({
    origin: true,
    allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
    methods: 'GET',
    credentials: true,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 5000, '127.0.0.1', async () =>
    console.log(`Server started on port ${await app.getUrl()}`),
  );
}
bootstrap();
