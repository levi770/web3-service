import { ClientProxy } from '@nestjs/microservices';
import { GetAllDto } from './dto/getAll.dto';
import { JobIdDto } from './dto/getJob.dto';
import { GetOneDto } from './dto/getOne.dto';
import { MetaDataDto } from './dto/metaData.dto';
import { OperationDto } from './dto/operation.dto';
export declare class AppService {
    private svc;
    constructor(svc: ClientProxy);
    updateMetadata(id: string, meta_data: MetaDataDto): Promise<any>;
    getOne(query: GetOneDto): Promise<any>;
    getAll(query: GetAllDto): Promise<any>;
    getJob(query: JobIdDto): Promise<any>;
    process(data: OperationDto): Promise<any>;
}
