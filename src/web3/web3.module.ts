import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RepositoryModule } from '../repository/repository.module';
import { Web3Service } from './web3.service';
import { Web3Controller } from './web3.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { QueryHandlers } from './queries/handlers';
import { SqsModule, SqsQueueType } from '@nestjs-packages/sqs';
import { SqsProducerHandler } from './sqs/producer.handler';
import { SqsConsumerHandler } from './sqs/consumer.handler';

/**
 * A module for managing web3 operations and processing jobs.
 */
@Module({
  controllers: [Web3Controller],
  providers: [Web3Service, SqsProducerHandler, SqsConsumerHandler, ...CommandHandlers, ...QueryHandlers, ...EventHandlers],
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
    CqrsModule,
    ConfigModule,
    RepositoryModule,
  ],
  exports: [Web3Service],
})
export class Web3Module {}
