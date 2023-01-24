import { Observable } from 'rxjs';
import { JobResultDto } from '../../common/dto/jobResult.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { CallDataDto } from './dto/callData.dto';
import { CreateWalletDto } from './dto/createWallet.dto';
import { DeployDataDto } from './dto/deployData.dto';
import { GetJobDto } from './dto/getJob.dto';
import { WhitelistDto } from './dto/whitelist.dto';
import { Web3Service } from './web3.service';
import { PredictDto } from './dto/predict.dto';
export declare class Web3Controller {
    private web3Service;
    private logger;
    constructor(web3Service: Web3Service);
    createWallet(data: CreateWalletDto): Promise<Observable<JobResultDto>>;
    processDeploy(data: DeployDataDto): Promise<Observable<JobResultDto>>;
    processMint(data: CallDataDto): Promise<Observable<JobResultDto>>;
    processWhitelist(data: CallDataDto): Promise<Observable<JobResultDto>>;
    processCommon(data: CallDataDto): Promise<Observable<JobResultDto>>;
    getMerkleProof(data: WhitelistDto): Promise<Observable<JobResultDto>>;
    getJob(data: GetJobDto): Promise<ResponseDto>;
    predict(data: PredictDto): Promise<ResponseDto>;
}
