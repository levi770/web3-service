import { ContractModel } from '../models/contract.model';
import { TokenModel } from '../models/token.model';
import { WhitelistModel } from '../models/whitelist.model';
export declare class AllObjectsDto {
    rows: TokenModel[] | ContractModel[] | WhitelistModel[];
    count: number;
}
