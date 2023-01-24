import { Controller, Get, HttpStatus, Logger, Param } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CMD, DB_CONTROLLER, Statuses } from '../../common/constants';
import { ResponseDto } from '../../common/dto/response.dto';
import { MetaDataDto } from '../web3/dto/metaData.dto';
import { DbService } from './db.service';
import { GetAllDto } from './dto/getAll.dto';
import { GetOneDto } from './dto/getOne.dto';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { UpdateStatusDto } from './dto/updateStatus.dto';
import { GetMetadataDto } from './dto/getMetadata.dto';

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
  async getAllObjects(data: GetAllDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.ALL_OBJECTS}' with data: ${JSON.stringify(data)}`);
    if (data.object_type === undefined) {
      return new ResponseDto(HttpStatus.BAD_REQUEST, 'Missing object_type', null);
    }
    const result = await this.dbManagerService.getAllObjects(data.object_type, data);
    return new ResponseDto(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Gets a single object of a specified type.
   */
  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  async getOneObject(data: GetOneDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.ONE_OBJECT}' with data: ${JSON.stringify(data)}`);
    if (data.object_type === undefined) {
      return new ResponseDto(HttpStatus.BAD_REQUEST, 'Missing object_type', null);
    }
    const result = await this.dbManagerService.getOneObject(data.object_type, data);
    return new ResponseDto(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Updates the status of a job.
   */
  @MessagePattern({ cmd: CMD.UPDATE_STATUS })
  async updateStatus(data: UpdateStatusDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.UPDATE_STATUS}' with data: ${JSON.stringify(data)}`);
    if (data.object_type === undefined) {
      return new ResponseDto(HttpStatus.BAD_REQUEST, 'Missing object_type', null);
    }
    const result = await this.dbManagerService.updateStatus(data, data.object_type);
    return new ResponseDto(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  /**
   * Updates the metadata of token.
   */
  @MessagePattern({ cmd: CMD.UPDATE_METADATA })
  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.UPDATE_METADATA}' with data: ${JSON.stringify(data)}`);
    const result = await this.dbManagerService.updateMetadata(data);
    return new ResponseDto(HttpStatus.OK, Statuses.SUCCESS, result);
  }
}
