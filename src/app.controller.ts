import { Controller, Get, HttpStatus, Logger, Param, UseInterceptors, UsePipes } from '@nestjs/common';
import { Response } from './common/dto/response.dto';
import { DbService } from './modules/db/db.service';
import { GetMetadataRequest } from './modules/db/dto/requests/getMetadata.request';
import { IMetaData } from './modules/web3/interfaces/metaData.interface';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ExceptionTypes } from './common/constants';
import { HttpLogger } from './common/interceptors/http-loger.interceptor';

const logger = new Logger('AppController');

/**
 * A controller for handling web3 and database operations.
 */
@UseInterceptors(new HttpLogger(logger))
@Controller()
export class AppController {
  constructor(private dbManagerService: DbService) {}

  /**
   * Gets the health status of microservice.
   */
  @Get('health')
  async getHealth(): Promise<Response> {
    return new Response(HttpStatus.OK, 'active', null);
  }

  /**
   * Gets the metadata of token.
   */
  @Get('metadata/:slug/:id')
  @UsePipes(new ValidationPipe(ExceptionTypes.RPC))
  async getMetaData(@Param() params: GetMetadataRequest): Promise<IMetaData> {
    return await this.dbManagerService.getMetadata(params);
  }
}
