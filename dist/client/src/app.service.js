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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const constants_1 = require("./constants");
let AppService = class AppService {
    constructor(svc) {
        this.svc = svc;
    }
    async updateMetadata(id, meta_data) {
        return await (0, rxjs_1.lastValueFrom)(this.svc.send({ cmd: constants_1.CMD.UPDATE_METADATA }, { id, meta_data }));
    }
    async getOne(query) {
        return await (0, rxjs_1.lastValueFrom)(this.svc.send({ cmd: constants_1.CMD.ONE_OBJECT }, query));
    }
    async getAll(query) {
        return await (0, rxjs_1.lastValueFrom)(this.svc.send({ cmd: constants_1.CMD.ALL_OBJECTS }, query));
    }
    async getJob(query) {
        return await (0, rxjs_1.lastValueFrom)(this.svc.send({ cmd: constants_1.CMD.JOB }, query));
    }
    async process(data) {
        if (!data.async) {
            return await (0, rxjs_1.lastValueFrom)(this.svc.send({ cmd: data.operation === constants_1.PROCESSES.DEPLOY ? constants_1.CMD.DEPLOY : constants_1.CMD.CALL }, data.data));
        }
        return await (0, rxjs_1.firstValueFrom)(this.svc.send({ cmd: data.operation === constants_1.PROCESSES.DEPLOY ? constants_1.CMD.DEPLOY : constants_1.CMD.CALL }, data.data));
    }
};
AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.WEB3_SERVICE)),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], AppService);
exports.AppService = AppService;
//# sourceMappingURL=app.service.js.map