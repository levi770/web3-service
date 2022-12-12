import * as U from 'web3-utils';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { MintDataDto } from './dto/mintData.dto';
import { DbManagerService } from '../db-manager/db-manager.service';
import { Web3Service } from './web3.service';
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service';
import { ContractModel } from '../db-manager/models/contract.model';
import { TokenModel } from '../db-manager/models/token.model';
import { MetaDataDto } from './dto/metaData.dto';
import { WhitelistModel } from '../db-manager/models/whitelist.model';
export declare class Web3Processor {
    private configService;
    private dbManager;
    private ipfsManger;
    private web3Service;
    private ethereum;
    private polygon;
    constructor(configService: ConfigService, dbManager: DbManagerService, ipfsManger: IpfsManagerService, web3Service: Web3Service);
    processWhitelist(job: Job): Promise<{
        status: boolean;
        transactionHash: string;
        transactionIndex: number;
        blockHash: string;
        blockNumber: number;
        from: string;
        to: string;
        contractAddress?: string;
        cumulativeGasUsed: number;
        gasUsed: number;
        effectiveGasPrice: number;
        logs: import("web3-core").Log[];
        logsBloom: string;
        events?: {
            [eventName: string]: import("web3-core").EventLog;
        };
        proof: string[];
    }>;
    processCall(job: Job): Promise<ContractModel | TokenModel | import("web3-core").TransactionReceipt | WhitelistModel>;
    deploy(job: Job): Promise<ContractModel>;
    getMetadata(data: MintDataDto): Promise<MetaDataDto>;
    getMerkleRootProof(leaves: WhitelistModel[], leaf?: string): Promise<{
        merkleRoot: string;
        merkleProof: string[];
    } | {
        merkleRoot: string;
        merkleProof?: undefined;
    }>;
    getArgs(args: string, inputs: U.AbiInput[]): Promise<any[]>;
}
