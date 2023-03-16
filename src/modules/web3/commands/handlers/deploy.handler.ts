import Web3 from 'web3';
import * as U from 'web3-utils';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { Web3Service } from '../../web3.service';
import { RpcException } from '@nestjs/microservices';
import { ObjectTypes, OperationTypes, Statuses } from '../../../../common/constants';
import { DbService } from '../../../db/db.service';
import { ResponseDto } from '../../../../common/dto/response.dto';
import { DeployCommand } from '../deploy.command';
import { ContractModel } from '../../../db/models/contract.model';
import { TxPayloadDto } from '../../interfaces/txPayload.dto';
import { ContractDeployedEvent } from '../../events/contract-deployed.event';

@CommandHandler(DeployCommand)
export class DeployHandler implements ICommandHandler<DeployCommand> {
  constructor(private readonly w3Service: Web3Service, private readonly dbService: DbService, private readonly eventBus: EventBus) {}
  async execute(command: DeployCommand) {
    try {
      const { data } = command;
      const w3: Web3 = this.w3Service.getWeb3(data.network);
      const { wallet, keystore } = await this.w3Service.getWallet(data);
      const contractInst = new w3.eth.Contract(data.abi as U.AbiItem[]);
      const contractPayload = { status: Statuses.CREATED, deploy_data: data, slug: data.slug, price: data.price };
      const [contractModel] = await this.dbService.create<ContractModel>([contractPayload], ObjectTypes.CONTRACT);
      const txPayload: TxPayloadDto = {
        execute: data.execute,
        network: data.network,
        contract_inst: contractInst,
        contract_model: contractModel,
        from_address: data.from_address,
        data: contractInst.deploy({ data: data.bytecode, arguments: data.arguments.split('::') }).encodeABI(),
        operation_type: OperationTypes.DEPLOY,
        keystore: keystore,
      };
      const tx = await this.w3Service.processTx(txPayload);
      this.eventBus.publish(new ContractDeployedEvent({ payload: data, contract: contractModel, wallet, tx }));
      return new ResponseDto(HttpStatus.OK, [Statuses.SUCCESS], [{ tx, contract: contractModel }]);
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
