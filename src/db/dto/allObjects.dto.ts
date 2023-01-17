import { CreatedObjects } from '../../common/types';

/**
 * @class AllObjectsDto - A data transfer object for passing multiple model objects and a count.
 * @export
 * 
 * @param {CreatedObjects} rows - The model objects.
 * @param {number} count - The count of the model objects.
 */
export class AllObjectsDto {
  rows: CreatedObjects;
  count: number;
}
