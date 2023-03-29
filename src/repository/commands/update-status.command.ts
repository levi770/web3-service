import { UpdateStatusDto } from '../dto/update-status.dto';

export class UpdateStatusCommand {
  constructor(public readonly data: UpdateStatusDto) {}
}
