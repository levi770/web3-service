import { Observable } from 'rxjs';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CMD, ObjectTypes, OperationTypes, ProcessTypes } from './common/constants';
import { DeployDataDto } from './web3-manager/dto/deployData.dto';
import { GetAllDto } from './db-manager/dto/getAll.dto';
import { JobResultDto } from './common/dto/jobResult.dto';
import { MintDataDto } from './web3-manager/dto/mintData.dto';
import { ResponseDto } from './common/dto/response.dto';
import { DbManagerService } from './db-manager/db-manager.service';
import { Web3Service } from './web3-manager/web3.service';
import { MetaDataDto } from './web3-manager/dto/metaData.dto';
import { GetOneDto } from './db-manager/dto/getOne.dto';
import { GetJobDto } from './web3-manager/dto/getJob.dto';
import { UpdateMetadataDto } from './db-manager/dto/updateMetadata.dto';
import { AllObjectsDto } from './db-manager/dto/allObjects.dto';
import { TokenModel } from './db-manager/models/token.model';
import { ContractModel } from './db-manager/models/contract.model';
import { WhitelistModel } from './db-manager/models/whitelist.model';

@Controller()
export class AppController {
  constructor(private web3Service: Web3Service, private dbManagerService: DbManagerService) {}

  @MessagePattern({ cmd: CMD.JOB })
  async getJob(data: GetJobDto): Promise<ResponseDto> {
    return await this.web3Service.getJob(data);
  }

  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(data: DeployDataDto): Promise<Observable<JobResultDto>> {
    return await this.web3Service.process(data, ProcessTypes.DEPLOY);
  }

  @MessagePattern({ cmd: CMD.CALL })
  async processCall(data: MintDataDto): Promise<Observable<JobResultDto>> {
    return await this.web3Service.process(data, ProcessTypes.COMMON);
  }

  @MessagePattern({ cmd: CMD.CALL })
  async processWhitelist(data: MintDataDto): Promise<Observable<JobResultDto>> {
    return await this.web3Service.process(data, ProcessTypes.WHITELIST);
  }

  @MessagePattern({ cmd: CMD.ALL_OBJECTS })
  async getAllObjects(data: GetAllDto): Promise<AllObjectsDto> {
    return await this.dbManagerService.getAllObjects(ObjectTypes.CONTRACT, data);
  }

  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  async getOneObject(data: GetOneDto): Promise<TokenModel | ContractModel | WhitelistModel> {
    return await this.dbManagerService.getOneObject(ObjectTypes.CONTRACT, data);
  }

  @MessagePattern({ cmd: CMD.UPDATE_METADATA })
  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    return await this.dbManagerService.updateMetadata(data);
  }

  @Get('metadata/:id')
  async getMetaData(@Param('id') id: string): Promise<MetaDataDto> {
    return await this.dbManagerService.getMetadata(id);
  }
}
