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
const microservices_1 = require("@nestjs/microservices");
const constants_1 = require("./common/constants");
const deployData_dto_1 = require("./web3-manager/dto/deployData.dto");
const getAll_dto_1 = require("./db-manager/dto/getAll.dto");
const mintData_dto_1 = require("./web3-manager/dto/mintData.dto");
const db_manager_service_1 = require("./db-manager/db-manager.service");
const web3_service_1 = require("./web3-manager/web3.service");
const getOne_dto_1 = require("./db-manager/dto/getOne.dto");
const getJob_dto_1 = require("./web3-manager/dto/getJob.dto");
const updateMetadata_dto_1 = require("./db-manager/dto/updateMetadata.dto");
let AppController = class AppController {
    constructor(web3Service, dbManagerService) {
        this.web3Service = web3Service;
        this.dbManagerService = dbManagerService;
    }
    async getJob(data) {
        return await this.web3Service.getJob(data);
    }
    async processDeploy(data) {
        return await this.web3Service.process(data, constants_1.ProcessTypes.DEPLOY);
    }
    async processCall(data) {
        return await this.web3Service.process(data, constants_1.ProcessTypes.COMMON);
    }
    async processWhitelist(data) {
        return await this.web3Service.process(data, constants_1.ProcessTypes.WHITELIST);
    }
    async getAllObjects(data) {
        return await this.dbManagerService.getAllObjects(constants_1.ObjectTypes.CONTRACT, data);
    }
    async getOneObject(data) {
        return await this.dbManagerService.getOneObject(constants_1.ObjectTypes.CONTRACT, data);
    }
    async updateMetadata(data) {
        return await this.dbManagerService.updateMetadata(data);
    }
    async getMetaData(id) {
        return await this.dbManagerService.getMetadata(id);
    }
};
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.JOB }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getJob_dto_1.GetJobDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getJob", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.DEPLOY }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deployData_dto_1.DeployDataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "processDeploy", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.CALL }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mintData_dto_1.MintDataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "processCall", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.CALL }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mintData_dto_1.MintDataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "processWhitelist", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.ALL_OBJECTS }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getAll_dto_1.GetAllDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAllObjects", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.ONE_OBJECT }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getOne_dto_1.GetOneDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOneObject", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.UPDATE_METADATA }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [updateMetadata_dto_1.UpdateMetadataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateMetadata", null);
__decorate([
    (0, common_1.Get)('metadata/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMetaData", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [web3_service_1.Web3Service, db_manager_service_1.DbManagerService])
], AppController);
exports.AppController = AppController;
//# sourceMappingURL=app.controller.js.map