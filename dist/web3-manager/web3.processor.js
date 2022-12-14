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
const config_1 = require("@nestjs/config");
const db_manager_service_1 = require("../db-manager/db-manager.service");
const ipfs_manager_service_1 = require("../ipfs-manager/ipfs-manager.service");
const bull_1 = require("@nestjs/bull");
const microservices_1 = require("@nestjs/microservices");
const web3_service_1 = require("./web3.service");
const constants_1 = require("../common/constants");
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
        try {
            const callData = job.data;
            const w3 = callData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
            const contractObj = (await this.dbManager.findById(callData.contract_id, constants_1.ObjectTypes.CONTRACT));
            if (!contractObj) {
                throw new microservices_1.RpcException('contract not found');
            }
            let merkle;
            const whitelistOptions = {
                status: callData.execute ? constants_1.Statuses.PROCESSED : constants_1.Statuses.CREATED,
                contract_id: contractObj.id,
                address: callData.operation_options.address,
            };
            if (!whitelistOptions) {
                throw new microservices_1.RpcException('operation specific options missed');
            }
            switch (callData.operation_type) {
                case constants_1.OperationTypes.WHITELIST_ADD: {
                    const addressObj = await this.dbManager.getOneObject(constants_1.ObjectTypes.WHITELIST, {
                        address: whitelistOptions.address,
                        contract_id: whitelistOptions.contract_id,
                    });
                    if (addressObj) {
                        throw new microservices_1.RpcException('Address already exist in whitelist');
                    }
                    const whitelistObj = await this.dbManager.create(whitelistOptions, constants_1.ObjectTypes.WHITELIST);
                    if (!whitelistObj) {
                        throw new microservices_1.RpcException('Failed to create whitelist object');
                    }
                    const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, {
                        contract_id: callData.contract_id,
                    })).rows;
                    merkle = await this.web3Service.getMerkleRootProof(whitelist, whitelistOptions.address);
                    break;
                }
                case constants_1.OperationTypes.WHITELIST_REMOVE: {
                    const deleted = await this.dbManager.delete(whitelistOptions, constants_1.ObjectTypes.WHITELIST);
                    if (deleted === 0) {
                        throw new microservices_1.RpcException('Failed to remove whitelist object');
                    }
                    const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, {
                        contract_id: callData.contract_id,
                    })).rows;
                    merkle = await this.web3Service.getMerkleRootProof(whitelist);
                    break;
                }
            }
            const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi, contractObj.address);
            const abiObj = contractObj.deploy_data.abi.find((x) => x.name === callData.method_name && x.type === 'function');
            if (!abiObj) {
                throw new microservices_1.RpcException('method not found');
            }
            const callArgs = [merkle.merkleRoot];
            const isValidArgs = callArgs.length === abiObj.inputs.length;
            if (!isValidArgs) {
                throw new microservices_1.RpcException('arguments length is not valid');
            }
            const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
            const txObj = {
                execute: callData.execute,
                network: callData.network,
                contract: contractInst,
                data: txData,
                operationType: constants_1.OperationTypes.COMMON,
            };
            const callTx = await this.web3Service.send(txObj);
            return { merkle, callTx };
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async processCall(job) {
        try {
            const callData = job.data;
            const w3 = callData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
            const contractObj = (await this.dbManager.getOneObject(constants_1.ObjectTypes.CONTRACT, {
                id: callData.contract_id,
                include_child: true,
            }));
            if (!contractObj) {
                throw new microservices_1.RpcException('contract not found');
            }
            const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi, contractObj.address);
            const abiObj = contractObj.deploy_data.abi.find((x) => x.name === callData.method_name && x.type === 'function');
            if (!abiObj) {
                throw new microservices_1.RpcException('method not found');
            }
            const callArgs = callData.arguments ? await this.getArgs(callData.arguments, abiObj.inputs) : [];
            if (callData.operation_type === constants_1.OperationTypes.READ_CONTRACT) {
                const callResult = await contractInst.methods[callData.method_name](...callArgs).call();
                return { [callData.method_name]: callResult };
            }
            const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
            const txObj = {
                execute: callData.execute,
                network: callData.network,
                contract: contractInst,
                data: txData,
                operationType: constants_1.OperationTypes.COMMON,
            };
            const callTx = await this.web3Service.send(txObj);
            const tx = callData.execute ? callTx.txReceipt : null;
            switch (callData.operation_type) {
                case constants_1.OperationTypes.COMMON:
                    return { callTx };
                case constants_1.OperationTypes.MINT:
                    const mintOptions = callData?.operation_options;
                    if (!mintOptions) {
                        throw new microservices_1.RpcException('operation specific options missed');
                    }
                    const status = callData.execute ? constants_1.Statuses.PROCESSED : constants_1.Statuses.CREATED;
                    const tokenObj = (await this.dbManager.create({
                        status,
                        contract_id: contractObj.id,
                        address: contractObj.address,
                        nft_number: mintOptions.nft_number,
                        mint_data: mintOptions,
                        tx_hash: tx?.transactionHash,
                        tx_receipt: tx,
                    }, constants_1.ObjectTypes.TOKEN));
                    let metadataObj;
                    if (mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type) {
                        const meta_data = await this.getMetadata(mintOptions);
                        metadataObj = (await this.dbManager.create({ status: constants_1.Statuses.CREATED, type: constants_1.MetadataTypes.SPECIFIED, token_id: tokenObj.id, meta_data }, constants_1.ObjectTypes.METADATA));
                        await this.dbManager.setMetadata({ object_id: tokenObj.id, metadata_id: metadataObj.id }, constants_1.ObjectTypes.TOKEN);
                        return { callTx, meta_data, metadataObj, tokenObj };
                    }
                    metadataObj = contractObj.metadata;
                    await this.dbManager.setMetadata({ object_id: tokenObj.id, metadata_id: metadataObj.id }, constants_1.ObjectTypes.TOKEN);
                    return { callTx, metadataObj, tokenObj };
            }
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
            const txData = contractInstance.deploy({
                data: deployData.bytecode,
                arguments: deployData.arguments.split('::'),
            });
            const txObj = {
                execute: deployData.execute,
                network: deployData.network,
                contract: contractInstance,
                data: txData.encodeABI(),
                operationType: constants_1.OperationTypes.DEPLOY,
            };
            const deployTx = await this.web3Service.send(txObj);
            const tx = deployData.execute ? deployTx.txReceipt : null;
            const contractObj = (await this.dbManager.create({
                status: deployData.execute ? constants_1.Statuses.PROCESSED : constants_1.Statuses.CREATED,
                address: tx?.contractAddress ?? null,
                deploy_data: deployData,
                deploy_tx: tx,
            }, constants_1.ObjectTypes.CONTRACT));
            if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
                const meta_data = await this.getMetadata(deployData);
                const metadataObj = (await this.dbManager.create({ status: constants_1.Statuses.CREATED, type: constants_1.MetadataTypes.COMMON, meta_data }, constants_1.ObjectTypes.METADATA));
                await this.dbManager.setMetadata({ object_id: contractObj.id, metadata_id: metadataObj.id }, constants_1.ObjectTypes.CONTRACT);
                return { deployTx, meta_data, metadataObj, contractObj };
            }
            return { deployTx, contractObj };
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
                metadata.image = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
                break;
            case constants_1.FileTypes.OBJECT:
                metadata.model_url = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
                break;
        }
        return metadata;
    }
    async getArgs(args, inputs) {
        try {
            const argsArr = args.split('::');
            if (argsArr.length !== inputs.length) {
                throw new microservices_1.RpcException('arguments length is not valid');
            }
            return argsArr.map((value, index) => {
                if (inputs[index].type === 'bytes32[]') {
                    return JSON.parse(value);
                }
                return value;
            });
        }
        catch (error) {
            throw new microservices_1.RpcException('Failed to get arguments: ' + error);
        }
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