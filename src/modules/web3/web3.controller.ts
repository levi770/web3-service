import { Controller, Logger, UseInterceptors, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { CMD, ExceptionTypes, ProcessTypes, Statuses, WEB3_CONTROLLER } from '../../common/constants';
import { JobResult } from '../../common/dto/jobResult.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { CallDto } from './dto/requests/call.dto';
import { CreateWalletDto } from './dto/requests/createWallet.dto';
import { DeployDto } from './dto/requests/deploy.dto';
import { WhitelistRequest } from './dto/requests/whitelist.request';
import { Web3Service } from './web3.service';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { TransactionReceipt } from 'web3-core';
import { RpcLogger } from '../../common/interceptors/rpc-loger.interceptor';
import { SendAdminDto } from './dto/requests/sendAdmin.dto';
import { GetAdminDto } from './dto/requests/getAdmin.dto';
import { ExceptionFilter } from '../../common/filters/exception.filter';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateWalletCommand } from './commands/create-wallet.command';
import { DeployCommand } from './commands/deploy.command';
import { MintCommand } from './commands/mint.command';

const logger = new Logger('Web3Controller');

/**
 * A controller for handling web3 operations.
 */
@UseInterceptors(new RpcLogger(logger))
@UseFilters(new ExceptionFilter())
@Controller(WEB3_CONTROLLER)
export class Web3Controller {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus, private readonly web3Service: Web3Service) {}

  /**
   * Creates a new encrypted wallet keystore in DB.
   */
  @MessagePattern({ cmd: CMD.CREATE_WALLET })
  async createWallet(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CreateWalletDto): Promise<ResponseDto> {
    return this.commandBus.execute(new CreateWalletCommand(data));
  }

  /**
   * Processes a deployment.
   */
  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: DeployDto): Promise<ResponseDto> {
    return this.commandBus.execute(new DeployCommand(data));
  }

  /**
   * Processes a mint.
   */
  @MessagePattern({ cmd: CMD.MINT })
  async processMint(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallDto): Promise<ResponseDto> {
    return this.commandBus.execute(new MintCommand(data));
  }

  /**
   * Processes a whitelist.
   */
  @MessagePattern({ cmd: CMD.WHITELIST })
  async processWhitelist(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallDto): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.WHITELIST);
  }

  /**
   * Processes a common call.
   */
  @MessagePattern({ cmd: CMD.COMMON })
  async processCommon(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallDto): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.COMMON);
  }

  /**
   * Gets a Merkle proof for a given address.
   */
  @MessagePattern({ cmd: CMD.GET_MERKLE_PROOF })
  async getMerkleProof(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: WhitelistRequest): Promise<Observable<JobResult>> {
    return await this.web3Service.process(data, ProcessTypes.MERKLE_PROOF);
  }

  /**
   * Returns admin wallet address.
   */
  @MessagePattern({ cmd: CMD.GET_ADMIN })
  async getAdmin(@Payload() data: GetAdminDto): Promise<string> {
    return await this.web3Service.getAdmin(data);
  }

  /**
   * Sends transaction from admin wallet address.
   */
  @MessagePattern({ cmd: CMD.SEND_ADMIN })
  async sendAdmin(@Payload() data: SendAdminDto): Promise<TransactionReceipt> {
    return await this.web3Service.sendAdmin(data);
  }
}
