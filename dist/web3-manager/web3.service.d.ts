import { TransactionReceipt } from 'web3-core';
import { CallDataDto } from './dto/callData.dto';
import { ConfigService } from '@nestjs/config';
import { DeployDataDto } from './dto/deployData.dto';
import { GetJobDto } from './dto/getJob.dto';
import { Queue } from 'bull';
import { JobResultDto } from '../common/dto/jobResult.dto';
import { Networks, ProcessTypes } from '../common/constants';
import { Observable } from 'rxjs';
import { ResponseDto } from '../common/dto/response.dto';
import { TxObj } from './interfaces/txObj.interface';
import { TxResultDto } from './dto/txResult.dto';
import { WhitelistModel } from '../db-manager/models/whitelist.model';
export declare class Web3Service {
    private web3Queue;
    private configService;
    private ethereum;
    private polygon;
    constructor(web3Queue: Queue, configService: ConfigService);
    getJob(data: GetJobDto): Promise<ResponseDto>;
    process(data: CallDataDto | DeployDataDto, processType: ProcessTypes): Promise<Observable<JobResultDto>>;
    send(txObj: TxObj): Promise<TxResultDto>;
    getTxReceipt(txHash: string, network: Networks): Promise<TransactionReceipt>;
    getMerkleRoot(leaves: WhitelistModel[]): Promise<string>;
    getMerkleProof(leaves: WhitelistModel[], address: string): Promise<string[]>;
}
