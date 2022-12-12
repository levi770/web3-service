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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const constants_1 = require("./constants");
const getAll_dto_1 = require("./dto/getAll.dto");
const getJob_dto_1 = require("./dto/getJob.dto");
const getOne_dto_1 = require("./dto/getOne.dto");
const metaData_dto_1 = require("./dto/metaData.dto");
const operation_dto_1 = require("./dto/operation.dto");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    async getAll(query) {
        return this.appService.getAll(query);
    }
    async getOne(query) {
        return this.appService.getOne(query);
    }
    async getJob(query) {
        return this.appService.getJob(query);
    }
    async process(data) {
        return this.appService.process(data);
    }
    async updateMetadata(id, data) {
        return this.appService.updateMetadata(id, data);
    }
};
__decorate([
    (0, common_1.Get)(constants_1.ROUTES.ALL),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getAll_dto_1.GetAllDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(constants_1.ROUTES.ONE),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getOne_dto_1.GetOneDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(constants_1.ROUTES.JOB),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getJob_dto_1.JobIdDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getJob", null);
__decorate([
    (0, common_1.Post)(constants_1.ROUTES.PROCESS),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [operation_dto_1.OperationDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "process", null);
__decorate([
    (0, common_1.Patch)(constants_1.ROUTES.METADATA),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, metaData_dto_1.MetaDataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateMetadata", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
exports.AppController = AppController;
//# sourceMappingURL=app.controller.js.map