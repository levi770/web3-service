import { ObjectTypes, Statuses } from '../../../common/constants';
export declare class UpdateStatusDto {
    object_type?: ObjectTypes;
    object_id: string | string[];
    tx_hash?: string;
    tx_receipt?: any;
    status: Statuses;
}
