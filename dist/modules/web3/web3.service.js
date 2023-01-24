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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Service = void 0;
const U = __importStar(require("web3-utils"));
const web3_1 = __importDefault(require("web3"));
const merkletreejs_1 = __importDefault(require("merkletreejs"));
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const jobResult_dto_1 = require("../../common/dto/jobResult.dto");
const constants_1 = require("../../common/constants");
const rxjs_1 = require("rxjs");
const microservices_1 = require("@nestjs/microservices");
const uuid_1 = require("uuid");
const db_service_1 = require("../db/db.service");
const ethUtils = __importStar(require("ethereumjs-util"));
let Web3Service = class Web3Service {
    constructor(web3Queue, configService, dbService) {
        this.web3Queue = web3Queue;
        this.configService = configService;
        this.dbService = dbService;
        this.ethereum = new web3_1.default(new web3_1.default.providers.HttpProvider(configService.get('ETHEREUM_HOST')));
        this.polygon = new web3_1.default(new web3_1.default.providers.HttpProvider(configService.get('POLYGON_HOST')));
        this.local = new web3_1.default(new web3_1.default.providers.HttpProvider(configService.get('LOCAL_HOST')));
    }
    async getJob(data) {
        const job = await this.web3Queue.getJob(data.jobId);
        if (!job) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.NOT_FOUND,
                message: 'Job not found',
            });
        }
        return job;
    }
    async processJob(data, processType) {
        try {
            const jobId = (0, uuid_1.v4)();
            const job$ = new rxjs_1.Observable((observer) => {
                const active = (job) => {
                    checkSubscriptions();
                    if (job.id === jobId) {
                        observer.next(new jobResult_dto_1.JobResultDto(job.id, 'active', job.data));
                    }
                };
                const completed = (job, result) => {
                    checkSubscriptions();
                    if (job.id === jobId) {
                        observer.next(new jobResult_dto_1.JobResultDto(job.id, 'completed', result));
                        observer.complete();
                        removeAllListeners();
                    }
                };
                const failed = (job, error) => {
                    checkSubscriptions();
                    if (job.id === jobId) {
                        observer.next(new jobResult_dto_1.JobResultDto(job.id, 'failed', error.message));
                        observer.complete();
                        removeAllListeners();
                    }
                };
                const checkSubscriptions = () => {
                    if (observer.closed) {
                        removeAllListeners();
                    }
                };
                const removeAllListeners = () => {
                    this.web3Queue.removeListener('active', active);
                    this.web3Queue.removeListener('completed', completed);
                    this.web3Queue.removeListener('failed', failed);
                };
                this.web3Queue.addListener('active', active);
                this.web3Queue.addListener('completed', completed);
                this.web3Queue.addListener('failed', failed);
            });
            await this.web3Queue.add(processType, data, { jobId, delay: 1000 });
            return job$;
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async processTx(txOptions) {
        try {
            const w3 = this.getWeb3(txOptions.network);
            const contractObj = txOptions.contractObj;
            const contract = txOptions.contract;
            const tx = {
                nonce: await w3.eth.getTransactionCount(txOptions.from_address),
                maxPriorityFeePerGas: await w3.eth.getGasPrice(),
                from: txOptions.from_address,
                data: txOptions.data,
                value: 0,
            };
            if (txOptions.operationType != constants_1.OperationTypes.DEPLOY) {
                tx.to = contract.options.address;
                tx.gas = await w3.eth.estimateGas({
                    from: txOptions.from_address,
                    to: contract.options.address,
                    data: txOptions.data,
                    value: 0,
                });
            }
            else {
                tx.gas = await w3.eth.estimateGas({
                    from: txOptions.from_address,
                    data: txOptions.data,
                    value: 0,
                });
            }
            const comission = (+tx.gas * +tx.maxPriorityFeePerGas).toString();
            const balance = await w3.eth.getBalance(txOptions.from_address);
            if (+balance < +comission) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Not enough balance',
                });
            }
            if (!txOptions.execute) {
                return { tx, comission, balance };
            }
            const txObjData = {
                network: txOptions.network,
                status: constants_1.Statuses.CREATED,
                address: txOptions.from_address,
                tx_payload: tx,
            };
            const txObj = (await this.dbService.create([txObjData], constants_1.ObjectTypes.TRANSACTION));
            await contractObj.$add('transaction', txObj[0]);
            const account = w3.eth.accounts.decrypt(txOptions.keystore, this.configService.get('DEFAULT_PASSWORD'));
            const signed = await account.signTransaction(tx);
            const receipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);
            if (receipt.status) {
                txObj[0].status = constants_1.Statuses.PROCESSED;
                txObj[0].tx_receipt = receipt;
                await txObj[0].save();
                if (txOptions.operationType === constants_1.OperationTypes.DEPLOY) {
                    contractObj.status = constants_1.Statuses.PROCESSED;
                    contractObj.address = receipt.contractAddress;
                    await contractObj.save();
                }
                if (txOptions.operationType === constants_1.OperationTypes.MINT) {
                    const tokenObj = txOptions.tokenObj;
                    const metadataObj = txOptions.metadataObj;
                    tokenObj.status = constants_1.Statuses.PROCESSED;
                    tokenObj.token_id = await this.dbService.getTokenId(contractObj.id);
                    tokenObj.address = receipt.contractAddress;
                    tokenObj.tx_hash = receipt.transactionHash;
                    tokenObj.tx_receipt = receipt;
                    await tokenObj.save();
                    metadataObj.token_id = tokenObj.token_id;
                    await metadataObj.save();
                }
                if (txOptions.operationType === constants_1.OperationTypes.WHITELIST_ADD) {
                    const ids = txOptions.whitelistObj.map((obj) => obj.id);
                    await this.dbService.updateStatus({
                        object_id: ids,
                        status: constants_1.Statuses.PROCESSED,
                        tx_hash: receipt.transactionHash,
                        tx_receipt: receipt,
                    }, constants_1.ObjectTypes.WHITELIST);
                }
            }
            else {
                txObj[0].status = constants_1.Statuses.FAILED;
                await txObj[0].save();
            }
            return { tx, comission, balance, txObj: txObj[0] };
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getTxReceipt(txHash, network) {
        try {
            const w3 = this.getWeb3(network);
            return await w3.eth.getTransactionReceipt(txHash);
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getMerkleRoot(leaves) {
        try {
            const hashLeaves = leaves.map((x) => U.keccak256(x.address));
            const tree = new merkletreejs_1.default(hashLeaves, U.keccak256, { sortPairs: true });
            return tree.getHexRoot();
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getMerkleProof(leaves, address) {
        try {
            const hashLeaves = leaves.map((x) => U.keccak256(x.address));
            const tree = new merkletreejs_1.default(hashLeaves, U.keccak256, { sortPairs: true });
            return tree.getHexProof(U.keccak256(address));
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async newWallet() {
        try {
            const password = await this.configService.get('DEFAULT_PASSWORD');
            const account = this.ethereum.eth.accounts.create();
            const address = account.address;
            const keystore = account.encrypt(password);
            return { address, keystore };
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    getWeb3(network) {
        switch (network) {
            case constants_1.Networks.ETHEREUM:
                return this.ethereum;
            case constants_1.Networks.POLYGON:
                return this.polygon;
            default:
                return this.local;
        }
    }
    async predictContractAddress(data) {
        const w3 = this.getWeb3(data.network);
        var nonce = await w3.eth.getTransactionCount(data.owner);
        return ethUtils.bufferToHex(ethUtils.generateAddress(Buffer.from(data.owner), Buffer.from(nonce.toString())));
    }
};
Web3Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)(constants_1.WEB3_QUEUE)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        db_service_1.DbService])
], Web3Service);
exports.Web3Service = Web3Service;
//# sourceMappingURL=web3.service.js.map