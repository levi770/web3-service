import { Model } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { MetaDataDto } from '../../web3-manager/dto/metaData.dto';
import { MintDataDto } from '../../web3-manager/dto/mintData.dto';
import { ContractModel } from './contract.model';
import { MetadataModel } from './metadata.model';
export declare class TokenModel extends Model {
    id: string;
    address: string;
    nft_number: string;
    mint_data: MintDataDto;
    meta_data: MetaDataDto;
    mint_tx: TransactionReceipt;
    contract_id: string;
    contract: ContractModel;
    metadata_id: string;
    metadata: MetadataModel;
}
