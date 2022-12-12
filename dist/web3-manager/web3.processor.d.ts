import * as U from 'web3-utils';
import { CallResultDto } from './dto/callResult.dto';
import { ConfigService } from '@nestjs/config';
import { DbManagerService } from '../db-manager/db-manager.service';
import { DeployDataDto } from './dto/deployData.dto';
import { DeployResultDto } from './dto/deployResult.dto';
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service';
import { Job } from 'bull';
import { MetaDataDto } from './dto/metaData.dto';
import { MintDataDto } from './dto/mintData.dto';
import { Web3Service } from './web3.service';
import { WhitelistModel } from '../db-manager/models/whitelist.model';
export declare class Web3Processor {
    private configService;
    private dbManager;
    private ipfsManger;
    private web3Service;
    private ethereum;
    private polygon;
    constructor(configService: ConfigService, dbManager: DbManagerService, ipfsManger: IpfsManagerService, web3Service: Web3Service);
    processWhitelist(job: Job): Promise<CallResultDto>;
    processCall(job: Job): Promise<CallResultDto>;
    deploy(job: Job): Promise<DeployResultDto>;
    getMetadata(data: MintDataDto | DeployDataDto): Promise<MetaDataDto>;
    getMerkleRootProof(leaves: WhitelistModel[], leaf?: string): Promise<{
        root: string;
        proof: string[];
    } | {
        root: string;
        proof?: undefined;
    }>;
    getArgs(args: string, inputs: U.AbiInput[]): Promise<any[]>;
}
