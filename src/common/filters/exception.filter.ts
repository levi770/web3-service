import { Catch, RpcExceptionFilter, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter<RpcException> {
  private logger: Logger = new Logger(ExceptionFilter.name);
  catch(exception: RpcException): Observable<any> {
    this.logger.error(JSON.stringify(exception.getError()));
    return throwError(() => exception.getError());
  }
}
