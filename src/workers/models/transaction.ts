import Contract from './contract';
import { sequelize } from './db_instance';
import { Model, DataTypes } from 'sequelize';

const config = {
  tableName: 'transactions',
  sequelize,
};

class Transaction extends Model {
  id: string;
  network: number;
  status: string;
  address: string;
  tx_payload: object;
  tx_hash: string;
  tx_receipt: object;
  error: object;
  contract_id: string;
  contract: Contract;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    network: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    tx_payload: {
      type: DataTypes.JSON,
    },
    tx_hash: {
      type: DataTypes.STRING,
    },
    tx_receipt: {
      type: DataTypes.JSON,
    },
    error: {
      type: DataTypes.JSON,
    },
    contract: {
      type: DataTypes.STRING,
      field: 'contract_id',
      references: {
        model: 'Contract',
        key: 'id',
      },
    },
  },
  config,
);

export default Transaction;
