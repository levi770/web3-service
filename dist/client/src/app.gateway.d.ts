import { Socket } from 'socket.io';
import { ClientProxy } from '@nestjs/microservices';
import { OperationDto } from './dto/operation.dto';
export declare class AppGateway {
    private svc;
    constructor(svc: ClientProxy);
    listenForMessages(client: Socket, data: OperationDto): void;
}
