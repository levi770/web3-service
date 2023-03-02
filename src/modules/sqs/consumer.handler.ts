import {
  SqsConsumerEvent,
  SqsConsumerEventHandler,
  SqsMessageHandler,
  SqsProcess,
  SqsService,
} from '@nestjs-packages/sqs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { CMD, Events, ProcessTypes as pt } from '../../common/constants';
import { Logger } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import { JobResult } from '../../common/dto/jobResult.dto';
import { Web3Service } from '../web3/web3.service';
import { SQS } from 'aws-sdk';
import * as dotenv from 'dotenv';
import { JobCreatedEvent } from './events/job-created.event';
import { ProcessingErrorEvent } from './events/processing-error.event';

dotenv.config();

@SqsProcess(process.env.SQS_CONSUMER_NAME)
export class SqsConsumerHandler {
  private logger: Logger;
  constructor(private w3s: Web3Service, private eventEmitter: EventEmitter2, private sqsService: SqsService) {
    this.logger = new Logger('SqsConsumer');
  }

  @SqsMessageHandler(false)
  async handleMessage(message: SQS.Message) {
    const msg = JSON.parse(message.Body);
    this.logger.log(
      `Processing requestId: ${msg?.requestId} of wallet: ${msg?.walletAddress}, operationType: ${msg?.operationName}, command: ${msg?.command}`,
    );
    let job: Observable<JobResult>;
    switch (msg?.command) {
      case CMD.DEPLOY:
        job = await this.w3s.process(msg.data, pt.DEPLOY);
        break;
      case CMD.MINT:
        job = await this.w3s.process(msg.data, pt.MINT);
        break;
      case CMD.WHITELIST:
        job = await this.w3s.process(msg.data, pt.WHITELIST);
        break;
      case CMD.COMMON:
        job = await this.w3s.process(msg.data, pt.COMMON);
        break;
      default:
        throw new Error(`Command ${msg?.command} not supported`);
    }

    // This is temporary code that assures that we can only
    // Process one message at the same time
    // The problem is that as soon as this method ends the message
    // is deleted from SQS and it allows multiple processes to happen
    // A lot of transactions fail because of it.
    // lastValueFrom waits for the job to finish to actually return the SQS message
    // with the response.

    const result = await lastValueFrom(job);

    const logMessage = result.status === 'failed' ? JSON.stringify(result.data) : '';

    this.logger.log(`finished: ${result.status}, ${logMessage}`);

    await this.sqsService.send(process.env.SQS_PRODUCER_NAME, {
      id: uuidv4(),
      body: JSON.stringify({
        requestId: msg?.requestId,
        command: msg?.command,
        operationName: msg?.operationName,
        walletAddress: msg?.walletAddress,
        data: result,
      }),
    });

    // this.eventEmitter.emit(Events.JOB_CREATED, new JobCreatedEvent(job, msg));
    return;
  }

  @SqsConsumerEventHandler(SqsConsumerEvent.PROCESSING_ERROR)
  public onProcessingError(error: Error, message: SQS.Message) {
    this.logger.error(`Error processing message: ${message.MessageId} - ${error.message}`);
    this.eventEmitter.emit(Events.PROCESSING_ERROR, new ProcessingErrorEvent(error, message));
    return;
  }
}
