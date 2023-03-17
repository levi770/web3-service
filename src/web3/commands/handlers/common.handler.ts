import Web3 from 'web3';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { Web3Service } from '../../web3.service';
import { RpcException } from '@nestjs/microservices';
import { OperationTypes, Statuses } from '../../../common/constants';
import { ResponseDto } from '../../../common/dto/response.dto';
import { CommonCommand } from '../common.command';
import { TxPayloadDto } from '../../dto/txPayload.dto';

@CommandHandler(CommonCommand)
export class CommonHandler implements ICommandHandler<CommonCommand> {
  constructor(private readonly w3Service: Web3Service) {}
  async execute(command: CommonCommand) {
    try {
      const { data } = command;
      const w3: Web3 = this.w3Service.getWeb3(data.network);
      const { keystore } = await this.w3Service.getWallet(data);
      const { contractModel, contractInst, abiObj } = await this.w3Service.getContract(data, w3);
      const callArgs = this.w3Service.getArgs(data.arguments, abiObj.inputs);
      // If the operation type is a read contract, call the method and return the result
      if (data.operation_type === OperationTypes.READ_CONTRACT) {
        const callResult = await contractInst.methods[data.method_name](...callArgs).call();
        return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, { [data.method_name]: callResult });
      }
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
      const txPayload: TxPayloadDto = {
        execute: data.execute,
        operation_type: OperationTypes.COMMON,
        network: data.network,
        contract_inst: contractInst,
        contract_model: contractModel,
        from_address: data.from_address,
        data: txData,
        keystore: keystore,
        value: data?.value,
      };
      const result = await this.w3Service.processTx(txPayload);
      return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, result);
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
