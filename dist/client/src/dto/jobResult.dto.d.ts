import { DeployDataDto } from './deployData.dto';
import { MintDataDto } from './mintData.dto';
import { ContractModel } from '../models/contract.model';
import { TokenModel } from '../models/tokens.model';
declare type Data = DeployDataDto | MintDataDto | ContractModel | TokenModel | null;
export declare class JobResultDto {
    jobId: string | number;
    status: string;
    data: Data;
    constructor(jobId: string | number, status: string, data: Data);
}
export {};
