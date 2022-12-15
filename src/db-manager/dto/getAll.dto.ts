import { ObjectTypes } from '../../common/constants'

export class GetAllDto {
  object_type?: ObjectTypes;
  page?: number;
  limit?: number;
  order?: string;
  order_by?: string;
  include_child?: boolean;
  contract_id?: string;
  where?: object | object[];
}
