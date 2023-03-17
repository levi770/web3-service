import Web3 from 'web3';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { Web3Service } from '../../web3.service';
import { RpcException } from '@nestjs/microservices';
import { OperationTypes, Statuses } from '../../../common/constants';
import { RepositoryService } from '../../../repository/repository.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import { WhitelistCommand } from '../whitelist.command';
import { WhitelistOptionsDto } from '../../dto/whitelist-options.dto';
import { WhitelistModel } from '../../../repository/models/whitelist.model';
import { TxPayloadDto } from '../../dto/txPayload.dto';

@CommandHandler(WhitelistCommand)
export class WhitelistHandler implements ICommandHandler<WhitelistCommand> {
  constructor(private readonly w3Service: Web3Service, private readonly repository: RepositoryService) {}
  async execute(command: WhitelistCommand) {
    try {
      const { data } = command;
      const w3: Web3 = this.w3Service.getWeb3(data.network);
      const { keystore } = await this.w3Service.getWallet(data);
      const { contractModel, contractInst, abiObj } = await this.w3Service.getContract(data, w3);
      const whitelistOptions = data.operation_options as WhitelistOptionsDto;
      let root: string, proof: { address: string; proof: string[] }[], new_whitelist: WhitelistModel[];
      if (!whitelistOptions) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'operation specific options missed' });

      switch (data.operation_type) {
        case OperationTypes.WHITELIST_ADD: {
          new_whitelist = await this.repository.addWhitelist(whitelistOptions, contractModel);
          const whitelist = await this.repository.getWhitelist(contractModel);
          root = await this.w3Service.getMerkleRoot(whitelist);
          proof = await Promise.all(
            new_whitelist.map(async (x) => {
              const proof = await this.w3Service.getMerkleProof(whitelist, x.address);
              return { address: x.address, proof };
            }),
          );
          break;
        }
        case OperationTypes.WHITELIST_REMOVE: {
          await this.repository.removeWhitelist(whitelistOptions, contractModel);
          const whitelist = await this.repository.getWhitelist(contractModel);
          root = await this.w3Service.getMerkleRoot(whitelist);
          break;
        }
      }

      const callArgs = this.w3Service.getArgs([root].toString(), abiObj.inputs);
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
      const txPayload: TxPayloadDto = {
        execute: data.execute,
        operation_type: data.operation_type,
        network: data.network,
        contract_inst: contractInst,
        contract_model: contractModel,
        whitelist_model: new_whitelist,
        from_address: data.from_address,
        data: txData,
        keystore: keystore,
      };
      const tx = await this.w3Service.processTx(txPayload);
      return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, { root, proof, tx });
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
