import { ArgumentMetadata, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { RpcValidationException } from '../exceptions/RpcValidation.exception';
import { ExceptionTypes } from '../constants';
import { HttpValidationException } from '../exceptions/HttpValidation.exception';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  type: ExceptionTypes;
  constructor(type: ExceptionTypes) {
    this.type = type;
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (metadata.type === 'custom') return value;
    const obj = plainToClass(metadata.metatype, value);
    const errors = await validate(obj);
    if (errors.length) {
      const messages = errors.map((err) => {
        return `${err.property} - ${Object.values(err.constraints).join(', ')}`;
      });
      if (this.type === ExceptionTypes.HTTP) {
        throw new HttpValidationException(messages);
      } else {
        throw new RpcValidationException({ status: HttpStatus.BAD_REQUEST, messages });
      }
    }
    return obj;
  }
}
