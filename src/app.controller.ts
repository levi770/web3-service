import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DeployDataDto } from './common/dto/deployData.dto';
import { GetAllContractsDto } from './common/dto/getAllContracts.dto';
import { MintDataDto } from './common/dto/mintData.dto';
import { ResponseDto } from './common/dto/response.dto';
import { DbManagerService } from './db-manager/db-manager.service';
import { Web3ManagerService } from './web3-manager/web3-manager.service';

@Controller()
export class AppController {
  constructor(private web3ManagerService: Web3ManagerService, private dbManagerService: DbManagerService) {}

  @MessagePattern({ cmd: 'deployContract' })
  async deployContractMessage(params: DeployDataDto): Promise<ResponseDto> {
    return await this.web3ManagerService.deploy(params);
  }

  @MessagePattern({ cmd: 'mintToken' })
  async mintTokenMessage(params: MintDataDto): Promise<ResponseDto> {
    return await this.web3ManagerService.mint(params);
  }

  @MessagePattern({ cmd: 'getAllContracts' })
  async getAllObjectsDataMessage(params: GetAllContractsDto): Promise<ResponseDto> {
    return await this.dbManagerService.getAllContracts(params);
  }
}
