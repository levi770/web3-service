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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Service = void 0;
const web3_1 = __importDefault(require("web3"));
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const jobResult_dto_1 = require("../common/dto/jobResult.dto");
const constants_1 = require("../common/constants");
const rxjs_1 = require("rxjs");
const response_dto_1 = require("../common/dto/response.dto");
const microservices_1 = require("@nestjs/microservices");
const uuid_1 = require("uuid");
let Web3Service = class Web3Service {
    constructor(web3Queue, configService) {
        this.web3Queue = web3Queue;
        this.configService = configService;
        this.ethereum = new web3_1.default(new web3_1.default.providers.HttpProvider(configService.get('ETHEREUM_HOST')));
        this.polygon = new web3_1.default(new web3_1.default.providers.HttpProvider(configService.get('POLYGON_HOST')));
    }
    async getJob(data) {
        const job = await this.web3Queue.getJob(data.jobId);
        if (!job) {
            throw new microservices_1.RpcException('Job not found');
        }
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, null, job);
    }
    async process(data, processType) {
        const jobId = (0, uuid_1.v4)();
        const job$ = new rxjs_1.Observable((observer) => {
            const active = (job, jobPromise) => {
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
            this.web3Queue.addListener('active', active);
            this.web3Queue.addListener('completed', completed);
            this.web3Queue.addListener('failed', failed);
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
        });
        await this.web3Queue.add(processType, data, { jobId, delay: 1000 });
        return job$;
    }
    async send(txObj) {
        try {
            const w3 = txObj.network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
            const account = w3.eth.accounts.privateKeyToAccount(this.configService.get('PRIV_KEY'));
            const to = txObj.operationType === constants_1.OperationTypes.DEPLOY ? null : txObj.contract.options.address;
            const tx = {
                nonce: await w3.eth.getTransactionCount(account.address),
                maxPriorityFeePerGas: await w3.eth.getGasPrice(),
                gas: await w3.eth.estimateGas({
                    from: account.address,
                    data: txObj.data,
                    value: 0,
                    to,
                }),
                from: account.address,
                data: txObj.data,
                value: 0,
                to,
            };
            const comission = (+tx.gas * +tx.maxPriorityFeePerGas).toString();
            const balance = await w3.eth.getBalance(account.address);
            if (+balance < +comission) {
                throw new microservices_1.RpcException('Not enough balance');
            }
            if (!txObj.execute) {
                return { tx, comission, balance };
            }
            const signed = await account.signTransaction(tx);
            const txReceipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);
            return { tx, comission, balance, txReceipt };
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async getTxReceipt(txHash, network) {
        const w3 = network === constants_1.Networks.ETHEREUM ? this.ethereum : this.polygon;
        return await w3.eth.getTransactionReceipt(txHash);
    }
};
Web3Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('web3')),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], Web3Service);
exports.Web3Service = Web3Service;
//# sourceMappingURL=web3.service.js.map