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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Processor = void 0;
const web3_1 = __importDefault(require("web3"));
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const db_manager_service_1 = require("../db-manager/db-manager.service");
const web3_service_1 = require("./web3.service");
const constants_1 = require("../common/constants");
const ipfs_manager_service_1 = require("../ipfs-manager/ipfs-manager.service");
const microservices_1 = require("@nestjs/microservices");
let Web3Processor = class Web3Processor {
    constructor(configService, dbManager, ipfsManger, web3Service) {
        this.configService = configService;
        this.dbManager = dbManager;
        this.ipfsManger = ipfsManger;
        this.web3Service = web3Service;
        this.ethereum = new web3_1.default(new web3_1.default.providers.HttpProvider(this.configService.get('ETHEREUM_HOST')));
        this.polygon = new web3_1.default(new web3_1.default.providers.HttpProvider(this.configService.get('POLYGON_HOST')));
    }
    async mint(job) {
        try {
            const mintData = job.data;
            const w3 = mintData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
            const contractObj = await this.dbManager.findByPk(mintData.contract_id);
            if (!contractObj) {
                throw new microservices_1.RpcException('contract not found');
            }
            const contractInstance = new w3.eth.Contract(contractObj.deploy_data.abi, contractObj.address);
            const methodArgs = mintData.arguments.split(',');
            const methodObj = contractObj.deploy_data.abi.find((x) => x.name === mintData.method_name && x.type === 'function');
            if (!methodObj) {
                throw new microservices_1.RpcException('method not found');
            }
            const txData = w3.eth.abi.encodeFunctionCall(methodObj, methodArgs);
            const mintTx = await this.web3Service.send(contractInstance, txData, constants_1.ProcessTypes.MINT, mintData.network);
            const metaData = await this.generateMetadata(mintData);
            const tokenObj = await this.dbManager.create({
                contract_id: contractObj.id,
                address: contractObj.address,
                nft_number: mintData.nft_number,
                meta_data: metaData,
                mint_data: mintData,
                mint_tx: mintTx,
            }, constants_1.ObjectTypes.TOKEN);
            return tokenObj;
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async deploy(job) {
        try {
            const deployData = job.data;
            const w3 = deployData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
            const contractInstance = new w3.eth.Contract(deployData.abi);
            const txData = contractInstance.deploy({ data: deployData.bytecode, arguments: deployData.args.split(',') });
            const deployTx = await this.web3Service.send(contractInstance, txData.encodeABI(), constants_1.ProcessTypes.DEPLOY, deployData.network);
            const contractObj = await this.dbManager.create({
                address: deployTx.contractAddress,
                deploy_data: deployData,
                deploy_tx: deployTx,
            }, constants_1.ObjectTypes.CONTRACT);
            return contractObj;
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async generateMetadata(data) {
        const fileId = await this.ipfsManger.upload(data.asset_url);
        const metadata = data.meta_data;
        switch (data.asset_type) {
            case constants_1.FileTypes.IMAGE:
                metadata.image = `${fileId}/${data.asset_url}`;
                break;
            case constants_1.FileTypes.OBJECT:
                metadata.model_url = `${fileId}/${data.asset_url}`;
                break;
        }
        return metadata;
    }
};
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.MINT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "mint", null);
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.DEPLOY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "deploy", null);
Web3Processor = __decorate([
    (0, bull_1.Processor)('web3'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        db_manager_service_1.DbManagerService,
        ipfs_manager_service_1.IpfsManagerService,
        web3_service_1.Web3Service])
], Web3Processor);
exports.Web3Processor = Web3Processor;
//# sourceMappingURL=web3.processor.js.map