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
exports.TransactionModel = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const constants_1 = require("../../common/constants");
const contract_model_1 = require("./contract.model");
const wallet_model_1 = require("./wallet.model");
let TransactionModel = class TransactionModel extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], TransactionModel.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER }),
    __metadata("design:type", Number)
], TransactionModel.prototype, "network", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], TransactionModel.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], TransactionModel.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", Object)
], TransactionModel.prototype, "tx_payload", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], TransactionModel.prototype, "tx_hash", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", Object)
], TransactionModel.prototype, "tx_receipt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", Object)
], TransactionModel.prototype, "error", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => contract_model_1.ContractModel),
    __metadata("design:type", String)
], TransactionModel.prototype, "contract_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => contract_model_1.ContractModel),
    __metadata("design:type", contract_model_1.ContractModel)
], TransactionModel.prototype, "contract", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => wallet_model_1.WalletModel),
    __metadata("design:type", String)
], TransactionModel.prototype, "wallet_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => wallet_model_1.WalletModel),
    __metadata("design:type", wallet_model_1.WalletModel)
], TransactionModel.prototype, "wallet", void 0);
TransactionModel = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'transactions' })
], TransactionModel);
exports.TransactionModel = TransactionModel;
//# sourceMappingURL=transaction.model.js.map