import { ResponseDto } from '../../common/dto/response.dto';
import { DbService } from './db.service';
import { GetAllDto } from './dto/getAll.dto';
import { GetOneDto } from './dto/getOne.dto';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { UpdateStatusDto } from './dto/updateStatus.dto';
export declare class DbController {
    private dbManagerService;
    private logger;
    constructor(dbManagerService: DbService);
    getAllObjects(data: GetAllDto): Promise<ResponseDto>;
    getOneObject(data: GetOneDto): Promise<ResponseDto>;
    updateStatus(data: UpdateStatusDto): Promise<ResponseDto>;
    updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto>;
}
