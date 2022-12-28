import compression from 'compression'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { Logger } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NestExpressApplication } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'

/**
* Bootstraps the application by creating an instance of NestExpressApplication and starting the server.
* It also connects the application to a Redis microservice using the BullModule.
*/
async function bootstrap() {
  // A root logger.
  const logger: Logger = new Logger('App');
  // instantiate the application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Enable compression and cookie parsing middleware
  app.use(compression());
  app.use(cookieParser());
  // Disable the "x-powered-by" header and enable CORS
  app.disable('x-powered-by');
  app.enableCors({
    origin: true,
    allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
    methods: 'GET',
    credentials: true,
  });
  // Connect the application to the Redis microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    },
  });
  // Start all microservices and the server
  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 5000, '127.0.0.1', async () =>
    logger.log(`Server started on port ${await app.getUrl()}`),
  );
}
bootstrap();
