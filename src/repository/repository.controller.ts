import { Controller, Logger, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD, REPOSITORY_CONTROLLER, ExceptionTypes } from '../common/constants';
import { ResponseDto } from '../common/dto/response.dto';
import { GetAllDto } from './dto/get-all.dto';
import { GetOneDto } from './dto/get-one.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import { RpcLogger } from '../common/interceptors/rpc-loger.interceptor';
import { ExceptionFilter } from '../common/filters/exception.filter';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetAllObjectsQuery } from './queries/get-all-objects.query';
import { GetOneObjectQuery } from './queries/get-one-object.query';
import { UpdateStatusCommand } from './commands/update-status.command';
import { UpdateMetadataCommand } from './commands/update-metadata.command';

const logger = new Logger(REPOSITORY_CONTROLLER);

/**
 * A controller for handling database operations.
 */
@UseInterceptors(new RpcLogger(logger))
@UseFilters(new ExceptionFilter())
@Controller(REPOSITORY_CONTROLLER)
export class RepositoryController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  /**
   * Gets all objects of a specified type.
   */
  @MessagePattern({ cmd: CMD.ALL_OBJECTS })
  async getAllObjects(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetAllDto): Promise<ResponseDto> {
    return this.queryBus.execute(new GetAllObjectsQuery(data));
  }

  /**
   * Gets a single object of a specified type.
   */
  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  async getOneObject(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetOneDto): Promise<ResponseDto> {
    return this.queryBus.execute(new GetOneObjectQuery(data));
  }

  /**
   * Updates the status of a job.
   */
  @MessagePattern({ cmd: CMD.UPDATE_STATUS })
  async updateStatus(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: UpdateStatusDto): Promise<ResponseDto> {
    return this.commandBus.execute(new UpdateStatusCommand(data));
  }

  /**
   * Updates the metadata of token.
   */
  @MessagePattern({ cmd: CMD.UPDATE_METADATA })
  async updateMetadata(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: UpdateMetadataDto): Promise<ResponseDto> {
    return this.commandBus.execute(new UpdateMetadataCommand(data));
  }
}
