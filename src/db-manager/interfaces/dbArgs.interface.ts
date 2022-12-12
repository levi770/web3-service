import { Order } from 'sequelize'

export interface DbArgs {
  attributes?: {
    exclude: string[];
  };
  offset?: null | number;
  limit?: null | number;
  order?: Order;
  include?: any;
  where?: any;
}