import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD, DB_CONTROLLER, ExceptionTypes, Statuses } from '../../common/constants';
import { Response } from '../../common/dto/response.dto';
import { DbService } from './db.service';
import { GetAllRequest } from './dto/requests/getAll.request';
import { GetOneRequest } from './dto/requests/getOne.request';
import { UpdateMetadataRequest } from './dto/requests/updateMetadata.request';
import { UpdateStatusRequest } from './dto/requests/updateStatus.request';
import { ValidationPipe } from '../../common/pipes/validation.pipe';

/**
 * A controller for handling database operations.
 */
@Controller(DB_CONTROLLER)
export class DbController {
  private logger: Logger;

  constructor(private dbManagerService: DbService) {
    this.logger = new Logger('DbController');
  }

  /**
   * Gets all objects of a specified type.
   */
  @MessagePattern({ cmd: CMD.ALL_OBJECTS })
  async getAllObjects(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetAllRequest): Promise<Response> {
    this.logger.log(`Processing call '${CMD.ALL_OBJECTS}' with data: ${JSON.stringify(data)}`);
    const result = await this.dbManagerService.getAllObjects(data.object_type, data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Gets a single object of a specified type.
   */
  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  async getOneObject(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetOneRequest): Promise<Response> {
    this.logger.log(`Processing call '${CMD.ONE_OBJECT}' with data: ${JSON.stringify(data)}`);
    const result = await this.dbManagerService.getOneObject(data.object_type, data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Updates the status of a job.
   */
  @MessagePattern({ cmd: CMD.UPDATE_STATUS })
  async updateStatus(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: UpdateStatusRequest): Promise<Response> {
    this.logger.log(`Processing call '${CMD.UPDATE_STATUS}' with data: ${JSON.stringify(data)}`);
    const result = await this.dbManagerService.updateStatus(data, data.object_type);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Updates the metadata of token.
   */
  @MessagePattern({ cmd: CMD.UPDATE_METADATA })
  async updateMetadata(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: UpdateMetadataRequest,
  ): Promise<Response> {
    this.logger.log(`Processing call '${CMD.UPDATE_METADATA}' with data: ${JSON.stringify(data)}`);
    const result = await this.dbManagerService.updateMetadata(data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }
}
