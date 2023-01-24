import { CreatedObjects } from '../../../../common/types';

/**
 * A data transfer object for passing multiple model objects and a count.
 */
export class AllObjectsResponce {
  rows: CreatedObjects;
  count: number;
}
