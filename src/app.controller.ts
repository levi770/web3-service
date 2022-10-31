import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ProcessTypes } from './common/constants';
import { DeployDataDto } from './common/dto/deployData.dto';
import { GetAllContractsDto } from './common/dto/getAllContracts.dto';
import { JobResultDto } from './common/dto/jobResult.dto';
import { MintDataDto } from './common/dto/mintData.dto';
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
}
