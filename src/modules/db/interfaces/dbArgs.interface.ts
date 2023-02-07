import { Order } from 'sequelize';

/**
 * An interface for passing database query arguments.
 */
export interface IDbArgs {
  attributes?: {
    exclude: string[];
  };
  offset?: null | number;
  limit?: null | number;
  page?: number;
  sort?: null | string;
  order_by?: string;
  order?: Order;
  include?: any;
  where?: any;
  include_child?: boolean;
  distinct?: boolean;
}
