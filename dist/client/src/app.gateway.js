"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const operation_dto_1 = require("./dto/operation.dto");
const constants_1 = require("./constants");
let AppGateway = class AppGateway {
    constructor(svc) {
        this.svc = svc;
    }
    listenForMessages(client, data) {
        if (!data.operation || !data.data) {
            throw new websockets_1.WsException('no dto');
        }
        const job$ = this.svc.send({ cmd: data.operation === constants_1.PROCESSES.DEPLOY ? constants_1.CMD.DEPLOY : constants_1.CMD.CALL }, data.data);
        job$.subscribe((result) => {
            client.emit(constants_1.WEB3_SERVICE, result);
        });
    }
};
__decorate([
    (0, websockets_1.SubscribeMessage)(constants_1.WEB3_SERVICE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, operation_dto_1.OperationDto]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "listenForMessages", null);
AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(5050, { namespace: 'app', cors: { origin: '*' } }),
    __param(0, (0, common_1.Inject)(constants_1.WEB3_SERVICE)),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], AppGateway);
exports.AppGateway = AppGateway;
//# sourceMappingURL=app.gateway.js.map