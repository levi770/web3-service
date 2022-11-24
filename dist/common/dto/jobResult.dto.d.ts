import { DeployDataDto } from '../../web3-manager/dto/deployData.dto';
import { MintDataDto } from '../../web3-manager/dto/mintData.dto';
import { ContractModel } from '../../db-manager/models/contract.model';
import { TokenModel } from '../../db-manager/models/token.model';
declare type Data = DeployDataDto | MintDataDto | ContractModel | TokenModel | string | null;
export declare class JobResultDto {
    jobId: string | number;
    status: string;
    data: Data;
    constructor(jobId: string | number, status: string, data: Data);
}
export {};
