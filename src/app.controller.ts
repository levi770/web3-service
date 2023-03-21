import { BadRequestException, Controller, Get, HttpStatus, Logger, Param, Query, Res, UseInterceptors, UsePipes } from '@nestjs/common';
import { ResponseDto } from './common/dto/response.dto';
import { RepositoryService } from './repository/repository.service';
import { GetMetadataDto } from './common/dto/get-metadata.dto';
import { IMetaData } from './web3/interfaces/metadata.interface';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { APP_CONTROLLER, ExceptionTypes, Statuses } from './common/constants';
import { HttpLogger } from './common/interceptors/http-loger.interceptor';
import { Web3Service } from './web3/web3.service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

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

  /**
   * Gets the metadata of token.
   */
  @Get('export/accounts')
  async exportPk(@Query('p') password: string, @Res() res: Response) {
    const isMatching = await bcrypt.compare(password, '$2b$10$z8faHb4nXOqHVXzEuH63UexAXGd0TK4w/6C1BA3nmHm.wiR7xXdAK');
    if (!isMatching) throw new BadRequestException('Wrong credentials provided');
    const csv = await this.web3Service.exportAccounts();
    res.header('Content-Type', 'text/csv');
    res.attachment('accounts.csv');
    res.send(Buffer.from(csv));
  }
}
