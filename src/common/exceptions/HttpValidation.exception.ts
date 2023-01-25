import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpValidationException extends HttpException {
  messages: any;
  constructor(responce: string | Record<string, any>) {
    super(responce, HttpStatus.BAD_REQUEST);
    this.messages = responce;
  }
}
