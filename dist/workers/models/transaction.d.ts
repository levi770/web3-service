import Contract from './contract';
import { Model } from 'sequelize';
declare class Transaction extends Model {
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
export default Transaction;
