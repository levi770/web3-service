import { Model } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { MetaDataDto } from '../../web3-manager/dto/metaData.dto';
import { TokenModel } from './token.model';
export declare class MetadataModel extends Model {
    id: string;
    status: string;
    meta_data: MetaDataDto;
    contract_id: string;
    contract: ContractModel;
    tokens: TokenModel[];
}