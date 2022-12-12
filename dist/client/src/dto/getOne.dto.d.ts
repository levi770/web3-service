import { OBJECTS } from '../constants';
export declare class GetOneDto {
    object_type: OBJECTS;
    id?: string;
    address?: string;
    contract_id?: string;
    include_child?: boolean;
}
