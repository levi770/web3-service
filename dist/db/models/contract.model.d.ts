import { Model } from 'sequelize-typescript';
import { DeployDataDto } from '../../web3/dto/deployData.dto';
import { MetadataModel } from './metadata.model';
import { TokenModel } from './token.model';
import { WhitelistModel } from './whitelist.model';
import { WalletModel } from './wallet.model';
import { TransactionModel } from './transaction.model';
export declare class ContractModel extends Model {
    id: string;
    status: string;
    address: string;
    deploy_data: DeployDataDto;
    metadata: MetadataModel;
    tokens: TokenModel[];
    transactions: TransactionModel[];
    whitelist: WhitelistModel[];
    wallet_id: string;
    wallet: WalletModel;
}
