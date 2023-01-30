import { Controller, Get, HttpStatus, Logger, Param, UsePipes } from '@nestjs/common';
import { Response } from './common/dto/response.dto';
import { DbService } from './modules/db/db.service';
import { GetMetadataRequest } from './modules/db/dto/requests/getMetadata.request';
import { IMetaData } from './modules/web3/interfaces/metaData.interface';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ExceptionTypes } from './common/constants';

/**
 * A controller for handling web3 and database operations.
 */
@Controller()
export class AppController {
  private logger: Logger;

  constructor(private dbManagerService: DbService) {
    this.logger = new Logger('AppController');
  }

  /**
   * Gets the health status of microservice.
   */
  @Get('health')
  async getHealth(): Promise<Response> {
    this.logger.log(`Processing GET request 'health'`);
    return new Response(HttpStatus.OK, 'active', null);
  }

  /**
   * Gets the metadata of token.
   */
  @Get('metadata/:address/:id')
  @UsePipes(new ValidationPipe(ExceptionTypes.RPC))
  async getMetaData(@Param() params: GetMetadataRequest): Promise<IMetaData> {
    this.logger.log(`Processing GET request 'metadata' with id: ${JSON.stringify(params)}`);
    return await this.dbManagerService.getMetadata(params);
  }
}
