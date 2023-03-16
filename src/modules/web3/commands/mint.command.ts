import { CallDto } from '../dto/requests/call.dto';

export class MintCommand {
  constructor(public readonly data: CallDto) {}
}
