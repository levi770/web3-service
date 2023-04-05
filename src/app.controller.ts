import { Controller, Get, HttpStatus, Logger, Param, UseInterceptors, UsePipes } from '@nestjs/common';
import { ResponseDto } from './common/dto/response.dto';
import { RepositoryService } from './repository/repository.service';
import { GetMetadataDto } from './common/dto/get-metadata.dto';
import { IMetaData } from './web3/interfaces/metadata.interface';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { APP_CONTROLLER, ExceptionTypes, Statuses } from './common/constants';
import { HttpLogger } from './common/interceptors/http-loger.interceptor';
import { Web3Service } from './web3/web3.service';

const logger = new Logger(APP_CONTROLLER);

/**
 * A controller for handling web3 and database operations.
 */
@UseInterceptors(new HttpLogger(logger))
@Controller()
export class AppController {
  constructor(private readonly dbService: RepositoryService, private readonly web3Service: Web3Service) {}

  /**
   * Gets the health status of microservice.
   */
  @Get('health')
  async getHealth(): Promise<ResponseDto> {
    return new ResponseDto(HttpStatus.OK, [Statuses.ACTIVE], null);
  }

  /**
   * Gets the metadata of token.
   */
  @Get('metadata/:slug/:id')
  @UsePipes(new ValidationPipe(ExceptionTypes.HTTP))
  async getMetaData(@Param() params: GetMetadataDto): Promise<IMetaData> {
    return await this.dbService.getMetadata(params);
  }
}
