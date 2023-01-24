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
exports.DbService = void 0;
const contract_model_1 = require("./models/contract.model");
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const metadata_model_1 = require("./models/metadata.model");
const constants_1 = require("../../common/constants");
const microservices_1 = require("@nestjs/microservices");
const token_model_1 = require("./models/token.model");
const whitelist_model_1 = require("./models/whitelist.model");
const wallet_model_1 = require("./models/wallet.model");
const transaction_model_1 = require("./models/transaction.model");
let DbService = class DbService {
    constructor(contractRepository, tokenRepository, whitelistRepository, metadataRepository, walletsRepository, transactionsRepository) {
        this.contractRepository = contractRepository;
        this.tokenRepository = tokenRepository;
        this.whitelistRepository = whitelistRepository;
        this.metadataRepository = metadataRepository;
        this.walletsRepository = walletsRepository;
        this.transactionsRepository = transactionsRepository;
    }
    async create(objects, objectType) {
        try {
            const repository = this.getRepository(objectType);
            const result = await repository.bulkCreate(objects, { returning: true });
            if (objectType === constants_1.ObjectTypes.TOKEN) {
                objects.forEach(async (token) => {
                    const contract = await this.findOneById(token.contract_id, constants_1.ObjectTypes.CONTRACT);
                    await contract.$add('token', [token.id]);
                });
            }
            return result;
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async delete(params, objectType) {
        try {
            const repository = this.getRepository(objectType);
            return await repository.destroy({ where: { ...params } });
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async findOneById(id, objectType) {
        try {
            const repository = this.getRepository(objectType);
            return await repository.findOne({ where: { id } });
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async findOneByAddress(address, objectType) {
        try {
            const repository = this.getRepository(objectType);
            return await repository.findOne({ where: { address } });
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getAllObjects(objectType, params) {
        try {
            const args = {
                offset: !params || !params?.limit || !params?.page ? null : 0 + (+params?.page - 1) * +params.limit,
                limit: !params || !params?.limit ? null : +params?.limit,
                order: [[params?.order_by || 'createdAt', params?.order || 'DESC']],
                distinct: true,
            };
            if (params.where) {
                args.where = params.where;
            }
            if (params.include_child) {
                args.include = this.getIncludeModels(objectType);
            }
            const repository = this.getRepository(objectType);
            return await repository.findAndCountAll(args);
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getOneObject(objectType, params) {
        try {
            const args = {};
            if (!params) {
                throw new microservices_1.RpcException('params can not be empty');
            }
            if (params.where) {
                args.where = params.where;
            }
            if (params.include_child) {
                args.include = this.getIncludeModels(objectType);
            }
            const repository = this.getRepository(objectType);
            let result = await repository.findOne(args);
            if (objectType === constants_1.ObjectTypes.TOKEN) {
                const metadata = await this.metadataRepository.findOne({
                    where: { id: result.metadata_id },
                });
                result = { ...result, metadata };
            }
            return result;
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async updateStatus(data, objectType) {
        try {
            const repository = this.getRepository(objectType);
            return await repository.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt }, { where: { id: data.object_id } });
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getTokenId(contract_id) {
        try {
            return await this.tokenRepository.count({ where: { contract_id, status: constants_1.Statuses.PROCESSED } });
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async setMetadata(params, objectType) {
        try {
            const metadata = (await this.findOneById(params.metadata_id, constants_1.ObjectTypes.METADATA));
            switch (objectType) {
                case constants_1.ObjectTypes.CONTRACT: {
                    const contract = await this.findOneById(params.object_id, constants_1.ObjectTypes.CONTRACT);
                    await metadata.$set('contract', contract);
                    return true;
                }
                case constants_1.ObjectTypes.TOKEN: {
                    const token = await this.findOneById(params.object_id, constants_1.ObjectTypes.TOKEN);
                    await metadata.$add('token', [token.id]);
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async getMetadata(params) {
        try {
            const metadata = await this.getOneObject(constants_1.ObjectTypes.METADATA, {
                where: { address: params.address, token_id: params.id },
            });
            if (!metadata) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.NOT_FOUND,
                    message: 'Metadata with this token_id not found',
                });
            }
            return metadata.meta_data;
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    async updateMetadata(data) {
        try {
            const metadata = (await this.getOneObject(constants_1.ObjectTypes.METADATA, {
                where: { address: data.address, token_id: data.token_id },
            }));
            if (!metadata) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.NOT_FOUND,
                    message: 'Metadata with this number not found',
                });
            }
            if (metadata.type !== constants_1.MetadataTypes.COMMON) {
                for (const [key, value] of Object.entries(data.meta_data)) {
                    metadata.meta_data[key] = value;
                }
                metadata.changed('meta_data', true);
                await metadata.save();
                return metadata;
            }
            const new_data = {
                status: constants_1.Statuses.CREATED,
                address: metadata.address,
                type: constants_1.MetadataTypes.SPECIFIED,
                meta_data: metadata.meta_data,
                token_id: data.token_id,
            };
            const new_metadata = (await this.create([new_data], constants_1.ObjectTypes.METADATA));
            const token = (await this.getOneObject(constants_1.ObjectTypes.TOKEN, { where: { token_id: data.token_id } }));
            await this.setMetadata({ object_id: token.id, metadata_id: new_metadata[0].id }, constants_1.ObjectTypes.TOKEN);
            return new_metadata[0];
        }
        catch (error) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            });
        }
    }
    getRepository(objectType) {
        switch (objectType) {
            case constants_1.ObjectTypes.CONTRACT:
                return this.contractRepository;
            case constants_1.ObjectTypes.TOKEN:
                return this.tokenRepository;
            case constants_1.ObjectTypes.WHITELIST:
                return this.whitelistRepository;
            case constants_1.ObjectTypes.METADATA:
                return this.metadataRepository;
            case constants_1.ObjectTypes.WALLET:
                return this.walletsRepository;
            case constants_1.ObjectTypes.TRANSACTION:
                return this.transactionsRepository;
        }
    }
    getIncludeModels(objectType) {
        switch (objectType) {
            case constants_1.ObjectTypes.TOKEN:
                return [{ model: metadata_model_1.MetadataModel }];
            case constants_1.ObjectTypes.CONTRACT:
                return [{ model: token_model_1.TokenModel }, { model: metadata_model_1.MetadataModel }, { model: transaction_model_1.TransactionModel }];
            case constants_1.ObjectTypes.WALLET:
                return [{ model: contract_model_1.ContractModel }, { model: token_model_1.TokenModel }, { model: transaction_model_1.TransactionModel }];
        }
    }
    createSpecifiedMetadata(token_id, metadata) {
        return {
            status: constants_1.Statuses.CREATED,
            type: constants_1.MetadataTypes.SPECIFIED,
            meta_data: metadata.meta_data,
            token_id,
        };
    }
};
DbService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(contract_model_1.ContractModel)),
    __param(1, (0, sequelize_1.InjectModel)(token_model_1.TokenModel)),
    __param(2, (0, sequelize_1.InjectModel)(whitelist_model_1.WhitelistModel)),
    __param(3, (0, sequelize_1.InjectModel)(metadata_model_1.MetadataModel)),
    __param(4, (0, sequelize_1.InjectModel)(wallet_model_1.WalletModel)),
    __param(5, (0, sequelize_1.InjectModel)(transaction_model_1.TransactionModel)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], DbService);
exports.DbService = DbService;
//# sourceMappingURL=db.service.js.map