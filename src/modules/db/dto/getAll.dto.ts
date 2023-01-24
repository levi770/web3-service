import { ObjectTypes } from '../../../common/constants';

/**
 * A data transfer object for passing parameters to retrieve multiple model objects.
 */
export class GetAllDto {
  object_type?: ObjectTypes;
  page?: number;
  limit?: number;
  order?: string;
  order_by?: string;
  include_child?: boolean;
  where?: object | object[];
}
