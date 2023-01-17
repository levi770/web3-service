import { Networks, ObjectTypes, Statuses } from '../../common/constants';
import { TransactionReceipt } from 'web3-core';
export declare class UpdateStatusDto {
    network: Networks;
    object_type: ObjectTypes;
    object_id: string;
    tx_hash: string;
    tx_receipt?: TransactionReceipt;
    status?: Statuses;
}
