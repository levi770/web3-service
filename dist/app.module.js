"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const app_controller_1 = require("./app.controller");
const nest_aws_sdk_1 = require("nest-aws-sdk");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const contract_model_1 = require("./db/models/contract.model");
const db_module_1 = require("./db/db.module");
const ipfs_module_1 = require("./ipfs/ipfs.module");
const metadata_model_1 = require("./db/models/metadata.model");
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const token_model_1 = require("./db/models/token.model");
const web3_module_1 = require("./web3/web3.module");
const whitelist_model_1 = require("./db/models/whitelist.model");
const wallet_model_1 = require("./db/models/wallet.model");
const transaction_model_1 = require("./db/models/transaction.model");
const schedule_1 = require("@nestjs/schedule");
const logger = new common_1.Logger('Sql');
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            sequelize_1.SequelizeModule.forRoot({
                dialect: 'postgres',
                uri: process.env.POSTGRES_URI,
                models: [contract_model_1.ContractModel, token_model_1.TokenModel, whitelist_model_1.WhitelistModel, metadata_model_1.MetadataModel, wallet_model_1.WalletModel, transaction_model_1.TransactionModel],
                autoLoadModels: true,
                synchronize: true,
                logging: (sql, timing) => logger.log(sql),
            }),
            bull_1.BullModule.forRoot({
                url: process.env.REDIS_URI,
            }),
            nest_aws_sdk_1.AwsSdkModule.forRoot({
                defaultServiceOptions: {
                    region: process.env.AWS_REGION,
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY,
                        secretAccessKey: process.env.AWS_SECRET_KEY,
                    },
                },
            }),
            schedule_1.ScheduleModule.forRoot(),
            web3_module_1.Web3ManagerModule,
            db_module_1.DbManagerModule,
            ipfs_module_1.IpfsManagerModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map