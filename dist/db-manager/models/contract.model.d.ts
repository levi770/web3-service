import { Model } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { DeployDataDto } from '../../web3-manager/dto/deployData.dto';
import { TokenModel } from './token.model';
export declare class ContractModel extends Model {
    id: string;
    address: string;
    deploy_data: DeployDataDto;
    deploy_tx: TransactionReceipt;
    tokens: TokenModel[];
}
