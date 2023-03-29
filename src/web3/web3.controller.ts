import { Controller, Logger, UseInterceptors, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD, ExceptionTypes, WEB3_CONTROLLER } from '../common/constants';
import { ResponseDto } from '../common/dto/response.dto';
import { CallDto } from './dto/call.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { DeployDto } from './dto/deploy.dto';
import { WhitelistOptionsDto } from './dto/whitelist-options.dto';
import { Web3Service } from './web3.service';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import { TransactionReceipt } from 'web3-core';
import { RpcLogger } from '../common/interceptors/rpc-loger.interceptor';
import { SendAdminDto } from './dto/send-admin.dto';
import { GetAdminDto } from './dto/get-admin.dto';
import { ExceptionFilter } from '../common/filters/exception.filter';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateWalletCommand } from './commands/create-wallet.command';
import { DeployCommand } from './commands/deploy.command';
import { MintCommand } from './commands/mint.command';
import { WhitelistCommand } from './commands/whitelist.command';
import { CommonCommand } from './commands/common.command';
import { GetMerkleProofQuery } from './queries/get-merkle-proof.query';

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
    return await this.commandBus.execute(new CreateWalletCommand(data));
  }

  /**
   * Processes a deployment.
   */
  @MessagePattern({ cmd: CMD.DEPLOY })
  async processDeploy(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: DeployDto): Promise<ResponseDto> {
    return await this.commandBus.execute(new DeployCommand(data));
  }

  /**
   * Processes a mint.
   */
  @MessagePattern({ cmd: CMD.MINT })
  async processMint(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallDto): Promise<ResponseDto> {
    return await this.commandBus.execute(new MintCommand(data));
  }

  /**
   * Processes a whitelist.
   */
  @MessagePattern({ cmd: CMD.WHITELIST })
  async processWhitelist(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallDto): Promise<ResponseDto> {
    return await this.commandBus.execute(new WhitelistCommand(data));
  }

  /**
   * Processes a common call.
   */
  @MessagePattern({ cmd: CMD.COMMON })
  async processCommon(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: CallDto): Promise<ResponseDto> {
    return await this.commandBus.execute(new CommonCommand(data));
  }

  /**
   * Gets a Merkle proof for a given address.
   */
  @MessagePattern({ cmd: CMD.GET_MERKLE_PROOF })
  async getMerkleProof(@Payload(new ValidationPipe(ExceptionTypes.RPC)) data: WhitelistOptionsDto): Promise<ResponseDto> {
    return await this.queryBus.execute(new GetMerkleProofQuery(data));
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
