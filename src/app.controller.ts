import { AllObjectsDto } from './db-manager/dto/allObjects.dto';
import { CallDataDto } from './web3-manager/dto/callData.dto';
import { CMD, ObjectTypes, OperationTypes, ProcessTypes, Statuses } from './common/constants';
import { ContractModel } from './db-manager/models/contract.model';
import { Controller, Get, HttpCode, HttpStatus, Logger, Param, Query } from '@nestjs/common';
import { DbManagerService } from './db-manager/db-manager.service';
import { DeployDataDto } from './web3-manager/dto/deployData.dto';
import { GetAllDto } from './db-manager/dto/getAll.dto';
import { GetJobDto } from './web3-manager/dto/getJob.dto';
import { GetOneDto } from './db-manager/dto/getOne.dto';
import { JobResultDto } from './common/dto/jobResult.dto';
import { MessagePattern } from '@nestjs/microservices';
import { MetaDataDto } from './web3-manager/dto/metaData.dto';
import { MetadataModel } from './db-manager/models/metadata.model';
import { Observable } from 'rxjs';
import { ResponseDto } from './common/dto/response.dto';
import { TokenModel } from './db-manager/models/token.model';
import { TransactionReceipt } from 'web3-core';
import { UpdateMetadataDto } from './db-manager/dto/updateMetadata.dto';
import { UpdateStatusDto } from './db-manager/dto/updateStatus.dto';
import { Web3Service } from './web3-manager/web3.service';
import { WhitelistDto } from './web3-manager/dto/whitelist.dto';
import { WhitelistModel } from './db-manager/models/whitelist.model';

@Controller()
/**
 * A controller for handling web3 and database operations.
 *
 * @export
 * @class AppController
 */
export class AppController {
  /**
   * A logger for logging messages.
   * @private
   */
  private logger: Logger;

  /**
   * Creates an instance of `AppController`.
   *
   * @param {Web3Service} web3Service - A service for interacting with the Ethereum network.
   * @param {DbManagerService} dbManagerService - A service for interacting with the database.
   * @memberof AppController
   * @constructor
   */
  constructor(private web3Service: Web3Service, private dbManagerService: DbManagerService) {
    this.logger = new Logger('AppController');
  }

  @MessagePattern({ cmd: CMD.DEPLOY })
  /**
   * Processes a deployment.
   *
   * @param {DeployDataDto} data - The deployment data.
   * @returns {Promise<Observable<JobResultDto>>} A promise that resolves to an observable of the deployment result.
   */
  async processDeploy(data: DeployDataDto): Promise<Observable<JobResultDto>> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
    // Process the deployment using the Web3 service, passing in the deployment data and the process type
    return await this.web3Service.process(data, ProcessTypes.DEPLOY);
  }

  @MessagePattern({ cmd: CMD.CALL })
  /**
   * Processes a call.
   *
   * @param {CallDataDto} data - The call data.
   * @returns {Promise<Observable<JobResultDto>>} A promise that resolves to an observable of the call result.
   */
  async processCall(data: CallDataDto): Promise<Observable<JobResultDto>> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.CALL}' with data: ${JSON.stringify(data)}`);

    // If the operation type is a whitelist add or remove, process the call using the Web3 service
    //and the "whitelist" process type
    if (
      data.operation_type === OperationTypes.WHITELIST_ADD ||
      data.operation_type === OperationTypes.WHITELIST_REMOVE
    ) {
      return await this.web3Service.process(data, ProcessTypes.WHITELIST);
    }

    // Otherwise, process the call using the Web3 service and the "common" process type
    return await this.web3Service.process(data, ProcessTypes.COMMON);
  }

  @MessagePattern({ cmd: CMD.JOB })
  /**
   * Gets the result of a job.
   *
   * @param {GetJobDto} data - The job data.
   * @returns {Promise<ResponseDto>} A promise that resolves to the job result.
   */
  async getJob(data: GetJobDto): Promise<ResponseDto> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.JOB}' with data: ${JSON.stringify(data)}`);
    // Get the job result using the Web3 service
    return await this.web3Service.getJob(data);
  }

  @MessagePattern({ cmd: CMD.GET_MERKLE_PROOF })
  /**
   * Gets a Merkle proof for a given address.
   *
   * @param {WhitelistDto} data - The data for the proof.
   * @returns {Promise<ResponseDto>} A promise that resolves to the proof.
   */
  async getMerkleProof(data: WhitelistDto): Promise<ResponseDto> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.GET_MERKLE_PROOF}' with data: ${JSON.stringify(data)}`);

    // Destructure the contract ID and address from the data
    const { contract_id, address } = data;

    // Retrieve the whitelist using the contract ID
    const whitelist = (await this.dbManagerService.getAllObjects(ObjectTypes.WHITELIST, { contract_id }))
      .rows as WhitelistModel[];

    // Get the Merkle root of the whitelist
    const merkleRoot = await this.web3Service.getMerkleRoot(whitelist);
    // Get the Merkle proof for the given address
    const merkleProof = await this.web3Service.getMerkleProof(whitelist, address);

    // Return the Merkle root and proof in a response object
    return new ResponseDto(HttpStatus.OK, null, { merkleRoot, merkleProof });
  }

  @MessagePattern({ cmd: CMD.ALL_OBJECTS })
  /**
   * Gets all objects of a specified type.
   *
   * @param {GetAllDto} data - The data for the objects to retrieve.
   * @return {Promise<AllObjectsDto>} - A promise that resolves to an object with the retrieved objects
   * and the total number of objects.
   */
  async getAllObjects(data: GetAllDto): Promise<AllObjectsDto> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.ALL_OBJECTS}' with data: ${JSON.stringify(data)}`);
    // Retrieve the objects using the object type and other optional query parameters from the data object
    return await this.dbManagerService.getAllObjects(data.object_type, data);
  }

  @MessagePattern({ cmd: CMD.ONE_OBJECT })
  /**
   * Gets a single object of a specified type.
   *
   * @param {GetOneDto} data - The data for the object to retrieve.
   * @return {Promise<TokenModel | ContractModel | WhitelistModel | MetadataModel>} - A promise that resolves
   * to the retrieved object.
   */
  async getOneObject(data: GetOneDto): Promise<TokenModel | ContractModel | WhitelistModel | MetadataModel> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.ONE_OBJECT}' with data: ${JSON.stringify(data)}`);
    // Retrieve the object using the object type and other query parameters from the data object
    return await this.dbManagerService.getOneObject(data.object_type, data);
  }

  @MessagePattern({ cmd: CMD.UPDATE_STATUS })
  /**
   * Updates the status of a job.
   *
   * @param {UpdateStatusDto} data - The data for the status update.
   * @return {Promise<ResponseDto>} - A promise that resolves to a response object indicating the success or failure
   * of the update.
   */
  async updateStatus(data: UpdateStatusDto): Promise<ResponseDto> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.UPDATE_STATUS}' with data: ${JSON.stringify(data)}`);

    let txReceipt: TransactionReceipt;

    // If a transaction receipt is provided, use it
    if (data.tx_receipt) {
      txReceipt = data.tx_receipt;
    }
    // Otherwise, retrieve the transaction receipt using the transaction hash and network
    else {
      txReceipt = await this.web3Service.getTxReceipt(data.tx_hash, data.network);
    }

    // Determine the status based on the transaction receipt
    const status = !txReceipt ? Statuses.UNKNOWN : txReceipt.status ? Statuses.PROCESSED : Statuses.FAILED;

    // Update the status using the status and other data
    return await this.dbManagerService.updateStatus({ status, ...data });
  }

  @MessagePattern({ cmd: CMD.UPDATE_METADATA })
  /**
   * Updates the metadata of a contract.
   *
   * @param {UpdateMetadataDto} data - The data for the metadata update.
   * @return {Promise<ResponseDto>} - A promise that resolves to a response object indicating the success or failure
   * of the update.
   */
  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    // Log the received data
    this.logger.log(`Processing call '${CMD.UPDATE_METADATA}' with data: ${JSON.stringify(data)}`);
    // Update the metadata using the provided data
    return await this.dbManagerService.updateMetadata(data);
  }

  @Get('metadata/:id')
  /**
   * Gets the metadata of a contract.
   *
   * @param {string} id - The ID of the contract.
   * @return {Promise<MetaDataDto>} - A promise that resolves to the metadata of the contract.
   */
  async getMetaData(@Param('id') id: string): Promise<MetaDataDto> {
    // Log the received ID
    this.logger.log(`Processing GET request 'metadata' with id: ${id}`);
    // Retrieve the metadata using the ID
    return await this.dbManagerService.getMetadata(id);
  }
}
