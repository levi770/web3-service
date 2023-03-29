import { Range } from '../../common/types';
import { ContractModel } from '../../repository/models/contract.model';
import { TokenModel } from '../../repository/models/token.model';
import { MintOptionsDto } from '../dto/mint-options.dto';

export class TokensMintedEvent {
  constructor(public readonly data: { payload: MintOptionsDto; contract: ContractModel; token: TokenModel; ids_range: Range }) {}
}
