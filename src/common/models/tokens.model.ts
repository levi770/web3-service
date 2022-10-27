import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { MintDataDto } from '../dto/mintData.dto';
import { TransactionReceipt } from 'web3-eth';

@Table({ tableName: 'tokens' })
export class Token extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.JSON })
  mintData: MintDataDto;

  @Column({ type: DataType.JSON })
  mintTx: TransactionReceipt;
}
