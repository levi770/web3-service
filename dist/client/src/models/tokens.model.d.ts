import { Model } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { MetaDataDto } from '../dto/metaData.dto';
import { MintDataDto } from '../dto/mintData.dto';
export declare class TokenModel extends Model {
    id: string;
    address: string;
    nft_number: string;
    mint_data: MintDataDto;
    meta_data: MetaDataDto;
    mint_tx: TransactionReceipt;
}
