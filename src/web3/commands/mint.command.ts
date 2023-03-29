import { CallDto } from '../dto/call.dto';

export class MintCommand {
  constructor(public readonly data: CallDto) {}
}
