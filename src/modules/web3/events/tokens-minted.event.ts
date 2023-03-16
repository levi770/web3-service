import { Range } from '../../../common/types';
import { ContractModel } from '../../db/models/contract.model';
import { TokenModel } from '../../db/models/token.model';
import { MintOptionsDto } from '../interfaces/mintOptions.dto';

export class TokensMintedEvent {
  constructor(public readonly data: { payload: MintOptionsDto; contract: ContractModel; token: TokenModel; ids_range: Range }) {}
}
