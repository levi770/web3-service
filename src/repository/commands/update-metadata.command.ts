import { UpdateMetadataDto } from '../dto/update-metadata.dto';

export class UpdateMetadataCommand {
  constructor(public readonly data: UpdateMetadataDto) {}
}
