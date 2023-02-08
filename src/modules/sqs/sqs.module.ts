import { SqsModule, SqsQueueType } from '@nestjs-packages/sqs';
import { Module } from '@nestjs/common';
import { Web3Module } from '../web3/web3.module';
import { SqsConsumerHandler } from './consumer.handler';
import { SqsProducerHandler } from './producer.handler';

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
        consumerOptions: { shouldDeleteMessages: false, messageAttributeNames: ['All'] },
        producerOptions: {},
      },
    ),
    Web3Module,
  ],
  providers: [SqsConsumerHandler, SqsProducerHandler],
})
export class SqsHandlerModule {}
