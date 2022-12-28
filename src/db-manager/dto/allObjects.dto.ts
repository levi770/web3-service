import { ContractModel } from '../models/contract.model';
import { TokenModel } from '../models/token.model';
import { WhitelistModel } from '../models/whitelist.model';

/**
 * @class AllObjectsDto - A data transfer object for passing multiple model objects and a count.
 * @export
 * 
 * @param {(TokenModel[] | ContractModel[] | WhitelistModel[])} rows - The model objects.
 * @param {number} count - The count of the model objects.
 */
export class AllObjectsDto {
  rows: TokenModel[] | ContractModel[] | WhitelistModel[];
  count: number;
}
