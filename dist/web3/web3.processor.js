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
const ipfs_service_1 = require("../ipfs/ipfs.service");
const bull_1 = require("@nestjs/bull");
const microservices_1 = require("@nestjs/microservices");
const web3_service_1 = require("./web3.service");
const constants_1 = require("../common/constants");
const db_service_1 = require("../db/db.service");
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
            const wallet = (await this.dbManager.findOneById(callData.from_address, constants_1.ObjectTypes.WALLET));
            if (callData.execute && !wallet) {
                throw new microservices_1.RpcException('team wallet by "from_address" not found');
            }
            const contractObj = (await this.dbManager.findOneById(callData.contract_id, constants_1.ObjectTypes.CONTRACT));
            if (!contractObj) {
                throw new microservices_1.RpcException('contract not found');
            }
            const whitelistOptions = callData.operation_options;
            if (!whitelistOptions) {
                throw new microservices_1.RpcException('operation specific options missed');
            }
            let merkleRoot;
            let merkleProof;
            let whitelistObj;
            let operationType;
            switch (callData.operation_type) {
                case constants_1.OperationTypes.WHITELIST_ADD: {
                    operationType = constants_1.OperationTypes.WHITELIST_ADD;
                    const addresses = whitelistOptions.addresses.split(',').map((address) => {
                        return {
                            status: constants_1.Statuses.CREATED,
                            contract_id: contractObj.id,
                            address,
                        };
                    });
                    const addressArr = addresses.map((x) => x.address);
                    const contractIdArr = addresses.map((x) => x.contract_id);
                    const exist = await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, {
                        where: { address: addressArr, contract_id: contractIdArr },
                    });
                    if (exist.count) {
                        exist.rows.forEach((row) => {
                            const index = addresses.findIndex((x) => x.address === row.address);
                            if (index > -1) {
                                addresses.splice(index, 1);
                            }
                        });
                        if (addresses.length === 0) {
                            throw new microservices_1.RpcException('All addresses already exist in whitelist');
                        }
                    }
                    whitelistObj = (await this.dbManager.create(addresses, constants_1.ObjectTypes.WHITELIST));
                    if (whitelistObj.length === 0) {
                        throw new microservices_1.RpcException('Failed to create whitelist object');
                    }
                    const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, {
                        contract_id: callData.contract_id,
                    })).rows;
                    merkleRoot = await this.web3Service.getMerkleRoot(whitelist);
                    merkleProof = await Promise.all(addresses.map(async (x) => {
                        const proof = await this.web3Service.getMerkleProof(whitelist, x.address);
                        return {
                            address: x.address,
                            proof,
                        };
                    }));
                    break;
                }
                case constants_1.OperationTypes.WHITELIST_REMOVE: {
                    operationType = constants_1.OperationTypes.WHITELIST_REMOVE;
                    const addresses = whitelistOptions.addresses.split(',').map((address) => {
                        return {
                            status: constants_1.Statuses.DELETED,
                            contract_id: contractObj.id,
                            address,
                        };
                    });
                    const addressArr = addresses.map((x) => x.address);
                    const contractIdArr = addresses.map((x) => x.contract_id);
                    const deleted = await this.dbManager.delete({ address: addressArr, contract_id: contractIdArr }, constants_1.ObjectTypes.WHITELIST);
                    if (deleted === 0) {
                        throw new microservices_1.RpcException('Failed to remove whitelist object');
                    }
                    const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, {
                        contract_id: callData.contract_id,
                    })).rows;
                    merkleRoot = await this.web3Service.getMerkleRoot(whitelist);
                    break;
                }
            }
            const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi, contractObj.address);
            const abiObj = contractObj.deploy_data.abi.find((x) => x.name === callData.method_name && x.type === 'function');
            if (!abiObj) {
                throw new microservices_1.RpcException('method not found');
            }
            const callArgs = [merkleRoot];
            const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
            const txOptions = {
                execute: callData.execute,
                network: callData.network,
                contract: contractInst,
                from_address: callData.from_address,
                data: txData,
                keystore: callData.execute ? wallet.keystore : null,
                operationType,
                contractObj,
            };
            if (callData.operation_type === constants_1.OperationTypes.WHITELIST_ADD) {
                txOptions.whitelistObj = whitelistObj;
            }
            const tx = await this.web3Service.send(txOptions);
            return { merkleRoot, merkleProof, tx };
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
            const walletObj = (await this.dbManager.findOneById(callData.from_address, constants_1.ObjectTypes.WALLET));
            if (callData.execute && !walletObj) {
                throw new microservices_1.RpcException('team wallet by "from_address" not found');
            }
            const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
            const txOptions = {
                execute: callData.execute,
                network: callData.network,
                contract: contractInst,
                from_address: callData.from_address,
                data: txData,
                operationType: constants_1.OperationTypes.COMMON,
                keystore: callData.execute ? walletObj.keystore : null,
                contractObj,
            };
            const mintOptions = callData?.operation_options;
            if (callData.operation_type === constants_1.OperationTypes.MINT) {
                txOptions.operationType = constants_1.OperationTypes.MINT;
                if (!mintOptions) {
                    throw new microservices_1.RpcException('operation specific options missed');
                }
                const tokenObj = (await this.dbManager.create([
                    {
                        status: constants_1.Statuses.CREATED,
                        contract_id: contractObj.id,
                        address: contractObj.address,
                        nft_number: mintOptions.nft_number,
                        mint_data: mintOptions,
                    },
                ], constants_1.ObjectTypes.TOKEN));
                txOptions.tokenObj = tokenObj[0];
                const tx = await this.web3Service.send(txOptions);
                let metadataObj;
                if (mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type) {
                    const meta_data = await this.getMetadata(mintOptions);
                    metadataObj = (await this.dbManager.create([{ status: constants_1.Statuses.CREATED, type: constants_1.MetadataTypes.SPECIFIED, token_id: tokenObj[0].id, meta_data }], constants_1.ObjectTypes.METADATA));
                    await this.dbManager.setMetadata({ object_id: tokenObj[0].id, metadata_id: metadataObj[0].id }, constants_1.ObjectTypes.TOKEN);
                }
                else {
                    metadataObj = [contractObj.metadata];
                    await this.dbManager.setMetadata({ object_id: tokenObj[0].id, metadata_id: metadataObj[0].id }, constants_1.ObjectTypes.TOKEN);
                }
                return tx;
            }
            return await this.web3Service.send(txOptions);
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async deploy(job) {
        try {
            const deployData = job.data;
            const walletObj = (await this.dbManager.findOneById(deployData.from_address, constants_1.ObjectTypes.WALLET));
            if (!walletObj) {
                throw new microservices_1.RpcException('team wallet by "from_address" not found');
            }
            const w3 = deployData.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
            const contractInstance = new w3.eth.Contract(deployData.abi);
            const contractObj = (await this.dbManager.create([
                {
                    status: constants_1.Statuses.CREATED,
                    deploy_data: deployData,
                },
            ], constants_1.ObjectTypes.CONTRACT));
            const txData = contractInstance.deploy({
                data: deployData.bytecode,
                arguments: deployData.arguments.split('::'),
            });
            const txOptions = {
                execute: deployData.execute,
                network: deployData.network,
                contract: contractInstance,
                contractObj: contractObj[0],
                from_address: deployData.from_address,
                data: txData.encodeABI(),
                operationType: constants_1.OperationTypes.DEPLOY,
                keystore: walletObj.keystore,
            };
            const tx = await this.web3Service.send(txOptions);
            await walletObj.$add('contract', contractObj[0]);
            await walletObj.$add('transaction', tx.txObj);
            if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
                const meta_data = await this.getMetadata(deployData);
                const metadataObj = (await this.dbManager.create([{ status: constants_1.Statuses.CREATED, type: constants_1.MetadataTypes.COMMON, meta_data }], constants_1.ObjectTypes.METADATA));
                await this.dbManager.setMetadata({ object_id: contractObj[0].id, metadata_id: metadataObj[0].id }, constants_1.ObjectTypes.CONTRACT);
            }
            return tx;
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
        db_service_1.DbService,
        ipfs_service_1.IpfsManagerService,
        web3_service_1.Web3Service])
], Web3Processor);
exports.Web3Processor = Web3Processor;
//# sourceMappingURL=web3.processor.js.map