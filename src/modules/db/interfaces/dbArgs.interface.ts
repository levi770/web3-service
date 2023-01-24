import { Order } from 'sequelize';

/**
 * An interface for passing database query arguments.
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
