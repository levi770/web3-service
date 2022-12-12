import { Model } from 'sequelize-typescript';
import { MetaDataDto } from '../../web3-manager/dto/metaData.dto';
import { ContractModel } from './contract.model';
import { TokenModel } from './token.model';
export declare class MetadataModel extends Model {
    id: string;
    meta_data: MetaDataDto;
    contract_id: string;
    contract: ContractModel;
    tokens: TokenModel[];
}
