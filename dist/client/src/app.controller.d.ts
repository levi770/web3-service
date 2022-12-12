import { AppService } from './app.service';
import { GetAllDto } from './dto/getAll.dto';
import { JobIdDto } from './dto/getJob.dto';
import { GetOneDto } from './dto/getOne.dto';
import { MetaDataDto } from './dto/metaData.dto';
import { OperationDto } from './dto/operation.dto';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getAll(query?: GetAllDto): Promise<any>;
    getOne(query?: GetOneDto): Promise<any>;
    getJob(query?: JobIdDto): Promise<any>;
    process(data?: OperationDto): Promise<any>;
    updateMetadata(id: string, data?: MetaDataDto): Promise<any>;
}
