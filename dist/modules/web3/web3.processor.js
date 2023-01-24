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
exports.Web3Processor = void 0;
const config_1 = require("@nestjs/config");
const ipfs_service_1 = require("../ipfs/ipfs.service");
const bull_1 = require("@nestjs/bull");
const microservices_1 = require("@nestjs/microservices");
const web3_service_1 = require("./web3.service");
const constants_1 = require("../../common/constants");
const db_service_1 = require("../db/db.service");
const common_1 = require("@nestjs/common");
let Web3Processor = class Web3Processor {
    constructor(configService, dbManager, ipfsManger, web3Service) {
        this.configService = configService;
        this.dbManager = dbManager;
        this.ipfsManger = ipfsManger;
        this.web3Service = web3Service;
    }
    async createWallet(job) {
        try {
            const data = job.data;
            const wallet = await this.web3Service.newWallet();
            const walletObj = (await this.dbManager.create([{ team_id: data.team_id, ...wallet }], constants_1.ObjectTypes.WALLET));
            return { id: walletObj[0].id, address: wallet.address };
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async deploy(job) {
        try {
            const deployData = job.data;
            const { w3, wallet, keystore } = await this.getAccount(deployData);
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
                keystore: keystore,
            };
            const tx = await this.web3Service.processTx(txOptions);
            await wallet.$add('contract', contractObj[0]);
            await wallet.$add('transaction', tx.txObj);
            if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
                const meta_data = await this.getMetadata(deployData);
                const metadataObj = (await this.dbManager.create([{ status: constants_1.Statuses.CREATED, type: constants_1.MetadataTypes.COMMON, address: tx.txObj.tx_receipt.contractAddress, meta_data }], constants_1.ObjectTypes.METADATA));
                await this.dbManager.setMetadata({ object_id: contractObj[0].id, metadata_id: metadataObj[0].id }, constants_1.ObjectTypes.CONTRACT);
            }
            return { tx, contract: contractObj[0] };
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async mint(job) {
        try {
            const callData = job.data;
            const { w3, keystore } = await this.getAccount(callData);
            const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);
            const mintOptions = callData?.operation_options;
            if (!mintOptions) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'operation specific options missed',
                });
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
            let metadataObj;
            if (mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type) {
                const meta_data = await this.getMetadata(mintOptions);
                metadataObj = (await this.dbManager.create([{ status: constants_1.Statuses.CREATED, type: constants_1.MetadataTypes.SPECIFIED, address: contractObj.address, meta_data }], constants_1.ObjectTypes.METADATA));
                await this.dbManager.setMetadata({ object_id: tokenObj[0].id, metadata_id: metadataObj[0].id }, constants_1.ObjectTypes.TOKEN);
            }
            else {
                if (!contractObj.metadata) {
                    throw new microservices_1.RpcException({
                        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'contract metadata missed',
                    });
                }
                metadataObj = [contractObj.metadata];
                await this.dbManager.setMetadata({ object_id: tokenObj[0].id, metadata_id: metadataObj[0].id }, constants_1.ObjectTypes.TOKEN);
            }
            const callArgs = this.getArgs(callData.arguments.toString(), abiObj.inputs);
            const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
            const txOptions = {
                execute: callData.execute,
                operationType: constants_1.OperationTypes.MINT,
                network: callData.network,
                contract: contractInst,
                contractObj: contractObj,
                tokenObj: tokenObj[0],
                metadataObj: metadataObj[0],
                from_address: callData.from_address,
                data: txData,
                keystore: keystore,
            };
            const tx = await this.web3Service.processTx(txOptions);
            return { tx, token: tokenObj[0] };
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async whitelist(job) {
        try {
            const callData = job.data;
            const { w3, keystore } = await this.getAccount(callData);
            const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);
            const whitelistOptions = callData.operation_options;
            if (!whitelistOptions) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'operation specific options missed',
                });
            }
            let root;
            let proof;
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
                            throw new microservices_1.RpcException({
                                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                                message: 'All addresses already exist in whitelist',
                            });
                        }
                    }
                    whitelistObj = (await this.dbManager.create(addresses, constants_1.ObjectTypes.WHITELIST));
                    if (whitelistObj.length === 0) {
                        throw new microservices_1.RpcException({
                            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                            message: 'Failed to create whitelist object',
                        });
                    }
                    const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, {
                        where: { contract_id: callData.contract_id },
                    })).rows;
                    root = await this.web3Service.getMerkleRoot(whitelist);
                    proof = await Promise.all(addresses.map(async (x) => {
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
                        throw new microservices_1.RpcException({
                            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                            message: 'Failed to remove whitelist object',
                        });
                    }
                    const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, {
                        where: { contract_id: callData.contract_id },
                    })).rows;
                    root = await this.web3Service.getMerkleRoot(whitelist);
                    break;
                }
            }
            const callArgs = [root];
            const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
            const txOptions = {
                execute: callData.execute,
                operationType: operationType,
                network: callData.network,
                contract: contractInst,
                contractObj: contractObj,
                from_address: callData.from_address,
                data: txData,
                keystore: keystore,
            };
            if (callData.operation_type === constants_1.OperationTypes.WHITELIST_ADD) {
                txOptions.whitelistObj = whitelistObj;
            }
            const tx = await this.web3Service.processTx(txOptions);
            return { root, proof, tx };
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async commonCall(job) {
        try {
            const callData = job.data;
            const { w3, keystore } = await this.getAccount(callData);
            const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);
            const callArgs = this.getArgs(callData.arguments, abiObj.inputs);
            if (callData.operation_type === constants_1.OperationTypes.READ_CONTRACT) {
                const callResult = await contractInst.methods[callData.method_name](...callArgs).call();
                return { [callData.method_name]: callResult };
            }
            const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
            const txOptions = {
                execute: callData.execute,
                operationType: constants_1.OperationTypes.COMMON,
                network: callData.network,
                contract: contractInst,
                contractObj: contractObj,
                from_address: callData.from_address,
                data: txData,
                keystore: keystore,
            };
            return await this.web3Service.processTx(txOptions);
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getMerkleProof(job) {
        try {
            const data = job.data;
            const whitelist = (await this.dbManager.getAllObjects(constants_1.ObjectTypes.WHITELIST, { where: { contract_id: data.contract_id } })).rows;
            const root = await this.web3Service.getMerkleRoot(whitelist);
            const proof = await this.web3Service.getMerkleProof(whitelist, data.address);
            return { root, proof };
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getAccount(data) {
        const w3 = this.web3Service.getWeb3(data.network);
        const wallet = (await this.dbManager.findOneByAddress(data.from_address, constants_1.ObjectTypes.WALLET));
        if (data.execute && !wallet) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'team wallet by "from_address" not found',
            });
        }
        const keystore = data.execute ? wallet.keystore : null;
        return { w3, wallet, keystore };
    }
    async getContract(data, w3) {
        const contractObj = (await this.dbManager.getOneObject(constants_1.ObjectTypes.CONTRACT, {
            where: { id: data.contract_id },
            include_child: true,
        }));
        if (!contractObj) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'contract not found',
            });
        }
        const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi, contractObj.address);
        const abiObj = contractObj.deploy_data.abi.find((x) => x.name === data.method_name && x.type === 'function');
        if (!abiObj) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'method not found',
            });
        }
        return { contractObj, contractInst, abiObj };
    }
    getArgs(args, inputs) {
        try {
            if (args === undefined || args === null || args === '') {
                return [];
            }
            const argsArr = args.toString().split('::');
            if (argsArr.length !== inputs.length) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'arguments length is not valid',
                });
            }
            if (argsArr.length !== 0) {
                return argsArr.map((value, index) => {
                    if (inputs[index].type === 'bytes32[]') {
                        return JSON.parse(value);
                    }
                    return value;
                });
            }
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
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
};
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.CREATE_WALLET),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "createWallet", null);
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.DEPLOY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "deploy", null);
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.MINT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "mint", null);
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.WHITELIST),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "whitelist", null);
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.COMMON),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "commonCall", null);
__decorate([
    (0, bull_1.Process)(constants_1.ProcessTypes.MERKLE_PROOF),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Web3Processor.prototype, "getMerkleProof", null);
Web3Processor = __decorate([
    (0, bull_1.Processor)('web3'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        db_service_1.DbService,
        ipfs_service_1.IpfsManagerService,
        web3_service_1.Web3Service])
], Web3Processor);
exports.Web3Processor = Web3Processor;
//# sourceMappingURL=web3.processor.js.map