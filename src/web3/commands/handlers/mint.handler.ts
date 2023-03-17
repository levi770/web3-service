import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { Web3Service } from '../../web3.service';
import { RpcException } from '@nestjs/microservices';
import { ObjectTypes, OperationTypes, Statuses } from '../../../common/constants';
import { RepositoryService } from '../../../repository/repository.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import { MintCommand } from '../mint.command';
import Web3 from 'web3';
import { MintOptionsDto } from '../../dto/mint-options.dto';
import { TokenModel } from '../../../repository/models/token.model';
import { TxPayloadDto } from '../../dto/txPayload.dto';
import { TokensMintedEvent } from '../../events/tokens-minted.event';

@CommandHandler(MintCommand)
export class MintHandler implements ICommandHandler<MintCommand> {
  constructor(
    private readonly w3Service: Web3Service,
    private readonly repository: RepositoryService,
    private readonly eventBus: EventBus,
  ) {}
  async execute(command: MintCommand) {
    try {
      const { data } = command;
      const w3: Web3 = this.w3Service.getWeb3(data.network);
      const { keystore } = await this.w3Service.getWallet(data);
      const { contractModel, contractInst, abiObj } = await this.w3Service.getContract(data, w3);
      const mintOptions = data?.operation_options as MintOptionsDto;
      if (!mintOptions) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'operation specific options missed' });
      const isMetadataExist = mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type ? true : false;
      if (!isMetadataExist && !contractModel.metadata)
        throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'metadata missed' });
      const { ids_range, ids_array } = await this.w3Service.getTokenId(contractInst, mintOptions.qty);
      const tokenPayload = {
        status: Statuses.CREATED,
        contract_id: contractModel.id,
        address: contractModel.address,
        qty: mintOptions.qty,
        token_ids: ids_array,
      };
      const [tokenModel] = await this.repository.create<TokenModel>([tokenPayload], ObjectTypes.TOKEN);
      const callArgs = this.w3Service.getArgs(data.arguments.toString(), abiObj.inputs);
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
      const txPayload: TxPayloadDto = {
        execute: data.execute,
        operation_type: OperationTypes.MINT,
        network: data.network,
        contract_inst: contractInst,
        contract_model: contractModel,
        token_model: tokenModel,
        from_address: data.from_address,
        data: txData,
        keystore: keystore,
      };
      const tx = await this.w3Service.processTx(txPayload);
      this.eventBus.publish(new TokensMintedEvent({ payload: mintOptions, contract: contractModel, token: tokenModel, ids_range }));
      return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, { tx, token: tokenModel });
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
