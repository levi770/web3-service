import { Model, HasManyAddAssociationMixin } from 'sequelize';
import Transaction from './transaction';
declare class Contract extends Model {
    id: string;
    status: string;
    address: string;
    transactions: Transaction[];
    addTransaction: HasManyAddAssociationMixin<Transaction, string>;
}
export default Contract;
