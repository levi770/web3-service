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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const response_dto_1 = require("./common/dto/response.dto");
const db_service_1 = require("./modules/db/db.service");
const getMetadata_dto_1 = require("./modules/db/dto/getMetadata.dto");
let AppController = class AppController {
    constructor(dbManagerService) {
        this.dbManagerService = dbManagerService;
        this.logger = new common_1.Logger('AppController');
    }
    async getHealth() {
        this.logger.log(`Processing GET request 'health'`);
        return new response_dto_1.ResponseDto(common_1.HttpStatus.OK, 'active', null);
    }
    async getMetaData(params) {
        this.logger.log(`Processing GET request 'metadata' with id: ${JSON.stringify(params)}`);
        return await this.dbManagerService.getMetadata(params);
    }
};
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('metadata/:address/:id'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getMetadata_dto_1.GetMetadataDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMetaData", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], AppController);
exports.AppController = AppController;
//# sourceMappingURL=app.controller.js.map