import { Model } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { MetadataModel } from './metadata.model';
import { MintDataDto } from '../../web3/dto/mintData.dto';
import { TransactionReceipt } from 'web3-eth';
import { WalletModel } from './wallet.model';
export declare class TokenModel extends Model {
    id: string;
    status: string;
    token_id: number;
    address: string;
    nft_number: string;
    mint_data: MintDataDto;
    tx_hash: string;
    tx_receipt: TransactionReceipt;
    contract_id: string;
    contract: ContractModel;
    metadata_id: string;
    metadata: MetadataModel;
    wallet_id: string;
    wallet: WalletModel;
}
