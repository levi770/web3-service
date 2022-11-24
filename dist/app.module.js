"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const nest_aws_sdk_1 = require("nest-aws-sdk");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sequelize_1 = require("@nestjs/sequelize");
const bull_1 = require("@nestjs/bull");
const app_controller_1 = require("./app.controller");
const web3_manager_module_1 = require("./web3-manager/web3-manager.module");
const db_manager_module_1 = require("./db-manager/db-manager.module");
const ipfs_manager_module_1 = require("./ipfs-manager/ipfs-manager.module");
const contract_model_1 = require("./db-manager/models/contract.model");
const token_model_1 = require("./db-manager/models/token.model");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: `.${process.env.NODE_ENV}.env`,
            }),
            sequelize_1.SequelizeModule.forRoot({
                dialect: 'postgres',
                host: process.env.POSTGRES_HOST,
                port: +process.env.POSTGRES_PORT,
                username: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASSWORD,
                database: process.env.POSTGRES_DB,
                models: [contract_model_1.ContractModel, token_model_1.TokenModel],
                autoLoadModels: true,
                synchronize: true,
                logging: false,
            }),
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST,
                    port: +process.env.REDIS_PORT,
                },
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
            web3_manager_module_1.Web3ManagerModule,
            db_manager_module_1.DbManagerModule,
            ipfs_manager_module_1.IpfsManagerModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map