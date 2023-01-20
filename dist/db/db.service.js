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
const constants_1 = require("../common/constants");
const sequelize_2 = require("sequelize");
const response_dto_1 = require("../common/dto/response.dto");
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
        switch (objectType) {
            case constants_1.ObjectTypes.CONTRACT: {
                return await this.contractRepository.bulkCreate(objects, { returning: true });
            }
            case constants_1.ObjectTypes.TOKEN: {
                const tokens = await this.tokenRepository.bulkCreate(objects, { returning: true });
                tokens.forEach(async (token) => {
                    const contract = await this.findOneById(token.contract_id, constants_1.ObjectTypes.CONTRACT);
                    await contract.$add('token', [token.id]);
                });
                return tokens;
            }
            case constants_1.ObjectTypes.WHITELIST: {
                return await this.whitelistRepository.bulkCreate(objects, { returning: true });
            }
            case constants_1.ObjectTypes.METADATA: {
                return await this.metadataRepository.bulkCreate(objects, { returning: true });
            }
            case constants_1.ObjectTypes.WALLET: {
                return await this.walletsRepository.bulkCreate(objects, { returning: true });
            }
            case constants_1.ObjectTypes.TRANSACTION: {
                return await this.transactionsRepository.bulkCreate(objects, { returning: true });
            }
        }
    }
    async delete(params, objectType) {
        switch (objectType) {
            case constants_1.ObjectTypes.METADATA:
                return await this.metadataRepository.destroy({ where: { id: params } });
            case constants_1.ObjectTypes.CONTRACT:
                return await this.contractRepository.destroy({ where: { id: params } });
            case constants_1.ObjectTypes.TOKEN:
                return await this.tokenRepository.destroy({ where: { id: params } });
            case constants_1.ObjectTypes.WHITELIST:
                return await this.whitelistRepository.destroy({ where: { ...params } });
            case constants_1.ObjectTypes.WALLET:
                return await this.walletsRepository.destroy({ where: { id: params } });
            case constants_1.ObjectTypes.TRANSACTION:
                return await this.transactionsRepository.destroy({ where: { id: params } });
        }
    }
    async findOneById(id, objectType) {
        switch (objectType) {
            case constants_1.ObjectTypes.METADATA:
                return await this.metadataRepository.findOne({ where: { id } });
            case constants_1.ObjectTypes.CONTRACT:
                return await this.contractRepository.findOne({ where: { [sequelize_2.Op.or]: [{ id }, { address: id }] } });
            case constants_1.ObjectTypes.TOKEN:
                return await this.tokenRepository.findOne({ where: { [sequelize_2.Op.or]: [{ id }, { address: id }] } });
            case constants_1.ObjectTypes.WHITELIST:
                return await this.whitelistRepository.findOne({ where: { [sequelize_2.Op.or]: [{ id }, { address: id }] } });
            case constants_1.ObjectTypes.WALLET:
                return await this.walletsRepository.findOne({ where: { address: id } });
            case constants_1.ObjectTypes.TRANSACTION:
                return await this.transactionsRepository.findOne({ where: { [sequelize_2.Op.or]: [{ id }, { address: id }] } });
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
            let allObjects;
            switch (objectType) {
                case constants_1.ObjectTypes.TOKEN:
                    if (params.include_child) {
                        args.include = [
                            {
                                model: metadata_model_1.MetadataModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                        ];
                    }
                    args.attributes = { exclude: ['contract_id', 'updatedAt'] };
                    allObjects = await this.tokenRepository.findAndCountAll(args);
                    break;
                case constants_1.ObjectTypes.CONTRACT:
                    if (params.include_child) {
                        args.include = [
                            {
                                model: token_model_1.TokenModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                            {
                                model: metadata_model_1.MetadataModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                            {
                                model: transaction_model_1.TransactionModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                        ];
                    }
                    allObjects = await this.contractRepository.findAndCountAll(args);
                    break;
                case constants_1.ObjectTypes.WHITELIST:
                    allObjects = await this.whitelistRepository.findAndCountAll(args);
                    break;
                case constants_1.ObjectTypes.WALLET:
                    if (params.include_child) {
                        args.include = [
                            {
                                model: contract_model_1.ContractModel,
                                attributes: { exclude: ['updatedAt'] },
                            },
                            {
                                model: token_model_1.TokenModel,
                                attributes: { exclude: ['updatedAt'] },
                            },
                            {
                                model: transaction_model_1.TransactionModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                        ];
                    }
                    allObjects = await this.walletsRepository.findAndCountAll(args);
                    break;
                case constants_1.ObjectTypes.TRANSACTION:
                    allObjects = await this.transactionsRepository.findAndCountAll(args);
                    break;
            }
            return allObjects;
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async getOneObject(objectType, params) {
        try {
            if (!params) {
                throw new microservices_1.RpcException('params can not be empty');
            }
            if (!params.id && !params.address && !params.token_id) {
                throw new microservices_1.RpcException('id or address or token_id is required');
            }
            const args = {
                attributes: { exclude: ['updatedAt'] },
                where: params.id
                    ? { id: params.id }
                    : params.address
                        ? { address: params.address }
                        : params.token_id
                            ? { token_id: params.token_id }
                            : params.contract_id
                                ? { contract_id: params.contract_id }
                                : params.team_id
                                    ? { team_id: params.team_id }
                                    : {},
            };
            let result;
            switch (objectType) {
                case constants_1.ObjectTypes.TOKEN:
                    args.attributes = { exclude: ['updatedAt'] };
                    result = await this.tokenRepository.findOne(args);
                    if (params.include_child) {
                        const metadata = await this.metadataRepository.findOne({
                            where: { id: result.metadata_id },
                        });
                        result = { ...result, metadata };
                    }
                    break;
                case constants_1.ObjectTypes.CONTRACT:
                    if (params.include_child) {
                        args.include = [
                            {
                                model: token_model_1.TokenModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                            {
                                model: metadata_model_1.MetadataModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                            {
                                model: transaction_model_1.TransactionModel,
                                attributes: { exclude: ['contract_id', 'updatedAt'] },
                            },
                        ];
                    }
                    result = await this.contractRepository.findOne(args);
                    break;
                case constants_1.ObjectTypes.WHITELIST:
                    result = await this.whitelistRepository.findOne(args);
                    break;
                case constants_1.ObjectTypes.METADATA:
                    result = await this.metadataRepository.findOne(args);
                    break;
                case constants_1.ObjectTypes.WALLET:
                    if (params.include_child) {
                        args.include = [
                            {
                                model: contract_model_1.ContractModel,
                                attributes: { exclude: ['updatedAt'] },
                            },
                            {
                                model: token_model_1.TokenModel,
                                attributes: { exclude: ['updatedAt'] },
                            },
                        ];
                    }
                    result = await this.walletsRepository.findOne(args);
                    break;
                case constants_1.ObjectTypes.TRANSACTION:
                    result = await this.transactionsRepository.findOne(args);
                    break;
            }
            return result;
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async updateStatus(data) {
        const id = data.object_id;
        switch (data.object_type) {
            case constants_1.ObjectTypes.CONTRACT:
                const contract = await this.contractRepository.findOne({ where: { id } });
                await contract.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });
                return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'status updated', null);
            case constants_1.ObjectTypes.TOKEN:
                const token = await this.tokenRepository.findOne({ where: { id } });
                await token.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });
                return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'status updated', null);
            case constants_1.ObjectTypes.WHITELIST:
                const whitelist = await this.whitelistRepository.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt }, { where: { id } });
                return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'status updated', null);
            case constants_1.ObjectTypes.TRANSACTION:
                const tx = await this.transactionsRepository.findOne({ where: { id } });
                await tx.update({ status: data.status, tx_receipt: data.tx_receipt });
                return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'status updated', null);
        }
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'status not updated', null);
    }
    async getTokenId(contract_id) {
        return await this.tokenRepository.count({ where: { contract_id, status: constants_1.Statuses.PROCESSED } });
    }
    async setMetadata(params, objectType) {
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
    async getMetadata(id) {
        const token = await this.getOneObject(constants_1.ObjectTypes.TOKEN, { token_id: id, include_child: true });
        if (!token) {
            throw new microservices_1.RpcException('Token with this token_id not found');
        }
        return token.metadata.meta_data;
    }
    async updateMetadata(data) {
        try {
            const token = (await this.getOneObject(constants_1.ObjectTypes.TOKEN, {
                token_id: data.id,
                include_child: true,
            }));
            if (!token) {
                throw new microservices_1.RpcException('Token with this number not found');
            }
            const metadata = token?.metadata?.type === constants_1.MetadataTypes.COMMON
                ? (await this.create([this.createSpecifiedMetadata(token, token.metadata)], constants_1.ObjectTypes.METADATA))[0]
                : token.metadata;
            for (const [key, value] of Object.entries(data.meta_data)) {
                metadata.meta_data[key] = value;
            }
            metadata.changed('meta_data', true);
            await metadata.save();
            return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'data updated', null);
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    createSpecifiedMetadata(token, metadata) {
        return {
            status: constants_1.Statuses.CREATED,
            type: constants_1.MetadataTypes.SPECIFIED,
            token_id: token.id,
            meta_data: metadata.meta_data,
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