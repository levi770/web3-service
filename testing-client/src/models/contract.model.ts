import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { DeployDataDto } from '../../web3-manager/dto/deployData.dto';

@Table({ tableName: 'contracts' })
export class ContractModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.JSON })
  deploy_data: DeployDataDto;

  @Column({ type: DataType.JSON })
  deploy_tx: TransactionReceipt;
}
