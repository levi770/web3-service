import { SqsModule, SqsQueueType } from '@nestjs-packages/sqs';
import { Module } from '@nestjs/common';
import { Web3Module } from '../web3/web3.module';
import { SqsConsumerHandler } from './consumer.handler';

@Module({
  imports: [
    SqsModule.registerQueue(
      {
        name: process.env.SQS_CONSUMER_NAME,
        type: SqsQueueType.Consumer,
        consumerOptions: { shouldDeleteMessages: true, messageAttributeNames: ['All'] },
        producerOptions: {},
      },
      {
        name: process.env.SQS_PRODUCER_NAME,
        type: SqsQueueType.Producer,
        consumerOptions: {},
        producerOptions: {},
      },
    ),
    Web3Module,
  ],
  providers: [SqsConsumerHandler],
})
export class SqsHandlerModule {}
