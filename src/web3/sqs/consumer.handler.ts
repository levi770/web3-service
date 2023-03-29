import { SqsConsumerEvent, SqsConsumerEventHandler, SqsMessageHandler, SqsProcess, SqsService } from '@nestjs-packages/sqs';
import { v4 as uuidv4 } from 'uuid';
import { CMD } from '../../common/constants';
import { HttpStatus, Logger } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { ResponseDto } from '../../common/dto/response.dto';
import { CommandBus } from '@nestjs/cqrs';
import { DeployCommand } from '../commands/deploy.command';
import { MintCommand } from '../commands/mint.command';
import { WhitelistCommand } from '../commands/whitelist.command';
import { CommonCommand } from '../commands/common.command';

import * as dotenv from 'dotenv';
dotenv.config();

@SqsProcess(process.env.SQS_CONSUMER_NAME)
export class SqsConsumerHandler {
  private logger = new Logger(SqsConsumerHandler.name);
  constructor(private readonly commandBus: CommandBus, private sqsService: SqsService) {}

  @SqsMessageHandler(false)
  async handleMessage(message: SQS.Message) {
    const msg = JSON.parse(message.Body);
    this.logger.log(
      `Processing requestId: ${msg?.requestId} of wallet: ${msg?.walletAddress}, operationType: ${msg?.operationName}, command: ${msg?.command}`,
    );

    let result: ResponseDto;
    switch (msg?.command) {
      case CMD.DEPLOY:
        result = await this.commandBus.execute(new DeployCommand(msg.data));
        break;
      case CMD.MINT:
        result = await this.commandBus.execute(new MintCommand(msg.data));
        break;
      case CMD.WHITELIST:
        result = await this.commandBus.execute(new WhitelistCommand(msg.data));
        break;
      case CMD.COMMON:
        result = await this.commandBus.execute(new CommonCommand(msg.data));
        break;
      default:
        throw new Error(`Command ${msg?.command} not supported`);
    }

    const logMessage = result.status != HttpStatus.OK ? JSON.stringify(result.data) : '';
    this.logger.log(`finished: statusCode: ${result.status}, ${logMessage}`);

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
    return;
  }

  @SqsConsumerEventHandler(SqsConsumerEvent.PROCESSING_ERROR)
  public onProcessingError(error: Error, message: SQS.Message) {
    this.logger.error(`Error processing message: ${message.MessageId} - ${error.message}`);
    return;
  }
}
