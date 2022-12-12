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
exports.TokenModel = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const metaData_dto_1 = require("../../web3-manager/dto/metaData.dto");
const mintData_dto_1 = require("../../web3-manager/dto/mintData.dto");
const contract_model_1 = require("./contract.model");
const metadata_model_1 = require("./metadata.model");
let TokenModel = class TokenModel extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], TokenModel.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], TokenModel.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING, unique: true }),
    __metadata("design:type", String)
], TokenModel.prototype, "nft_number", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", mintData_dto_1.MintDataDto)
], TokenModel.prototype, "mint_data", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", metaData_dto_1.MetaDataDto)
], TokenModel.prototype, "meta_data", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", Object)
], TokenModel.prototype, "mint_tx", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => contract_model_1.ContractModel),
    __metadata("design:type", String)
], TokenModel.prototype, "contract_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => contract_model_1.ContractModel),
    __metadata("design:type", contract_model_1.ContractModel)
], TokenModel.prototype, "contract", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => metadata_model_1.MetadataModel),
    __metadata("design:type", String)
], TokenModel.prototype, "metadata_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => metadata_model_1.MetadataModel),
    __metadata("design:type", metadata_model_1.MetadataModel)
], TokenModel.prototype, "metadata", void 0);
TokenModel = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'tokens' })
], TokenModel);
exports.TokenModel = TokenModel;
//# sourceMappingURL=token.model.js.map