import { TransactionReceipt } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { Queue } from 'bull';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { DeployDataDto } from './dto/deployData.dto';
import { JobResultDto } from '../common/dto/jobResult.dto';
import { Networks, OperationTypes, ProcessTypes } from '../common/constants';
import { GetJobDto } from './dto/getJob.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { CallDataDto } from './dto/callData.dto';
export declare class Web3Service {
    private web3Queue;
    private configService;
    private ethereum;
    private polygon;
    constructor(web3Queue: Queue, configService: ConfigService);
    getJob(data: GetJobDto): Promise<ResponseDto>;
    process(data: CallDataDto | DeployDataDto, processType: ProcessTypes): Promise<Observable<JobResultDto>>;
    send(network: Networks, contract: Contract, data: string, operationType?: OperationTypes): Promise<TransactionReceipt>;
}
