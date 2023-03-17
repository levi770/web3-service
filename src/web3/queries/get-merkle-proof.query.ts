import { WhitelistOptionsDto } from '../dto/whitelist-options.dto';

export class GetMerkleProofQuery {
  constructor(public readonly data: WhitelistOptionsDto) {}
}
