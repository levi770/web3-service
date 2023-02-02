import {
  SqsConsumerEvent,
  SqsConsumerEventHandler,
  SqsMessageHandler,
  SqsProcess,
  SqsService,
} from '@nestjs-packages/sqs';
import { CMD, ProcessTypes as pt } from '../../common/constants';
import { Logger, HttpStatus } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { JobResult } from '../../common/dto/jobResult.dto';
import { Response } from '../../common/dto/response.dto';
import { Web3Service } from '../web3/web3.service';
import { SQS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();

const SQS_CONSUMER_NAME = process.env.SQS_CONSUMER_NAME;
const SQS_PRODUCER_NAME = process.env.SQS_PRODUCER_NAME;

@SqsProcess(SQS_CONSUMER_NAME)
export class SqsConsumerHandler {
  private logger: Logger;
  constructor(private w3s: Web3Service, private sqsService: SqsService) {
    this.logger = new Logger('SqsHandler');
  }

  @SqsMessageHandler(false)
  async handleMessage(message: SQS.Message) {
    const msg = JSON.parse(message.Body);
    this.logger.log(
      `Processing requestId: ${msg?.requestId} of wallet: ${msg?.walletAddress}, operationType: ${msg?.operationName}, command: ${msg?.command}`,
    );
    let result: JobResult | Response;

    switch (msg?.command) {
      case CMD.DEPLOY:
        result = await lastValueFrom(await this.w3s.process(msg.data, pt.DEPLOY));
        break;
      case CMD.MINT:
        result = await lastValueFrom(await this.w3s.process(msg.data, pt.MINT));
        break;
      case CMD.WHITELIST:
        result = await lastValueFrom(await this.w3s.process(msg.data, pt.WHITELIST));
        break;
      case CMD.COMMON:
        result = await lastValueFrom(await this.w3s.process(msg.data, pt.COMMON));
        break;
      default:
        result = new Response(HttpStatus.BAD_REQUEST, 'Invalid pattern', null);
        break;
    }
    const body = {
      requestId: msg?.requestId,
      command: msg?.command,
      operationName: msg?.operationName,
      walletAddress: msg?.walletAddress,
      data: result,
    };
    await this.sqsService.send(SQS_PRODUCER_NAME, {
      id: uuidv4(),
      groupId: uuidv4(),
      body: result,
    });
    return;
  }

  @SqsConsumerEventHandler(SqsConsumerEvent.PROCESSING_ERROR)
  public onProcessingError(error: Error, message: SQS.Message) {
    this.logger.error(`Error processing message: ${message.MessageId}`);
    this.logger.error(error);
  }
}
