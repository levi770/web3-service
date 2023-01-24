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
exports.ContractModel = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const deployData_dto_1 = require("../../web3/dto/deployData.dto");
const metadata_model_1 = require("./metadata.model");
const token_model_1 = require("./token.model");
const whitelist_model_1 = require("./whitelist.model");
const wallet_model_1 = require("./wallet.model");
const transaction_model_1 = require("./transaction.model");
let ContractModel = class ContractModel extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], ContractModel.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], ContractModel.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], ContractModel.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", deployData_dto_1.DeployDataDto)
], ContractModel.prototype, "deploy_data", void 0);
__decorate([
    (0, sequelize_typescript_1.HasOne)(() => metadata_model_1.MetadataModel, { onDelete: 'CASCADE' }),
    __metadata("design:type", metadata_model_1.MetadataModel)
], ContractModel.prototype, "metadata", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => token_model_1.TokenModel, { onDelete: 'CASCADE' }),
    __metadata("design:type", Array)
], ContractModel.prototype, "tokens", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => transaction_model_1.TransactionModel, { onDelete: 'CASCADE' }),
    __metadata("design:type", Array)
], ContractModel.prototype, "transactions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => whitelist_model_1.WhitelistModel, { onDelete: 'CASCADE' }),
    __metadata("design:type", Array)
], ContractModel.prototype, "whitelist", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => wallet_model_1.WalletModel),
    __metadata("design:type", String)
], ContractModel.prototype, "wallet_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => wallet_model_1.WalletModel),
    __metadata("design:type", wallet_model_1.WalletModel)
], ContractModel.prototype, "wallet", void 0);
ContractModel = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'contracts' })
], ContractModel);
exports.ContractModel = ContractModel;
//# sourceMappingURL=contract.model.js.map