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
exports.DbManagerService = void 0;
const sequelize_1 = require("sequelize");
const common_1 = require("@nestjs/common");
const sequelize_2 = require("@nestjs/sequelize");
const constants_1 = require("../common/constants");
const response_dto_1 = require("../common/dto/response.dto");
const contract_model_1 = require("./models/contract.model");
const token_model_1 = require("./models/token.model");
const microservices_1 = require("@nestjs/microservices");
const whitelist_model_1 = require("./models/whitelist.model");
let DbManagerService = class DbManagerService {
    constructor(contractRepository, tokenRepository, whitelistRepository) {
        this.contractRepository = contractRepository;
        this.tokenRepository = tokenRepository;
        this.whitelistRepository = whitelistRepository;
    }
    async create(params, objectType) {
        switch (objectType) {
            case constants_1.ObjectTypes.CONTRACT:
                return await this.contractRepository.create({ ...params });
            case constants_1.ObjectTypes.TOKEN:
                const contract = await this.findById(params.contract_id, constants_1.ObjectTypes.CONTRACT);
                const token = await this.tokenRepository.create({ ...params });
                await contract.$add('token', [token.id]);
                return token;
            case constants_1.ObjectTypes.WHITELIST:
                return await this.whitelistRepository.create({ ...params });
        }
    }
    async delete(params, objectType) {
        switch (objectType) {
            case constants_1.ObjectTypes.CONTRACT:
                return await this.contractRepository.destroy({ where: { id: params } });
            case constants_1.ObjectTypes.TOKEN:
                return await this.tokenRepository.destroy({ where: { id: params } });
            case constants_1.ObjectTypes.WHITELIST:
                return await this.whitelistRepository.destroy({ where: { address: params.address } });
        }
    }
    async findById(id, objectType) {
        switch (objectType) {
            case constants_1.ObjectTypes.CONTRACT:
                return await this.contractRepository.findOne({ where: { [sequelize_1.Op.or]: [{ id }, { address: id }] } });
            case constants_1.ObjectTypes.TOKEN:
                return await this.tokenRepository.findOne({ where: { [sequelize_1.Op.or]: [{ id }, { address: id }] } });
            case constants_1.ObjectTypes.WHITELIST:
                return await this.whitelistRepository.findOne({ where: { [sequelize_1.Op.or]: [{ id }, { address: id }] } });
        }
    }
    async getAllObjects(objectType, params) {
        try {
            const args = {
                attributes: { exclude: ['updatedAt'] },
                offset: !params || !params?.limit || !params?.page ? null : 0 + (+params?.page - 1) * +params.limit,
                limit: !params || !params?.limit ? null : +params?.limit,
                order: [[params?.order_by || 'createdAt', params?.order || 'DESC']],
            };
            let allObjects;
            switch (objectType) {
                case constants_1.ObjectTypes.TOKEN:
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
                        ];
                    }
                    allObjects = await this.contractRepository.findAndCountAll(args);
                    break;
                case constants_1.ObjectTypes.WHITELIST:
                    allObjects = await this.whitelistRepository.findAndCountAll(args);
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
            if (!params.id && !params.address) {
                throw new microservices_1.RpcException('id or address is required');
            }
            let args = {
                attributes: { exclude: ['updatedAt'] },
                where: params.id
                    ? { id: params.id }
                    : params.address
                        ? { address: params.address }
                        : { contract_id: params.contract_id },
            };
            let result;
            switch (objectType) {
                case constants_1.ObjectTypes.TOKEN:
                    args.attributes = { exclude: ['updatedAt'] };
                    result = await this.tokenRepository.findOne(args);
                    break;
                case constants_1.ObjectTypes.CONTRACT:
                    if (params.include_child) {
                        args.include = [
                            {
                                model: token_model_1.TokenModel,
                                attributes: { exclude: ['updatedAt'] },
                            },
                        ];
                    }
                    result = await this.contractRepository.findOne(args);
                    break;
                case constants_1.ObjectTypes.WHITELIST:
                    result = await this.whitelistRepository.findOne(args);
                    break;
            }
            return result;
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
    async getMetadata(id) {
        const token = await this.tokenRepository.findOne({ where: { nft_number: id } });
        if (!token) {
            throw new common_1.NotFoundException('Token with this number not found');
        }
        return token.meta_data;
    }
    async updateMetadata(data) {
        const token = await this.tokenRepository.findOne({ where: { nft_number: data.id } });
        if (!token) {
            throw new microservices_1.RpcException('Token with this number not found');
        }
        try {
            for (const key in data.meta_data) {
                if (token.meta_data[key] !== undefined) {
                    token.meta_data[key] = data.meta_data[key];
                }
            }
            token.changed('meta_data', true);
            await token.save();
            return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, null, 'data updated');
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
};
DbManagerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_2.InjectModel)(contract_model_1.ContractModel)),
    __param(1, (0, sequelize_2.InjectModel)(token_model_1.TokenModel)),
    __param(2, (0, sequelize_2.InjectModel)(whitelist_model_1.WhitelistModel)),
    __metadata("design:paramtypes", [Object, Object, Object])
], DbManagerService);
exports.DbManagerService = DbManagerService;
//# sourceMappingURL=db-manager.service.js.map