import {
  SqsConsumerEvent,
  SqsConsumerEventHandler,
  SqsMessageHandler,
  SqsProcess,
  SqsService,
} from '@nestjs-packages/sqs';
import { CMD, ProcessTypes, SQS_CONSUMER_NAME, SQS_PRODUCER_NAME } from '../../common/constants';
import { Logger, HttpStatus } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { JobResult } from '../../common/dto/jobResult.dto';
import { Response } from '../../common/dto/response.dto';
import { Web3Service } from '../web3/web3.service';
import { SQS } from 'aws-sdk';

@SqsProcess(SQS_CONSUMER_NAME)
export class SqsConsumerHandler {
  private logger: Logger;

  constructor(private w3s: Web3Service, private sqsService: SqsService) {
    this.logger = new Logger('SqsHandler');
  }

  @SqsMessageHandler(false)
  async handleMessage(message: AWS.SQS.Message) {
    this.logger.log(`Processing SQS message: ${JSON.stringify(message)}`);
    let result: JobResult | Response;
    const { pattern, data } = JSON.parse(message.Body);
    switch (pattern.cmd) {
      case CMD.DEPLOY:
        result = await lastValueFrom(await this.w3s.process(data, ProcessTypes.DEPLOY));
        break;
      case CMD.MINT:
        result = await lastValueFrom(await this.w3s.process(data, ProcessTypes.MINT));
        break;
      case CMD.WHITELIST:
        result = await lastValueFrom(await this.w3s.process(data, ProcessTypes.WHITELIST));
        break;
      case CMD.COMMON:
        result = await lastValueFrom(await this.w3s.process(data, ProcessTypes.COMMON));
        break;
      default:
        result = new Response(HttpStatus.BAD_REQUEST, 'Invalid pattern', null);
        break;
    }
    await this.sqsService.send<JobResult | Response>(SQS_PRODUCER_NAME, {
      id: message.MessageId,
      body: result,
      groupId: 'groupId',
      deduplicationId: message.MessageId,
      delaySeconds: 0,
    });
    return;
  }

  // @SqsConsumerEventHandler(SqsConsumerEvent.PROCESSING_ERROR)
  // public onProcessingError(error: Error, message: SQS.Message) {}
}
