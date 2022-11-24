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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsManagerService = void 0;
const aws_sdk_1 = require("aws-sdk");
const nest_aws_sdk_1 = require("nest-aws-sdk");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ipfs_service_1 = require("./ipfs.service");
const microservices_1 = require("@nestjs/microservices");
let IpfsManagerService = class IpfsManagerService {
    constructor(s3, configService) {
        this.s3 = s3;
        this.configService = configService;
    }
    async onModuleInit() {
        this.ipfs = await new ipfs_service_1.IpfsService({ url: await this.configService.get('IPFS_HTTP_API_URL') }).getNode();
    }
    async upload(key) {
        const file = await this.getObjectFromS3(key);
        return await this.uploadToIpfs({ name: key, data: file });
    }
    async getObjectFromS3(key) {
        try {
            const object = await this.s3.getObject({ Key: key, Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
            return object.Body;
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new microservices_1.RpcException('file not found');
            }
            throw new microservices_1.RpcException(error.message);
        }
    }
    async uploadToIpfs(file) {
        const fileDetails = { path: file.name, content: file.data };
        const options = { wrapWithDirectory: true };
        try {
            const added = await this.ipfs.add(fileDetails, options);
            return added.cid.toString();
        }
        catch (error) {
            throw new microservices_1.RpcException(error);
        }
    }
};
IpfsManagerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, nest_aws_sdk_1.InjectAwsService)(aws_sdk_1.S3)),
    __metadata("design:paramtypes", [aws_sdk_1.S3, config_1.ConfigService])
], IpfsManagerService);
exports.IpfsManagerService = IpfsManagerService;
//# sourceMappingURL=ipfs-manager.service.js.map