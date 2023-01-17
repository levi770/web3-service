import { Model } from 'sequelize-typescript';
import { DeployDataDto } from '../../web3/dto/deployData.dto';
import { MetadataModel } from './metadata.model';
import { TokenModel } from './token.model';
import { TransactionReceipt } from 'web3-eth';
import { WhitelistModel } from './whitelist.model';
import { WalletModel } from './wallet.model';
export declare class ContractModel extends Model {
    id: string;
    status: string;
    address: string;
    deploy_data: DeployDataDto;
    tx_hash: string;
    tx_receipt: TransactionReceipt;
    metadata: MetadataModel;
    tokens: TokenModel[];
    whitelist: WhitelistModel[];
    wallet_id: string;
    wallet: WalletModel;
}
