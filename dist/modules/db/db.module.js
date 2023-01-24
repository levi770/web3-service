"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const contract_model_1 = require("./models/contract.model");
const token_model_1 = require("./models/token.model");
const whitelist_model_1 = require("./models/whitelist.model");
const metadata_model_1 = require("./models/metadata.model");
const db_service_1 = require("./db.service");
const wallet_model_1 = require("./models/wallet.model");
const transaction_model_1 = require("./models/transaction.model");
const db_controller_1 = require("./db.controller");
let DbModule = class DbModule {
};
DbModule = __decorate([
    (0, common_1.Module)({
        controllers: [db_controller_1.DbController],
        providers: [db_service_1.DbService],
        imports: [
            sequelize_1.SequelizeModule.forFeature([
                contract_model_1.ContractModel,
                token_model_1.TokenModel,
                whitelist_model_1.WhitelistModel,
                metadata_model_1.MetadataModel,
                wallet_model_1.WalletModel,
                transaction_model_1.TransactionModel,
            ]),
        ],
        exports: [db_service_1.DbService],
    })
], DbModule);
exports.DbModule = DbModule;
//# sourceMappingURL=db.module.js.map