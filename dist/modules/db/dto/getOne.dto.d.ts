import { ObjectTypes } from '../../../common/constants';
export declare class GetOneDto {
    object_type?: ObjectTypes;
    include_child?: boolean;
    where?: object | object[];
}
