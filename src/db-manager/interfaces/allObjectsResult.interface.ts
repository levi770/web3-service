import { ContractModel } from '../models/contract.model';
import { TokenModel } from '../models/token.model';

export interface AllObjectResults {
  rows: TokenModel[] | ContractModel[];
  count: number;
}
