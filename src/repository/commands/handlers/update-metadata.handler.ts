import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { Statuses } from '../../../common/constants';
import { RepositoryService } from '../../repository.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import { UpdateMetadataCommand } from '../update-metadata.command';

@CommandHandler(UpdateMetadataCommand)
export class UpdateMetadataHandler implements ICommandHandler<UpdateMetadataCommand> {
  constructor(private readonly dbService: RepositoryService) {}
  async execute(command: UpdateMetadataCommand) {
    const result = await this.dbService.updateMetadata(command.data);
    return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, result);
  }
}
