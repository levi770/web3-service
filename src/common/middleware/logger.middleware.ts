import { Injectable, NestMiddleware, Logger, ExecutionContext } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async use(context: ExecutionContext, next: () => Promise<void>) {
    //const { pattern } = context;
    this.logger.log(`Incoming request: ${context}`);
    await next();
    this.logger.log(`Outgoing response: ${context}`);
  }
}
