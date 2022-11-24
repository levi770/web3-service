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
exports.IpfsService = void 0;
const ipfs_http_client_1 = require("ipfs-http-client");
const common_1 = require("@nestjs/common");
const constants_1 = require("../common/constants");
let IpfsService = class IpfsService {
    constructor(_ipfsOptions) {
        this._ipfsOptions = _ipfsOptions;
    }
    async getNode() {
        return this._ipfsNode ? this._ipfsNode : (this._ipfsNode = (0, ipfs_http_client_1.create)(this._ipfsOptions));
    }
    async onApplicationShutdown() {
        (await this._ipfsNode) && this._ipfsNode.stop();
    }
};
IpfsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.IPFS_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], IpfsService);
exports.IpfsService = IpfsService;
//# sourceMappingURL=ipfs.service.js.map