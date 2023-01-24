import { Controller, Logger, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { CMD, ExceptionTypes, ProcessTypes, Statuses, WEB3_CONTROLLER } from '../../common/constants';
import { JobResult } from '../../common/dto/jobResult.dto';
import { Response } from '../../common/dto/response.dto';
import { CallRequest } from './dto/requests/call.request';
import { CreateWalletRequest } from './dto/requests/createWallet.request';
import { DeployRequest } from './dto/requests/deploy.request';
import { GetJobRequest } from './dto/requests/getJob.request';
import { WhitelistRequest } from './dto/requests/whitelist.request';
import { Web3Service } from './web3.service';
import { ValidationPipe } from '../../common/pipes/validation.pipe';

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
  async createWallet(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CreateWalletRequest,
  ): Promise<Observable<JobResult>> {
    this.logger.log(`Processing call '${CMD.CREATE_WALLET}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.CREATE_WALLET);
  }

  /**
   * Processes a deployment.
   */
  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: DeployRequest,
  ): Promise<Observable<JobResult>> {
    this.logger.log(`Processing call '${CMD.DEPLOY}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.DEPLOY);
  }

  /**
   * Processes a mint.
   */
  @MessagePattern({ cmd: CMD.MINT })
  async processMint(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallRequest,
  ): Promise<Observable<JobResult>> {
    this.logger.log(`Processing call '${CMD.MINT}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.MINT);
  }

  /**
   * Processes a whitelist.
   */
  @MessagePattern({ cmd: CMD.WHITELIST })
  async processWhitelist(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallRequest,
  ): Promise<Observable<JobResult>> {
    this.logger.log(`Processing call '${CMD.WHITELIST}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.WHITELIST);
  }

  /**
   * Processes a common call.
   */
  @MessagePattern({ cmd: CMD.COMMON })
  async processCommon(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallRequest,
  ): Promise<Observable<JobResult>> {
    this.logger.log(`Processing call '${CMD.COMMON}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.COMMON);
  }

  /**
   * Gets a Merkle proof for a given address.
   */
  @MessagePattern({ cmd: CMD.GET_MERKLE_PROOF })
  async getMerkleProof(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: WhitelistRequest,
  ): Promise<Observable<JobResult>> {
    this.logger.log(`Processing call '${CMD.GET_MERKLE_PROOF}' with data: ${JSON.stringify(data)}`);
    return await this.web3Service.processJob(data, ProcessTypes.MERKLE_PROOF);
  }

  /**
   * Gets the result of a job.
   */
  @MessagePattern({ cmd: CMD.JOB })
  async getJob(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetJobRequest): Promise<Response> {
    this.logger.log(`Processing call '${CMD.JOB}' with data: ${JSON.stringify(data)}`);
    const result = await this.web3Service.getJob(data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }

  // @MessagePattern({ cmd: CMD.PREDICT_ADDRESS })
  // async predict(data: PredictDto): Promise<ResponseDto> {
  //   this.logger.log(`Processing call '${CMD.JOB}' with data: ${JSON.stringify(data)}`);
  //   const result = await this.web3Service.predictContractAddress(data);
  //   return new ResponseDto(HttpStatus.OK, Statuses.SUCCESS, result);
  // }
}
