import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { DeployDataDto } from './dto/deployData.dto';
import { GetAllContractsDto } from './dto/getAllContracts.dto';
import { MintDataDto } from './dto/mintData.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('contracts')
  async allContracts(@Query() query?: GetAllContractsDto) {
    return this.appService.allContracts(query);
  }
}
