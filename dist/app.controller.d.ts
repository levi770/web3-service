import { Observable } from 'rxjs';
import { DeployDataDto } from './web3-manager/dto/deployData.dto';
import { GetAllDto } from './db-manager/dto/getAll.dto';
import { JobResultDto } from './common/dto/jobResult.dto';
import { MintDataDto } from './web3-manager/dto/mintData.dto';
import { ResponseDto } from './common/dto/response.dto';
import { DbManagerService } from './db-manager/db-manager.service';
import { Web3Service } from './web3-manager/web3.service';
import { MetaDataDto } from './web3-manager/dto/metaData.dto';
import { GetOneDto } from './db-manager/dto/getOne.dto';
import { GetJobDto } from './web3-manager/dto/getJob.dto';
import { UpdateMetadataDto } from './db-manager/dto/updateMetadata.dto';
export declare class AppController {
    private web3Service;
    private dbManagerService;
    constructor(web3Service: Web3Service, dbManagerService: DbManagerService);
    getJob(data: GetJobDto): Promise<ResponseDto>;
    deploy(data: DeployDataDto): Promise<Observable<JobResultDto>>;
    mint(data: MintDataDto): Promise<Observable<JobResultDto>>;
    getAllContracts(data: GetAllDto): Promise<ResponseDto>;
    getOneContract(data: GetOneDto): Promise<ResponseDto>;
    getAllTokens(data: GetAllDto): Promise<ResponseDto>;
    getOneToken(data: GetOneDto): Promise<ResponseDto>;
    updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto>;
    getMetaData(id: string): Promise<MetaDataDto>;
}
