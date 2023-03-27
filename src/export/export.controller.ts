import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { BadRequestException, Controller, Get, Query, Render, Res, UseFilters, UseGuards } from '@nestjs/common';
import { EXPORT_CONTROLLER } from '../common/constants';
import { Web3Service } from '../web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { LocalGuard } from '../auth/guards/local.guard';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UnauthorizedFilter } from '../auth/filters/unauthorized.filter';

@Controller(EXPORT_CONTROLLER)
export class ExportController {
  constructor(private config: ConfigService, private readonly web3Service: Web3Service) {}

  @Get()
  @UseGuards(JwtGuard)
  @UseFilters(UnauthorizedFilter)
  index(@Res() res: Response) {
    return res.render('export');
  }

  @Get('accounts')
  @UseGuards(LocalGuard)
  async exportPk(@Query('p') password: string, @Res() res: Response) {
    const isMatching = await bcrypt.compare(password, '$2b$10$z8faHb4nXOqHVXzEuH63UexAXGd0TK4w/6C1BA3nmHm.wiR7xXdAK');
    if (!isMatching) throw new BadRequestException('Wrong credentials provided');
    const csv = await this.web3Service.exportAccounts();

    res.header('Content-Type', 'text/csv');
    res.attachment('accounts.csv');
    res.send(Buffer.from(csv));
  }
}
