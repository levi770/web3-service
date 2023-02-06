import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RpcLogger implements NestInterceptor {
  constructor(private logger: Logger) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { args } = context.switchToRpc().getContext();
    const data = context.switchToRpc().getData();
    const cmd = JSON.parse(args[0]).cmd;
    const cmd_args = JSON.stringify({
      team_id: data?.team_id,
      test: data?.test,
      type: data?.operation_type,
      from: data?.from_address,
      method: data?.method_name,
      execute: data?.execute,
      contract: data?.contract_id,
      network: data?.network,
      object_type: data?.object_type,
      slug: data?.slug,
      token_id: data?.token_id,
    });
    return next.handle().pipe(tap(() => this.logger.log(`Processing RPC command: '${cmd}' with args: '${cmd_args}'`)));
  }
}
