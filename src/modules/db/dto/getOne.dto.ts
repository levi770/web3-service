import { ObjectTypes } from '../../../common/constants';

/**
 * A data transfer object for passing parameters to retrieve a single model object.
 */
export class GetOneDto {
  object_type?: ObjectTypes;
  include_child?: boolean;
  where?: object | object[];
}
