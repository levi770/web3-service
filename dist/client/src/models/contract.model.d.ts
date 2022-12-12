import { Model } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { DeployDataDto } from '../dto/deployData.dto';
export declare class ContractModel extends Model {
    id: string;
    address: string;
    deploy_data: DeployDataDto;
    deploy_tx: TransactionReceipt;
}
