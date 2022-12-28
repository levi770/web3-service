import { ObjectTypes } from '../../common/constants'

/**
 * @class GetOneDto - A data transfer object for passing parameters to retrieve a single model object.
 * @export
 * 
 * @param {ObjectTypes} [object_type] - The type of the model object to retrieve.
 * @param {string} [id] - The ID of the model object to retrieve.
 * @param {string} [token_id] - The token ID of the model object to retrieve.
 * @param {string} [address] - The address of the model object to retrieve.
 * @param {string} [contract_id] - The ID of the contract to retrieve the model object for.
 * @param {boolean} [include_child] - Indicates whether to include child objects in the result.
 */
export class GetOneDto {
  object_type?: ObjectTypes;
  id?: string;
  token_id?: string;
  address?: string;
  contract_id?: string;
  include_child?: boolean;
}
