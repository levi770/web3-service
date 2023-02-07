import { Response } from '../../../common/dto/response.dto';
import { SQS } from 'aws-sdk';

export class ProcessingErrorEvent {
  msg: SQS.Message;
  err: Error;
  constructor(err: Error, msg: SQS.Message) {
    this.err = err;
    this.msg = msg;
  }
}
