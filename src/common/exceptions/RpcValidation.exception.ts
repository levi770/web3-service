import { RpcException } from '@nestjs/microservices';

export class RpcValidationException extends RpcException {
  messages: any;
  constructor(responce: string | Record<string, any>) {
    super(responce);
    this.messages = responce;
  }
}
