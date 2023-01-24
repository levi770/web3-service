import { ResponseDto } from './common/dto/response.dto';
import { DbService } from './modules/db/db.service';
import { GetMetadataDto } from './modules/db/dto/getMetadata.dto';
import { MetaDataDto } from './modules/web3/dto/metaData.dto';
export declare class AppController {
    private dbManagerService;
    private logger;
    constructor(dbManagerService: DbService);
    getHealth(): Promise<ResponseDto>;
    getMetaData(params: GetMetadataDto): Promise<MetaDataDto>;
}
