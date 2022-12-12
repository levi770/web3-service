"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('App');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.disable('x-powered-by');
    app.enableCors({
        origin: true,
        allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
        methods: 'GET',
        credentials: true,
    });
    app.connectMicroservice({
        transport: microservices_1.Transport.REDIS,
        options: {
            host: process.env.REDIS_HOST,
            port: +process.env.REDIS_PORT,
        },
    });
    await app.startAllMicroservices();
    await app.listen(process.env.PORT || 5000, '127.0.0.1', async () => logger.log(`Server started on port ${await app.getUrl()}`));
}
bootstrap();
//# sourceMappingURL=main.js.map