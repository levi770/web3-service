import { OBJECTS } from '../constants';
export declare class GetAllDto {
    object_type: OBJECTS;
    page?: number;
    limit?: number;
    order?: string;
    order_by?: string;
}
