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
exports.WalletModel = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const token_model_1 = require("./token.model");
const contract_model_1 = require("./contract.model");
let WalletModel = class WalletModel extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], WalletModel.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], WalletModel.prototype, "team_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING }),
    __metadata("design:type", String)
], WalletModel.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON }),
    __metadata("design:type", Object)
], WalletModel.prototype, "keystore", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => contract_model_1.ContractModel),
    __metadata("design:type", Array)
], WalletModel.prototype, "contracts", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => token_model_1.TokenModel),
    __metadata("design:type", Array)
], WalletModel.prototype, "tokens", void 0);
WalletModel = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'wallets' })
], WalletModel);
exports.WalletModel = WalletModel;
//# sourceMappingURL=wallet.model.js.map