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
exports.WhitelistModel = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const contract_model_1 = require("./contract.model");
let WhitelistModel = class WhitelistModel extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING, unique: true }),
    __metadata("design:type", String)
], WhitelistModel.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => contract_model_1.ContractModel),
    __metadata("design:type", String)
], WhitelistModel.prototype, "contract_id", void 0);
WhitelistModel = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'whitelist' })
], WhitelistModel);
exports.WhitelistModel = WhitelistModel;
//# sourceMappingURL=whitelist.model.js.map