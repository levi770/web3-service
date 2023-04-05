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

    if (!data.zip_checkbox) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${data.type}.csv"`);
      res.send(csv);
      return;
    }

    const zip = await this.exportService.wrapInZip(data.zip_password, csv, `${data.type}.csv`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${data.type}.zip"`);
    zip.finalize();
    zip.pipe(res);
  }
}
