import {
  SqsService,
  SqsMessageHandler,
  SqsModule,
  SqsConfigOption,
  SqsConfig,
  SqsQueueType,
  SqsProcess,
} from '@nestjs-packages/sqs';
import { Injectable, Module } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SQS_CONSUMER_NAME, SQS_PRODUCER_NAME } from '../src/common/constants';

@Injectable()
export class SqsClientService {
  constructor(private sqsService: SqsService) {}
  async send(pattern: any, data: any): Promise<any> {
    const body = JSON.stringify({ pattern, data });
    const id = uuidv4();
    return await this.sqsService.send(SQS_CONSUMER_NAME, {
      id,
      body: body,
      groupId: 'groupId',
      deduplicationId: id,
      delaySeconds: 0,
    });
  }
  async receive<T = any>(data: T): Promise<T> {
    return Promise.resolve(data);
  }
}

@SqsProcess(SQS_PRODUCER_NAME)
export class SqsHandler {
  constructor(private readonly sqsService: SqsClientService) {}
  @SqsMessageHandler(false)
  async handleMessage(message: AWS.SQS.Message) {
    return await this.sqsService.receive(message);
  }
}

@Module({
  imports: [
    SqsModule.forRootAsync({
      useFactory: () => {
        const config: SqsConfigOption = {
          region: process.env.AWS_REGION,
          endpoint: process.env.SQS_ENDPOINT,
          accountNumber: process.env.AWS_ACCOUNT,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
          },
        };
        return new SqsConfig(config);
      },
    }),
    SqsModule.registerQueue(
      {
        name: process.env.SQS_CONSUMER_NAME,
        type: SqsQueueType.Producer, // 'ALL'|'CONSUMER'|'PRODUCER'
        consumerOptions: {},
        producerOptions: {},
      },
      {
        name: process.env.SQS_PRODUCER_NAME,
        type: SqsQueueType.Consumer, // 'ALL'|'CONSUMER'|'PRODUCER'
        consumerOptions: { shouldDeleteMessages: true, messageAttributeNames: ['All'] },
        producerOptions: {},
      },
    ),
  ],
  providers: [SqsClientService, SqsHandler],
})
export class SqsClientModule {}
