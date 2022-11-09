import { Observable } from 'rxjs';
import { Controller, Get, Query } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProcessTypes } from './common/constants';
import { DeployDataDto } from './web3-manager/dto/deployData.dto';
import { GetAllContractsDto } from './db-manager/dto/getAllContracts.dto';
import { JobResultDto } from './common/dto/jobResult.dto';
import { MintDataDto } from './web3-manager/dto/mintData.dto';
import { ResponseDto } from './common/dto/response.dto';
import { DbManagerService } from './db-manager/db-manager.service';
import { Web3Service } from './web3-manager/web3.service';

@Controller()
export class AppController {
  constructor(private web3Service: Web3Service, private dbManagerService: DbManagerService) {}

  @MessagePattern({ cmd: 'deployContract' })
  async deployMessage(data: DeployDataDto): Promise<Observable<JobResultDto>> {
    return await this.web3Service.process(data, ProcessTypes.DEPLOY);
  }

  @MessagePattern({ cmd: 'mintToken' })
  async mintMessage(data: MintDataDto): Promise<Observable<JobResultDto>> {
    return await this.web3Service.process(data, ProcessTypes.MINT);
  }

  @MessagePattern({ cmd: 'getAllContracts' })
  async getAllContracts(data: GetAllContractsDto): Promise<ResponseDto> {
    return await this.dbManagerService.getAllContracts(data);
  }

  @Get('metadata/:id')
  async getMetaData(@Query('id') id: string) {
    return await this.dbManagerService.getMetadata(id);
  }
}
