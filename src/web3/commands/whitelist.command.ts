import { CallDto } from '../dto/call.dto';

export class WhitelistCommand {
  constructor(public data: CallDto) {}
}
