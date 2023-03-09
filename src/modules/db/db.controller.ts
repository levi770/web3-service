import { Controller, HttpStatus, Logger, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD, DB_CONTROLLER, ExceptionTypes, Statuses } from '../../common/constants';
import { Response } from '../../common/dto/response.dto';
import { DbService } from './db.service';
import { GetAllRequest } from './dto/requests/getAll.request';
import { GetOneRequest } from './dto/requests/getOne.request';
import { UpdateMetadataRequest } from './dto/requests/updateMetadata.request';
import { UpdateStatusRequest } from './dto/requests/updateStatus.request';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { RpcLogger } from '../../common/interceptors/rpc-loger.interceptor';
import { ExceptionFilter } from '../../common/filters/exception.filter';

const logger = new Logger('DbController');

/**
 * A controller for handling database operations.
 */
@UseInterceptors(new RpcLogger(logger))
@UseFilters(new ExceptionFilter())
@Controller(DB_CONTROLLER)
export class DbController {
  constructor(private dbManagerService: DbService) {}

  /**
   * Gets all objects of a specified type.
   */
  @MessagePattern({ cmd: CMD.ALL_OBJECTS })
  async getAllObjects(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetAllRequest): Promise<Response> {
    const result = await this.dbManagerService.getAllObjects(data.object_type, data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Gets a single object of a specified type.
   */
  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  async getOneObject(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetOneRequest): Promise<Response> {
    const result = await this.dbManagerService.getOneObject(data.object_type, data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Updates the status of a job.
   */
  @MessagePattern({ cmd: CMD.UPDATE_STATUS })
  async updateStatus(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: UpdateStatusRequest): Promise<Response> {
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
    const result = await this.dbManagerService.updateMetadata(data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }
}
