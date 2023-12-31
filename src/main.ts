import { join } from 'path';
import session from 'express-session';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';

/**
 * Bootstraps the application by creating an instance of NestExpressApplication and starting the server.
 * It also connects the application to a Redis microservice using the BullModule.
 */
async function bootstrap() {
  const logger: Logger = new Logger('App');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(compression());
  app.use(cookieParser());
  app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

  app.enableCors({
    origin: true,
    allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
    methods: 'GET',
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('handlebars', engine());
  app.setViewEngine('handlebars');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    },
  });
  await app.startAllMicroservices();

  app.disable('x-powered-by');

  await app.listen(process.env.PORT || 5000, async () => logger.log(`Server started on port ${await app.getUrl()}`));
}
bootstrap();
