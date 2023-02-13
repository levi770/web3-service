import { SqsMessageHandler, SqsProcess, SqsService } from '@nestjs-packages/sqs';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events, Statuses } from '../../common/constants';
import { JobCreatedEvent } from './events/job-created.event';
import { ProcessingErrorEvent } from './events/processing-error.event';
dotenv.config();

@SqsProcess(process.env.SQS_PRODUCER_NAME)
export class SqsProducerHandler {
  private logger: Logger;
  constructor(private sqsService: SqsService) {
    this.logger = new Logger('SqsProducer');
  }

  @SqsMessageHandler(false)
  async handleMessage() {
    return;
  }

  @OnEvent(Events.JOB_CREATED)
  handleJobCreatedEvent(event: JobCreatedEvent) {
    event.job.subscribe(async (result) => {
      if (result.status === Statuses.COMPLETED || result.status === Statuses.FAILED) {
        await this.sqsService.send(process.env.SQS_PRODUCER_NAME, {
          id: uuidv4(),
          body: JSON.stringify({
            requestId: event.msg?.requestId,
            command: event.msg?.command,
            operationName: event.msg?.operationName,
            walletAddress: event.msg?.walletAddress,
            data: result,
          }),
        });
      }
    });
  }

  @OnEvent(Events.PROCESSING_ERROR)
  handleProcessingErrorEvent(event: ProcessingErrorEvent) {
    this.sqsService.send(process.env.SQS_PRODUCER_NAME, {
      id: uuidv4(),
      body: JSON.stringify({
        error: event.err,
        message: event.msg,
      }),
    });
  }
}
