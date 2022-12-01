"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
const U = __importStar(require("web3-utils"));
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const db_manager_service_1 = require("../db-manager/db-manager.service");
const web3_service_1 = require("./web3.service");
const constants_1 = require("../common/constants");
const ipfs_manager_service_1 = require("../ipfs-manager/ipfs-manager.service");
const microservices_1 = require("@nestjs/microservices");
const merkletreejs_1 = __importDefault(require("merkletreejs"));
let Web3Processor = class Web3Processor {
    constructor(configService, dbManager, ipfsManger, web3Service) {
        this.configService = configService;
        this.dbManager = dbManager;
        this.ipfsManger = ipfsManger;
        this.web3Service = web3Service;
        this.ethereum = new web3_1.default(new web3_1.default.providers.HttpProvider(this.configService.get('ETHEREUM_HOST')));
        this.polygon = new web3_1.default(new web3_1.default.providers.HttpProvider(this.configService.get('POLYGON_HOST')));
    }
    async processWhitelist(job) {
        const callData = job.data;
        const w3 = callData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
        const contractObj = await this.dbManager.findById(callData.contract_id, constants_1.ObjectTypes.CONTRACT);
        if (!contractObj) {
            throw new microservices_1.RpcException('contract not found');
        }
        let merkleRoot;
        switch (callData.operation_type) {
            case constants_1.OperationTypes.WHITELIST_ADD: {
                const whitelistOptions = callData?.operation_options;
                if (!whitelistOptions) {
                    throw new microservices_1.RpcException('operation specific options missed');
                }
                const whitelistObj = await this.dbManager.create(whitelistOptions, constants_1.ObjectTypes.WHITELIST);
                if (!whitelistObj) {
                    throw new microservices_1.RpcException('whitelist object creation failed');
                }
                const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST)).rows;
                merkleRoot = await this.getMerkleRoot(whitelist);
            }
            case constants_1.OperationTypes.WHITELIST_REMOVE:
                {
                    const whitelistOptions = callData?.operation_options;
                    if (!whitelistOptions) {
                        throw new microservices_1.RpcException('operation specific options missed');
                    }
                    const deleted = await this.dbManager.delete(whitelistOptions, constants_1.ObjectTypes.WHITELIST);
                    if (deleted === 0) {
                        throw new microservices_1.RpcException('whitelist object creation failed');
                    }
                    const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST)).rows;
                    merkleRoot = await this.getMerkleRoot(whitelist);
                }
        }
        const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi, contractObj.address);
        const abiObj = contractObj.deploy_data.abi.find((x) => x.name === callData.method_name && x.type === 'function');
        if (!abiObj) {
            throw new microservices_1.RpcException('method not found');
        }
        const callArgs = [merkleRoot];
        const isValidArgs = callArgs.length === abiObj.inputs.length;
        if (!isValidArgs) {
            throw new microservices_1.RpcException('arguments length is not valid');
        }
        const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
        return await this.web3Service.send(callData.network, contractInst, txData);
    }
    async processCall(job) {
        const callData = job.data;
        const w3 = callData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
        const contractObj = await this.dbManager.findById(callData.contract_id, constants_1.ObjectTypes.CONTRACT);
        if (!contractObj) {
            throw new microservices_1.RpcException('contract not found');
        }
        const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi, contractObj.address);
        const abiObj = contractObj.deploy_data.abi.find((x) => x.name === callData.method_name && x.type === 'function');
        if (!abiObj) {
            throw new microservices_1.RpcException('method not found');
        }
        const callArgs = callData.arguments.split(',');
        const isValidArgs = callArgs.length === abiObj.inputs.length;
        if (!isValidArgs) {
            throw new microservices_1.RpcException('arguments length is not valid');
        }
        const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
        const tx = await this.web3Service.send(callData.network, contractInst, txData);
        switch (callData.operation_type) {
            case constants_1.OperationTypes.COMMON:
                return tx;
            case constants_1.OperationTypes.MINT:
                const mintOptions = callData?.operation_options;
                if (!mintOptions) {
                    throw new microservices_1.RpcException('operation specific options missed');
                }
                const metaData = await this.getMetadata(mintOptions);
                return await this.dbManager.create({
                    contract_id: contractObj.id,
                    address: contractObj.address,
                    nft_number: mintOptions.nft_number,
                    meta_data: metaData,
                    mint_data: mintOptions,
                    mint_tx: tx,
                }, constants_1.ObjectTypes.TOKEN);
        }
    }
    async deploy(job) {
        try {
            const deployData = job.data;
            const w3 = deployData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
            const contractInstance = new w3.eth.Contract(deployData.abi);
            const txData = contractInstance.deploy({ data: deployData.bytecode, arguments: deployData.arguments.split(',') });
            const deployTx = await this.web3Service.send(deployData.network, contractInstance, txData.encodeABI(), constants_1.OperationTypes.DEPLOY);
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
    async getMetadata(data) {
        const fileId = await this.ipfsManger.upload(data.asset_url);
        const metadata = data.meta_data;
        switch (data.asset_type) {
            case constants_1.FileTypes.IMAGE:
                metadata.image = `${fileId}/files/${data.asset_url}`;
                break;
            case constants_1.FileTypes.OBJECT:
                metadata.model_url = `${fileId}/files/${data.asset_url}`;
                break;
        }
        return metadata;
    }
    async getMerkleRoot(leaves) {
        const hash_leaves = leaves.map((x) => U.keccak256(x.address));
        const tree = new merkletreejs_1.default(hash_leaves, U.keccak256, { sortPairs: true });
        return tree.getHexRoot();
    }
};
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.WHITELIST),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "processWhitelist", null);
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.COMMON),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "processCall", null);
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