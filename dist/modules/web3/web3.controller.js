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
exports.Web3Controller = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
const callData_dto_1 = require("./dto/callData.dto");
const createWallet_dto_1 = require("./dto/createWallet.dto");
const deployData_dto_1 = require("./dto/deployData.dto");
const getJob_dto_1 = require("./dto/getJob.dto");
const whitelist_dto_1 = require("./dto/whitelist.dto");
const web3_service_1 = require("./web3.service");
const predict_dto_1 = require("./dto/predict.dto");
let Web3Controller = class Web3Controller {
    constructor(web3Service) {
        this.web3Service = web3Service;
        this.logger = new common_1.Logger('Web3Controller');
    }
    async createWallet(data) {
        this.logger.log(`Processing call '${constants_1.CMD.CREATE_WALLET}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.processJob(data, constants_1.ProcessTypes.CREATE_WALLET);
    }
    async processDeploy(data) {
        this.logger.log(`Processing call '${constants_1.CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.processJob(data, constants_1.ProcessTypes.DEPLOY);
    }
    async processMint(data) {
        this.logger.log(`Processing call '${constants_1.CMD.MINT}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.processJob(data, constants_1.ProcessTypes.MINT);
    }
    async processWhitelist(data) {
        this.logger.log(`Processing call '${constants_1.CMD.WHITELIST}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.processJob(data, constants_1.ProcessTypes.WHITELIST);
    }
    async processCommon(data) {
        this.logger.log(`Processing call '${constants_1.CMD.COMMON}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.processJob(data, constants_1.ProcessTypes.COMMON);
    }
    async getMerkleProof(data) {
        this.logger.log(`Processing call '${constants_1.CMD.GET_MERKLE_PROOF}' with data: ${JSON.stringify(data)}`);
        return await this.web3Service.processJob(data, constants_1.ProcessTypes.MERKLE_PROOF);
    }
    async getJob(data) {
        this.logger.log(`Processing call '${constants_1.CMD.JOB}' with data: ${JSON.stringify(data)}`);
        const result = await this.web3Service.getJob(data);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, constants_1.Statuses.SUCCESS, result);
    }
    async predict(data) {
        this.logger.log(`Processing call '${constants_1.CMD.JOB}' with data: ${JSON.stringify(data)}`);
        const result = await this.web3Service.predictContractAddress(data);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, constants_1.Statuses.SUCCESS, result);
    }
};
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.CREATE_WALLET }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createWallet_dto_1.CreateWalletDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "createWallet", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.DEPLOY }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deployData_dto_1.DeployDataDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "processDeploy", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.MINT }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [callData_dto_1.CallDataDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "processMint", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.WHITELIST }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [callData_dto_1.CallDataDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "processWhitelist", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.COMMON }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [callData_dto_1.CallDataDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "processCommon", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.GET_MERKLE_PROOF }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whitelist_dto_1.WhitelistDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "getMerkleProof", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.JOB }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getJob_dto_1.GetJobDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "getJob", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: constants_1.CMD.PREDICT_ADDRESS }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [predict_dto_1.PredictDto]),
    __metadata("design:returntype", Promise)
], Web3Controller.prototype, "predict", null);
Web3Controller = __decorate([
    (0, common_1.Controller)(constants_1.WEB3_CONTROLLER),
    __metadata("design:paramtypes", [web3_service_1.Web3Service])
], Web3Controller);
exports.Web3Controller = Web3Controller;
//# sourceMappingURL=web3.controller.js.map