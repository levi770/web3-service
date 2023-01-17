"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3ManagerModule = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const constants_1 = require("../common/constants");
const db_module_1 = require("../db/db.module");
const ipfs_module_1 = require("../ipfs/ipfs.module");
const web3_processor_1 = require("./web3.processor");
const web3_service_1 = require("./web3.service");
const path_1 = require("path");
let Web3ManagerModule = class Web3ManagerModule {
};
Web3ManagerModule = __decorate([
    (0, common_1.Module)({
        providers: [web3_service_1.Web3Service, web3_processor_1.Web3Processor],
        imports: [
            bull_1.BullModule.registerQueue({ name: constants_1.WEB3_QUEUE }, {
                name: constants_1.CRON_QUEUE,
                processors: [
                    {
                        name: constants_1.TX_WORKER,
                        path: (0, path_1.join)(__dirname, `../workers/tx.worker.${process.env.NAME === 'base' ? 'js' : 'ts'}`),
                    },
                ],
            }),
            config_1.ConfigModule,
            db_module_1.DbManagerModule,
            ipfs_module_1.IpfsManagerModule,
        ],
        exports: [web3_service_1.Web3Service],
    })
], Web3ManagerModule);
exports.Web3ManagerModule = Web3ManagerModule;
//# sourceMappingURL=web3.module.js.map