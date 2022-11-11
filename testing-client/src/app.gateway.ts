import { Observable } from 'rxjs';
import { Socket, Server } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { JobResultDto } from './dto/jobResult.dto';
import { OperationDto } from './dto/operation.dto';

type connectionData = {
  userId: string;
};

@WebSocketGateway(5050, { namespace: 'app', cors: { origin: '*' } })
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('AppGateway');
  private connections = new Map<string, connectionData>();

  constructor(@Inject('WEB3_SERVICE') private svc: ClientProxy) {}

  afterInit(_server: Server) {
    this.logger.log('Websocket gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.connections.set(client.id, { userId: client.data['user'] });
  }

  handleDisconnect(client: Socket) {
    this.connections.delete(client.id);
  }

  @SubscribeMessage('jobs')
  listenForMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: OperationDto,
  ) {
    if (!data.operation || !data.data) {
      throw new WsException('no dto');
    }

    const job$: Observable<JobResultDto> = this.svc.send(
      { cmd: data.operation === 'deploy' ? 'deployContract' : 'mintToken' },
      data.data,
    );

    job$.subscribe((result) => {
      client.emit('jobs', result);
    });
  }
}
