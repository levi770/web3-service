import { SqsMessageHandler, SqsProcess } from '@nestjs-packages/sqs';

import * as dotenv from 'dotenv';
dotenv.config();

@SqsProcess(process.env.SQS_PRODUCER_NAME)
export class SqsProducerHandler {
  @SqsMessageHandler(false)
  async handleMessage() {
    return;
  }
}
