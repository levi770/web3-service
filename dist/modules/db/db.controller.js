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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
const db_service_1 = require("./db.service");
const getAll_dto_1 = require("./dto/getAll.dto");
const getOne_dto_1 = require("./dto/getOne.dto");
const updateMetadata_dto_1 = require("./dto/updateMetadata.dto");
const updateStatus_dto_1 = require("./dto/updateStatus.dto");
let DbController = class DbController {
    constructor(dbManagerService) {
        this.dbManagerService = dbManagerService;
        this.logger = new common_1.Logger('DbController');
    }
    async getAllObjects(data) {
        this.logger.log(`Processing call '${constants_1.CMD.ALL_OBJECTS}' with data: ${JSON.stringify(data)}`);
        if (data.object_type === undefined) {
            return new response_dto_1.ResponseDto(common_1.HttpStatus.BAD_REQUEST, 'Missing object_type', null);
        }
        const result = await this.dbManagerService.getAllObjects(data.object_type, data);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, constants_1.Statuses.SUCCESS, result);
    }
    async getOneObject(data) {
        this.logger.log(`Processing call '${constants_1.CMD.ONE_OBJECT}' with data: ${JSON.stringify(data)}`);
        if (data.object_type === undefined) {
            return new response_dto_1.ResponseDto(common_1.HttpStatus.BAD_REQUEST, 'Missing object_type', null);
        }
        const result = await this.dbManagerService.getOneObject(data.object_type, data);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, constants_1.Statuses.SUCCESS, result);
    }
    async updateStatus(data) {
        this.logger.log(`Processing call '${constants_1.CMD.UPDATE_STATUS}' with data: ${JSON.stringify(data)}`);
        if (data.object_type === undefined) {
            return new response_dto_1.ResponseDto(common_1.HttpStatus.BAD_REQUEST, 'Missing object_type', null);
        }
        const result = await this.dbManagerService.updateStatus(data, data.object_type);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, constants_1.Statuses.SUCCESS, result);
    }
    async updateMetadata(data) {
        this.logger.log(`Processing call '${constants_1.CMD.UPDATE_METADATA}' with data: ${JSON.stringify(data)}`);
        const result = await this.dbManagerService.updateMetadata(data);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, constants_1.Statuses.SUCCESS, result);
    }
};
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.ALL_OBJECTS }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getAll_dto_1.GetAllDto]),
    __metadata("design:returntype", Promise)
], DbController.prototype, "getAllObjects", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.ONE_OBJECT }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getOne_dto_1.GetOneDto]),
    __metadata("design:returntype", Promise)
], DbController.prototype, "getOneObject", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.UPDATE_STATUS }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [updateStatus_dto_1.UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], DbController.prototype, "updateStatus", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.UPDATE_METADATA }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [updateMetadata_dto_1.UpdateMetadataDto]),
    __metadata("design:returntype", Promise)
], DbController.prototype, "updateMetadata", null);
DbController = __decorate([
    (0, common_1.Controller)(constants_1.DB_CONTROLLER),
    __metadata("design:paramtypes", [db_service_1.DbService])
], DbController);
exports.DbController = DbController;
//# sourceMappingURL=db.controller.js.map