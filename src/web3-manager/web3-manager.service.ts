import Web3 from 'web3';
import * as U from 'web3-utils';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { DeployDataDto } from '../common/dto/deployData.dto';
import { Contract, ContractSendMethod } from 'web3-eth-contract';
import { MintDataDto } from '../common/dto/mintData.dto';
import { DbManagerService } from '../db-manager/db-manager.service';
import { NewTokenDto } from '../common/dto/newToken.dto';
import { NewContractDto } from '../common/dto/newContract.dto';

@Injectable()
export class Web3ManagerService {
  constructor(private configService: ConfigService, private dbManagerService: DbManagerService, private w3: Web3) {
    this.w3 = new Web3(new Web3.providers.HttpProvider(configService.get('WEB3_HOST')));
  }

  async mint(mintData: MintDataDto) {
    try {
      const contractObj = await this.dbManagerService.findByPk(mintData.contractId);
      const contract = new this.w3.eth.Contract(contractObj.deployData.abi as U.AbiItem[]);
      const data = contract.methods.mint(mintData.address, mintData.tokenId, mintData.qty, Buffer.from(mintData.name));
      const mintTx = await this.send(contract, data, false);
      const tokenObj = await this.dbManagerService.create({
        address: mintTx.contractAddress,
        mintData,
        mintTx,
      } as NewTokenDto);

      return { status: HttpStatus.OK, message: null, result: tokenObj };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async deploy(deployData: DeployDataDto) {
    try {
      const contract = new this.w3.eth.Contract(deployData.abi as U.AbiItem[]);
      const data = contract.deploy({ data: deployData.bytecode, arguments: deployData.args });
      const deployTx = await this.send(contract, data, true);
      const contractObj = await this.dbManagerService.create({
        address: deployTx.contractAddress,
        deployData,
        deployTx,
      } as NewContractDto);

      return { status: HttpStatus.OK, message: null, result: contractObj };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async send(contract: Contract, data: ContractSendMethod, deploy: boolean) {
    try {
      const account = this.w3.eth.accounts.privateKeyToAccount(this.configService.get('PRIV_KEY'));

      const tx = {
        nonce: await this.w3.eth.getTransactionCount(account.address),
        from: account.address,
        to: contract.options.address,
        gas: await data.estimateGas({ from: account.address, value: 0 }),
        maxPriorityFeePerGas: await this.w3.eth.getGasPrice(),
        data: data.encodeABI(),
        value: 0,
      };

      if (deploy) {
        delete tx.to;
      }

      const comission = +tx.gas * +tx.maxPriorityFeePerGas;
      const balance = await this.w3.eth.getBalance(account.address);

      if (+balance < comission) {
        throw new RpcException('Not enough balance');
      }

      const signed = await account.signTransaction(tx);
      return await this.w3.eth.sendSignedTransaction(signed.rawTransaction);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
