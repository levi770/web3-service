import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Query,
  Res,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { Response as Dto } from './common/dto/response.dto';
import { DbService } from './modules/db/db.service';
import { GetMetadataRequest } from './modules/db/dto/requests/getMetadata.request';
import { IMetaData } from './modules/web3/interfaces/metaData.interface';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { ExceptionTypes } from './common/constants';
import { HttpLogger } from './common/interceptors/http-loger.interceptor';
import { Web3Service } from './modules/web3/web3.service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

const logger = new Logger('AppController');

/**
 * A controller for handling web3 and database operations.
 */
@UseInterceptors(new HttpLogger(logger))
@Controller()
export class AppController {
  constructor(private dbManagerService: DbService, private web3Service: Web3Service) {}

  /**
   * Gets the health status of microservice.
   */
  @Get('health')
  async getHealth(): Promise<Dto> {
    return new Dto(HttpStatus.OK, 'active', null);
  }

  /**
   * Gets the metadata of token.
   */
  @Get('metadata/:slug/:id')
  @UsePipes(new ValidationPipe(ExceptionTypes.RPC))
  async getMetaData(@Param() params: GetMetadataRequest): Promise<IMetaData> {
    return await this.dbManagerService.getMetadata(params);
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
