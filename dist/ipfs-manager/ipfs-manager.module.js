"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsManagerModule = void 0;
const aws_sdk_1 = require("aws-sdk");
const nest_aws_sdk_1 = require("nest-aws-sdk");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ipfs_manager_service_1 = require("./ipfs-manager.service");
let IpfsManagerModule = class IpfsManagerModule {
};
IpfsManagerModule = __decorate([
    (0, common_1.Module)({
        providers: [ipfs_manager_service_1.IpfsManagerService],
        imports: [nest_aws_sdk_1.AwsSdkModule.forFeatures([aws_sdk_1.S3]), config_1.ConfigModule],
        exports: [ipfs_manager_service_1.IpfsManagerService],
    })
], IpfsManagerModule);
exports.IpfsManagerModule = IpfsManagerModule;
//# sourceMappingURL=ipfs-manager.module.js.map