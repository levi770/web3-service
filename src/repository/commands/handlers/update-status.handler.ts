import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { UpdateStatusCommand } from '../update-status.command';
import { Statuses } from '../../../common/constants';
import { RepositoryService } from '../../repository.service';
import { ResponseDto } from '../../../common/dto/response.dto';

@CommandHandler(UpdateStatusCommand)
export class UpdateStatusHandler implements ICommandHandler<UpdateStatusCommand> {
  constructor(private readonly dbService: RepositoryService) {}
  async execute(command: UpdateStatusCommand) {
    const result = await this.dbService.updateStatus(command.data, command.data.object_type);
    return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, result);
  }
}
