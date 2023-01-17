import { Order } from 'sequelize'

/**
 * An interface for passing database query arguments.
 * 
 * @param {object} [attributes] - An object specifying the attributes to include or exclude in the result.
 * @param {number} [offset] - The number of rows to skip in the result.
 * @param {number} [limit] - The maximum number of rows to return in the result.
 * @param {Order} [order] - An array of order clauses.
 * @param {any} [include] - An array of associations to include in the result.
 * @param {any} [where] - A where clause to filter the result.
 * @param {boolean} [distinct] - Indicates whether to return distinct rows.
 * 
 * @export
 * @interface DbArgs
 */
export interface DbArgs {
  attributes?: {
    exclude: string[];
  };
  offset?: null | number;
  limit?: null | number;
  order?: Order;
  include?: any;
  where?: any;
  distinct?: boolean;
}
