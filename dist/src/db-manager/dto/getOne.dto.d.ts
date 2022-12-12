import { ObjectTypes } from "../../common/constants";
export declare class GetOneDto {
    object_type: ObjectTypes;
    id?: string;
    address?: string;
    contract_id?: string;
    include_child?: boolean;
}
