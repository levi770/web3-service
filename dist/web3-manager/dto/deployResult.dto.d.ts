import { ContractModel } from '../../db-manager/models/contract.model';
import { MetaDataDto } from './metaData.dto';
import { MetadataModel } from '../../db-manager/models/metadata.model';
import { TxResultDto } from './txResult.dto';
export declare class DeployResultDto {
    deployTx?: TxResultDto;
    meta_data?: MetaDataDto;
    metadataObj?: MetadataModel;
    contractObj: ContractModel;
}
