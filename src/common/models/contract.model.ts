import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { DeployDataDto } from '../dto/deployData.dto';
import { TransactionReceipt } from 'web3-eth';

@Table({ tableName: 'contracts' })
export class Contract extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.JSON })
  deployData: DeployDataDto;

  @Column({ type: DataType.JSON })
  deployTx: TransactionReceipt;
}
