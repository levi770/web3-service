import { ContractModel } from '../../db/models/contract.model';
import { TxResultDto } from './txResult.dto';
export declare class DeployResultDto {
    tx: TxResultDto;
    contract: ContractModel;
}
