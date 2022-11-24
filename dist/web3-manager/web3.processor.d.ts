import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { MintDataDto } from './dto/mintData.dto';
import { DbManagerService } from '../db-manager/db-manager.service';
import { Web3Service } from './web3.service';
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service';
import { ContractModel } from '../db-manager/models/contract.model';
import { TokenModel } from '../db-manager/models/token.model';
import { MetaDataDto } from './dto/metaData.dto';
export declare class Web3Processor {
    private configService;
    private dbManager;
    private ipfsManger;
    private web3Service;
    private ethereum;
    private polygon;
    constructor(configService: ConfigService, dbManager: DbManagerService, ipfsManger: IpfsManagerService, web3Service: Web3Service);
    mint(job: Job): Promise<ContractModel | TokenModel>;
    deploy(job: Job): Promise<ContractModel | TokenModel>;
    generateMetadata(data: MintDataDto): Promise<MetaDataDto>;
}
