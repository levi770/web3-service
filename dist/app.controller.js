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
const callData_dto_1 = require("./web3/dto/callData.dto");
const constants_1 = require("./common/constants");
const common_1 = require("@nestjs/common");
const deployData_dto_1 = require("./web3/dto/deployData.dto");
const getAll_dto_1 = require("./db/dto/getAll.dto");
const getJob_dto_1 = require("./web3/dto/getJob.dto");
const getOne_dto_1 = require("./db/dto/getOne.dto");
const microservices_1 = require("@nestjs/microservices");
const response_dto_1 = require("./common/dto/response.dto");
const updateMetadata_dto_1 = require("./db/dto/updateMetadata.dto");
const updateStatus_dto_1 = require("./db/dto/updateStatus.dto");
const web3_service_1 = require("./web3/web3.service");
const whitelist_dto_1 = require("./web3/dto/whitelist.dto");
const db_service_1 = require("./db/db.service");
const createWallet_dto_1 = require("./web3/dto/createWallet.dto");
let AppController = class AppController {
    constructor(web3Service, dbManagerService) {
        this.web3Service = web3Service;
        this.dbManagerService = dbManagerService;
        this.logger = new common_1.Logger('AppController');
    }
    async createWallet(data) {
        this.logger.log(`Processing call '${constants_1.CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
        const wallet = await this.web3Service.newWallet();
        const created = await this.dbManagerService.create([{ team_id: data.team_id, ...wallet }], constants_1.ObjectTypes.WALLET);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.CREATED, 'wallet created', { id: created[0].id, address: wallet.address });
    }
    async processDeploy(data) {
        this.logger.log(`Processing call '${constants_1.CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.process(data, constants_1.ProcessTypes.DEPLOY);
    }
    async processCall(data) {
        this.logger.log(`Processing call '${constants_1.CMD.CALL}' with data: ${JSON.stringify(data)}`);
        if (data.operation_type === constants_1.OperationTypes.WHITELIST_ADD ||
            data.operation_type === constants_1.OperationTypes.WHITELIST_REMOVE) {
            return await this.web3Service.process(data, constants_1.ProcessTypes.WHITELIST);
        }
        return await this.web3Service.process(data, constants_1.ProcessTypes.COMMON);
    }
    async getJob(data) {
        this.logger.log(`Processing call '${constants_1.CMD.JOB}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.getJob(data);
    }
    async getMerkleProof(data) {
        this.logger.log(`Processing call '${constants_1.CMD.GET_MERKLE_PROOF}' with data: ${JSON.stringify(data)}`);
        const { contract_id, address } = data;
        const whitelist = (await this.dbManagerService.getAllObjects(constants_1.ObjectTypes.WHITELIST, { contract_id }))
            .rows;
        const merkleRoot = await this.web3Service.getMerkleRoot(whitelist);
        const merkleProof = await this.web3Service.getMerkleProof(whitelist, address);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, null, { merkleRoot, merkleProof });
    }
    async getAllObjects(data) {
        this.logger.log(`Processing call '${constants_1.CMD.ALL_OBJECTS}' with data: ${JSON.stringify(data)}`);
        return await this.dbManagerService.getAllObjects(data.object_type, data);
    }
    async getOneObject(data) {
        this.logger.log(`Processing call '${constants_1.CMD.ONE_OBJECT}' with data: ${JSON.stringify(data)}`);
        return await this.dbManagerService.getOneObject(data.object_type, data);
    }
    async updateStatus(data) {
        this.logger.log(`Processing call '${constants_1.CMD.UPDATE_STATUS}' with data: ${JSON.stringify(data)}`);
        let txReceipt;
        if (data.tx_receipt) {
            txReceipt = data.tx_receipt;
        }
        else {
            txReceipt = await this.web3Service.getTxReceipt(data.tx_hash, data.network);
        }
        const status = !txReceipt ? constants_1.Statuses.UNKNOWN : txReceipt.status ? constants_1.Statuses.PROCESSED : constants_1.Statuses.FAILED;
        return await this.dbManagerService.updateStatus({ status, ...data });
    }
    async updateMetadata(data) {
        this.logger.log(`Processing call '${constants_1.CMD.UPDATE_METADATA}' with data: ${JSON.stringify(data)}`);
        return await this.dbManagerService.updateMetadata(data);
    }
    async getMetaData(id) {
        this.logger.log(`Processing GET request 'metadata' with id: ${id}`);
        return await this.dbManagerService.getMetadata(id);
    }
    async getHealth() {
        this.logger.log(`Processing GET request 'health'`);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'active', null);
    }
};
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.CREATE_WALLET }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createWallet_dto_1.CreateWalletDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createWallet", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.DEPLOY }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deployData_dto_1.DeployDataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "processDeploy", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.CALL }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [callData_dto_1.CallDataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "processCall", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.JOB }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getJob_dto_1.GetJobDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getJob", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.GET_MERKLE_PROOF }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whitelist_dto_1.WhitelistDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMerkleProof", null);
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
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.UPDATE_STATUS }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [updateStatus_dto_1.UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateStatus", null);
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
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHealth", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [web3_service_1.Web3Service, db_service_1.DbService])
], AppController);
exports.AppController = AppController;
//# sourceMappingURL=app.controller.js.map