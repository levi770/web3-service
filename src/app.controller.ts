import { Controller, Get, HttpStatus, Logger, Param } from '@nestjs/common';
import { ResponseDto } from './common/dto/response.dto';
import { DbService } from './modules/db/db.service';
import { GetMetadataDto } from './modules/db/dto/getMetadata.dto';
import { MetaDataDto } from './modules/web3/dto/metaData.dto';

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
  async getHealth(): Promise<ResponseDto> {
    this.logger.log(`Processing GET request 'health'`);
    return new ResponseDto(HttpStatus.OK, 'active', null);
  }

  /**
   * Gets the metadata of token.
   */
  @Get('metadata/:address/:id')
  async getMetaData(@Param() params: GetMetadataDto): Promise<MetaDataDto> {
    this.logger.log(`Processing GET request 'metadata' with id: ${JSON.stringify(params)}`);
    return await this.dbManagerService.getMetadata(params);
  }
}
