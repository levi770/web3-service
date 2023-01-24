import { Controller, Logger, HttpStatus } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { CMD, ProcessTypes, Statuses, WEB3_CONTROLLER } from '../../common/constants';
import { JobResultDto } from '../../common/dto/jobResult.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { CallDataDto } from './dto/callData.dto';
import { CreateWalletDto } from './dto/createWallet.dto';
import { DeployDataDto } from './dto/deployData.dto';
import { GetJobDto } from './dto/getJob.dto';
import { WhitelistDto } from './dto/whitelist.dto';
import { Web3Service } from './web3.service';
import { PredictDto } from './dto/predict.dto';

/**
 * A controller for handling web3 operations.
 */
@Controller(WEB3_CONTROLLER)
export class Web3Controller {
  private logger: Logger;

  constructor(private web3Service: Web3Service) {
    this.logger = new Logger('Web3Controller');
  }

  /**
   * Creates a new encrypted wallet keystore in DB.
   */
  @MessagePattern({ cmd: CMD.CREATE_WALLET })
  async createWallet(data: CreateWalletDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.CREATE_WALLET}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.CREATE_WALLET);
  }

  /**
   * Processes a deployment.
   */
  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(data: DeployDataDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.DEPLOY);
  }

  /**
   * Processes a mint.
   */
  @MessagePattern({ cmd: CMD.MINT })
  async processMint(data: CallDataDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.MINT}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.MINT);
  }

  /**
   * Processes a whitelist.
   */
  @MessagePattern({ cmd: CMD.WHITELIST })
  async processWhitelist(data: CallDataDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.WHITELIST}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.WHITELIST);
  }

  /**
   * Processes a common call.
   */
  @MessagePattern({ cmd: CMD.COMMON })
  async processCommon(data: CallDataDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.COMMON}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.COMMON);
  }

  /**
   * Gets a Merkle proof for a given address.
   */
  @MessagePattern({ cmd: CMD.GET_MERKLE_PROOF })
  async getMerkleProof(data: WhitelistDto): Promise<Observable<JobResultDto>> {
    this.logger.log(`Processing call '${CMD.GET_MERKLE_PROOF}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.MERKLE_PROOF);
  }

  /**
   * Gets the result of a job.
   */
  @MessagePattern({ cmd: CMD.JOB })
  async getJob(data: GetJobDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.JOB}' with data: ${JSON.stringify(data)}`);
    const result = await this.web3Service.getJob(data);
    return new ResponseDto(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  @MessagePattern({ cmd: CMD.PREDICT_ADDRESS })
  async predict(data: PredictDto): Promise<ResponseDto> {
    this.logger.log(`Processing call '${CMD.JOB}' with data: ${JSON.stringify(data)}`);
    const result = await this.web3Service.predictContractAddress(data);
    return new ResponseDto(HttpStatus.OK, Statuses.SUCCESS, result);
  }
}
