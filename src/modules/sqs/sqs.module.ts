import { SqsModule, SqsQueueType } from '@nestjs-packages/sqs';
import { Module } from '@nestjs/common';
import { Web3Module } from '../web3/web3.module';
import { SqsConsumerHandler } from './consumer.handler';
import { SQS_CONSUMER_NAME, SQS_PRODUCER_NAME } from '../../common/constants';

@Module({
  imports: [
    SqsModule.registerQueue(
      {
        name: SQS_CONSUMER_NAME,
        type: SqsQueueType.Consumer,
        consumerOptions: { shouldDeleteMessages: true, messageAttributeNames: ['All'] },
        producerOptions: {},
      },
      {
        name: SQS_PRODUCER_NAME,
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
