import * as U from 'web3-utils';
import Web3 from 'web3';
import { Job } from 'bull';
import { CallDataDto } from './dto/callData.dto';
import { WhitelistResultDto } from './dto/whitelistResult.dto';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployDataDto } from './dto/deployData.dto';
import { IpfsManagerService } from '../ipfs/ipfs.service';
import { MetaDataDto } from './dto/metaData.dto';
import { MintDataDto } from './dto/mintData.dto';
import { Web3Service } from './web3.service';
import { DbService } from '../db/db.service';
import { WalletModel } from '../db/models/wallet.model';
import { TxResultDto } from './dto/txResult.dto';
import { WalletDto } from '../db/dto/wallet.dto';
import { MerkleProofDto } from './dto/merkleProof.dto';
import { DeployResultDto } from './dto/deployResult.dto';
import { MintResultDto } from './dto/mintResult.dto';
export declare class Web3Processor {
    private configService;
    private dbManager;
    private ipfsManger;
    private web3Service;
    constructor(configService: ConfigService, dbManager: DbService, ipfsManger: IpfsManagerService, web3Service: Web3Service);
    createWallet(job: Job): Promise<WalletDto>;
    deploy(job: Job): Promise<DeployResultDto>;
    mint(job: Job): Promise<MintResultDto>;
    whitelist(job: Job): Promise<WhitelistResultDto>;
    commonCall(job: Job): Promise<TxResultDto>;
    getMerkleProof(job: Job): Promise<MerkleProofDto>;
    getAccount(data: CallDataDto | DeployDataDto): Promise<{
        w3: Web3;
        wallet: WalletModel;
        keystore: any;
    }>;
    getContract(data: CallDataDto, w3: Web3): Promise<{
        contractObj: ContractModel;
        contractInst: any;
        abiObj: any;
    }>;
    getArgs(args: string, inputs: U.AbiInput[]): any[];
    getMetadata(data: MintDataDto | DeployDataDto): Promise<MetaDataDto>;
}
