import { AllObjectsDto } from './db/dto/allObjects.dto';
import { CallDataDto } from './web3/dto/callData.dto';
import { CMD, ObjectTypes, OperationTypes, ProcessTypes, Statuses } from './common/constants';
import { Controller, Get, HttpCode, HttpStatus, Logger, Param, Query } from '@nestjs/common';
import { DeployDataDto } from './web3/dto/deployData.dto';
import { GetAllDto } from './db/dto/getAll.dto';
import { GetJobDto } from './web3/dto/getJob.dto';
import { GetOneDto } from './db/dto/getOne.dto';
import { JobResultDto } from './common/dto/jobResult.dto';
import { MessagePattern } from '@nestjs/microservices';
import { MetaDataDto } from './web3/dto/metaData.dto';
import { Observable } from 'rxjs';
import { ResponseDto } from './common/dto/response.dto';
import { TransactionReceipt, EncryptedKeystoreV3Json } from 'web3-core';
import { UpdateMetadataDto } from './db/dto/updateMetadata.dto';
import { UpdateStatusDto } from './db/dto/updateStatus.dto';
import { Web3Service } from './web3/web3.service';
import { WhitelistDto } from './web3/dto/whitelist.dto';
import { WhitelistModel } from './db/models/whitelist.model';
import { DbService } from './db/db.service';
import { FindModelResult } from './common/types';
import { CreateWalletDto } from './web3/dto/createWallet.dto';

/**
 * A controller for handling web3 and database operations.
 *
 * @export
 * @class AppController
 */
@Controller()
export class AppController {
  private logger: Logger;

  constructor(private web3Service: Web3Service, private dbManagerService: DbService) {
    this.logger = new Logger('AppController');
  }

  /**
   * Processes a deployment.
   *
   * @param {DeployDataDto} data - The deployment data.
   * @returns {Promise<Observable<JobResultDto>>} A promise that resolves to an observable of the deployment result.
   */
  @MessagePattern({ cmd: CMD.CREATE_WALLET })
  async createWallet(data: CreateWalletDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
    const wallet = await this.web3Service.newWallet();
    const created = await this.dbManagerService.create([{ team_id: data.team_id, ...wallet }], ObjectTypes.WALLET);
    return new ResponseDto(HttpStatus.CREATED, 'wallet created', { id: created[0].id, address: wallet.address });
  }

  /**
   * Processes a deployment.
   *
   * @param {DeployDataDto} data - The deployment data.
   * @returns {Promise<Observable<JobResultDto>>} A promise that resolves to an observable of the deployment result.
   */
  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(data: DeployDataDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.process(data, ProcessTypes.DEPLOY);
  }

  /**
   * Processes a call.
   *
   * @param {CallDataDto} data - The call data.
   * @returns {Promise<Observable<JobResultDto>>} A promise that resolves to an observable of the call result.
   */
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

  /**
   * Gets the result of a job.
   *
   * @param {GetJobDto} data - The job data.
   * @returns {Promise<ResponseDto>} A promise that resolves to the job result.
   */
  @MessagePattern({ cmd: CMD.JOB })
  async getJob(data: GetJobDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.JOB}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.getJob(data);
  }

  /**
   * Gets a Merkle proof for a given address.
   *
   * @param {WhitelistDto} data - The data for the proof.
   * @returns {Promise<ResponseDto>} A promise that resolves to the proof.
   */
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

  /**
   * Gets all objects of a specified type.
   *
   * @param {GetAllDto} data - The data for the objects to retrieve.
   * @return {Promise<AllObjectsDto>} - A promise that resolves to an object with the retrieved objects
   * and the total number of objects.
   */
  @MessagePattern({ cmd: CMD.ALL_OBJECTS })
  async getAllObjects(data: GetAllDto): Promise<AllObjectsDto> {
    this.logger.log(`Processing call '${CMD.ALL_OBJECTS}' with data: ${JSON.stringify(data)}`);
    return await this.dbManagerService.getAllObjects(data.object_type, data);
  }

  /**
   * Gets a single object of a specified type.
   *
   * @param {GetOneDto} data - The data for the object to retrieve.
   * @return {Promise<FindModelResult>} - A promise that resolves
   * to the retrieved object.
   */
  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  async getOneObject(data: GetOneDto): Promise<FindModelResult> {
    this.logger.log(`Processing call '${CMD.ONE_OBJECT}' with data: ${JSON.stringify(data)}`);
    return await this.dbManagerService.getOneObject(data.object_type, data);
  }

  /**
   * Updates the status of a job.
   *
   * @param {UpdateStatusDto} data - The data for the status update.
   * @return {Promise<ResponseDto>} - A promise that resolves to a response object indicating the success or failure
   * of the update.
   */
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

  /**
   * Updates the metadata of a contract.
   *
   * @param {UpdateMetadataDto} data - The data for the metadata update.
   * @return {Promise<ResponseDto>} - A promise that resolves to a response object indicating the success or failure
   * of the update.
   */
  @MessagePattern({ cmd: CMD.UPDATE_METADATA })
  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.UPDATE_METADATA}' with data: ${JSON.stringify(data)}`);
    return await this.dbManagerService.updateMetadata(data);
  }

  /**
   * Gets the metadata of a contract.
   *
   * @param {string} id - The ID of the contract.
   * @return {Promise<MetaDataDto>} - A promise that resolves to the metadata of the contract.
   */
  @Get('metadata/:id')
  async getMetaData(@Param('id') id: string): Promise<MetaDataDto> {
    this.logger.log(`Processing GET request 'metadata' with id: ${id}`);
    return await this.dbManagerService.getMetadata(id);
  }

  /**
   * Gets the health status.
   *
   * @return {string} - 200 status with "OK" message.
   */
  @Get('health')
  async getHealth(): Promise<ResponseDto> {
    this.logger.log(`Processing GET request 'health'`);
    return new ResponseDto(HttpStatus.OK, 'active', null);
  }
}
