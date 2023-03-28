import { Response } from 'express';
import { Body, Controller, Get, Post, Res, UseFilters, UseGuards } from '@nestjs/common';
import { EXPORT_CONTROLLER } from '../common/constants';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UnauthorizedFilter } from '../auth/filters/unauthorized.filter';
import { ExportDto } from './dto/export.dto';
import { ExportService } from './export.service';
import { BadRequestFilter } from '../auth/filters/badrequest.filter';

@Controller(EXPORT_CONTROLLER)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  @UseGuards(JwtGuard)
  @UseFilters(UnauthorizedFilter, BadRequestFilter)
  index(@Res() res: Response) {
    return res.render('export');
  }

  @Post()
  @UseGuards(JwtGuard)
  @UseFilters(UnauthorizedFilter, BadRequestFilter)
  async exportPk(@Body() data: ExportDto, @Res() res: Response) {
    const csv = await this.exportService.exportAccounts(data.type);
    if (data.zip_checkbox === 'on') {
      const zip = await this.exportService.wrapInZip(data.zip_password, csv, `${data.type}.csv`);
      res.header('Content-Type', 'application/zip');
      res.attachment(`${data.type}.zip`);
      res.send(zip);
      return;
    }
    res.header('Content-Type', 'text/csv');
    res.attachment('accounts.csv');
    res.send(Buffer.from(csv));
  }
}
