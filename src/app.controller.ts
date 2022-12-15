import { AllObjectsDto } from './db-manager/dto/allObjects.dto'
import { CallDataDto } from './web3-manager/dto/callData.dto'
import { CMD, ObjectTypes, OperationTypes, ProcessTypes, Statuses } from './common/constants'
import { ContractModel } from './db-manager/models/contract.model'
import { Controller, Get, HttpCode, HttpStatus, Logger, Param, Query } from '@nestjs/common'
import { DbManagerService } from './db-manager/db-manager.service'
import { DeployDataDto } from './web3-manager/dto/deployData.dto'
import { GetAllDto } from './db-manager/dto/getAll.dto'
import { GetJobDto } from './web3-manager/dto/getJob.dto'
import { GetOneDto } from './db-manager/dto/getOne.dto'
import { JobResultDto } from './common/dto/jobResult.dto'
import { MessagePattern } from '@nestjs/microservices'
import { MetaDataDto } from './web3-manager/dto/metaData.dto'
import { MetadataModel } from './db-manager/models/metadata.model'
import { Observable } from 'rxjs'
import { ResponseDto } from './common/dto/response.dto'
import { TokenModel } from './db-manager/models/token.model'
import { TransactionReceipt } from 'web3-core'
import { UpdateMetadataDto } from './db-manager/dto/updateMetadata.dto'
import { UpdateStatusDto } from './db-manager/dto/updateStatus.dto'
import { Web3Service } from './web3-manager/web3.service'
import { WhitelistDto } from './web3-manager/dto/whitelist.dto'
import { WhitelistModel } from './db-manager/models/whitelist.model'

@Controller()
export class AppController {
  private logger: Logger;

  constructor(private web3Service: Web3Service, private dbManagerService: DbManagerService) {
    this.logger = new Logger('AppController');
  }

  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(data: DeployDataDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);

    return await this.web3Service.process(data, ProcessTypes.DEPLOY);
  }

  @MessagePattern({ cmd: CMD.CALL })
  async processCall(data: CallDataDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.CALL}' with data: ${JSON.stringify(data)}`);

    if (
      data.operation_type === OperationTypes.WHITELIST_ADD ||
      data.operation_type === OperationTypes.WHITELIST_REMOVE
    ) {
      return await this.web3Service.process(data, ProcessTypes.WHITELIST);
    }

    return await this.web3Service.process(data, ProcessTypes.COMMON);
  }

  @MessagePattern({ cmd: CMD.JOB })
  async getJob(data: GetJobDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.JOB}' with data: ${JSON.stringify(data)}`);

    return await this.web3Service.getJob(data);
  }

  @MessagePattern({ cmd: CMD.GET_MERKLE_PROOF })
  async getMerkleProof(data: WhitelistDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.GET_MERKLE_PROOF}' with data: ${JSON.stringify(data)}`);

    const { contract_id, address } = data;

    const whitelist = (await this.dbManagerService.getAllObjects(ObjectTypes.WHITELIST, { contract_id }))
      .rows as WhitelistModel[];

    const merkleRoot = await this.web3Service.getMerkleRoot(whitelist);
    const merkleProof = await this.web3Service.getMerkleProof(whitelist, address);

    return new ResponseDto(HttpStatus.OK, null, { merkleRoot, merkleProof });
  }

  @MessagePattern({ cmd: CMD.ALL_OBJECTS })
  async getAllObjects(data: GetAllDto): Promise<AllObjectsDto> {
    this.logger.log(`Processing call '${CMD.ALL_OBJECTS}' with data: ${JSON.stringify(data)}`);

    return await this.dbManagerService.getAllObjects(data.object_type, data);
  }

  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  async getOneObject(data: GetOneDto): Promise<TokenModel | ContractModel | WhitelistModel | MetadataModel> {
    this.logger.log(`Processing call '${CMD.ONE_OBJECT}' with data: ${JSON.stringify(data)}`);

    return await this.dbManagerService.getOneObject(data.object_type, data);
  }

  @MessagePattern({ cmd: CMD.UPDATE_STATUS })
  async updateStatus(data: UpdateStatusDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.UPDATE_STATUS}' with data: ${JSON.stringify(data)}`);

    let txReceipt: TransactionReceipt;

    if (data.tx_receipt) {
      txReceipt = data.tx_receipt;
    } else {
      txReceipt = await this.web3Service.getTxReceipt(data.tx_hash, data.network);
    }

    const status = !txReceipt ? Statuses.UNKNOWN : txReceipt.status ? Statuses.PROCESSED : Statuses.FAILED;

    return await this.dbManagerService.updateStatus({ status, ...data });
  }

  @MessagePattern({ cmd: CMD.UPDATE_METADATA })
  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.UPDATE_METADATA}' with data: ${JSON.stringify(data)}`);

    return await this.dbManagerService.updateMetadata(data);
  }

  @Get('metadata/:id')
  async getMetaData(@Param('id') id: string): Promise<MetaDataDto> {
    this.logger.log(`Processing GET request 'metadata' with id: ${id}`);

    return await this.dbManagerService.getMetadata(id);
  }
}
