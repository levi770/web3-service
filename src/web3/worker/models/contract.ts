import { sequelize } from './db_instance';
import { Model, DataTypes, HasManyAddAssociationMixin } from 'sequelize';
import Transaction from './transaction';

const config = {
  tableName: 'contracts',
  sequelize,
};

class Contract extends Model {
  id: string;
  status: string;
  address: string;
  transactions: Transaction[];
  addTransaction: HasManyAddAssociationMixin<Transaction, string>;
}

Contract.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
  },
  config,
);

export default Contract;
