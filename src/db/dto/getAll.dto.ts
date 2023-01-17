import { ObjectTypes } from '../../common/constants';

/**
 * @class GetAllDto - A data transfer object for passing parameters to retrieve multiple model objects.
 * @export
 *
 * @param {ObjectTypes} [object_type] - The type of the model objects to retrieve.
 * @param {number} [page] - The page number to retrieve.
 * @param {number} [limit] - The number of model objects to retrieve per page.
 * @param {string} [order] - The order to retrieve the model objects in.
 * @param {string} [order_by] - The field to order the model objects by.
 * @param {boolean} [include_child] - Indicates whether to include child objects in the results.
 * @param {string} [contract_id] - The ID of the contract to retrieve the model objects for.
 * @param {(object | object[])} [where] - The criteria for filtering the model objects.
 */
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
