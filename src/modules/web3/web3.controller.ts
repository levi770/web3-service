import { Controller, Logger, HttpStatus, UseInterceptors } from '@nestjs/common';
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
import { TransactionReceipt } from 'web3-core';
import { RpcLogger } from '../../common/interceptors/rpc-loger.interceptor';
import { SendAdminDto } from './dto/requests/sendAdmin.dto';
import { GetAdminDto } from './dto/requests/getAdmin.dto';

const logger = new Logger('Web3Controller');

/**
 * A controller for handling web3 operations.
 */
@Controller(WEB3_CONTROLLER)
export class Web3Controller {
  constructor(private web3Service: Web3Service) {}

  /**
   * Creates a new encrypted wallet keystore in DB.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.CREATE_WALLET })
  async createWallet(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CreateWalletRequest,
  ): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.CREATE_WALLET);
  }

  /**
   * Returns admin wallet address.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.GET_ADMIN })
  async getAdmin(@Payload() data: GetAdminDto): Promise<string> {
    return await this.web3Service.getAdmin(data);
  }

  /**
   * Sends transaction from admin wallet address.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.SEND_ADMIN })
  async sendAdmin(@Payload() data: SendAdminDto): Promise<TransactionReceipt> {
    return await this.web3Service.sendAdmin(data);
  }

  /**
   * Processes a deployment.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: DeployRequest,
  ): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.DEPLOY);
  }

  /**
   * Processes a mint.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.MINT })
  async processMint(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallRequest,
  ): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.MINT);
  }

  /**
   * Processes a whitelist.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.WHITELIST })
  async processWhitelist(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallRequest,
  ): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.WHITELIST);
  }

  /**
   * Processes a common call.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.COMMON })
  async processCommon(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallRequest,
  ): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.COMMON);
  }

  /**
   * Gets a Merkle proof for a given address.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.GET_MERKLE_PROOF })
  async getMerkleProof(
    @Payload(new ValidationPipe(ExceptionTypes.RPC)) data: WhitelistRequest,
  ): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.MERKLE_PROOF);
  }

  /**
   * Gets the result of a job.
   */
  @UseInterceptors(new RpcLogger(logger))
  @MessagePattern({ cmd: CMD.JOB })
  async getJob(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: GetJobRequest): Promise<Response> {
    const result = await this.web3Service.getJob(data);
    return new Response(HttpStatus.OK, Statuses.SUCCESS, result);
  }
}
