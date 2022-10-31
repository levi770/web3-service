import Web3 from 'web3';
import * as U from 'web3-utils';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { MintDataDto } from '../common/dto/mintData.dto';
import { DbManagerService } from '../db-manager/db-manager.service';
import { Web3Service } from './web3.service';
import { DeployDataDto } from '../common/dto/deployData.dto';
import { ObjectTypes } from '../common/constants';
import { ResponseDto } from '../common/dto/response.dto';

@Processor('web3')
export class Web3Processor {
  constructor(
    private configService: ConfigService,
    private dbManagerService: DbManagerService,
    private web3Service: Web3Service,
    private w3: Web3,
  ) {
    this.w3 = new Web3(new Web3.providers.HttpProvider(this.configService.get('WEB3_HOST')));
  }

  @Process('mint')
  async mint(job: Job) {
    try {
      const mintData: MintDataDto = job.data;
      const contractObj = await this.dbManagerService.findByPk(mintData.contractId);
      const contract = new this.w3.eth.Contract(contractObj.deployData.abi as U.AbiItem[]);
      const data = contract.methods.mint(mintData.address, mintData.tokenId, mintData.qty, Buffer.from(mintData.name));
      const mintTx = await this.web3Service.send(contract, data, false);
      const tokenObj = await this.dbManagerService.create(
        {
          address: mintTx.contractAddress,
          mintData,
          mintTx,
        },
        ObjectTypes.TOKEN,
      );

      return new ResponseDto(HttpStatus.OK, null, tokenObj);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @Process('deploy')
  async deploy(job: Job) {
    try {
      const deployData: DeployDataDto = job.data;
      const contract = new this.w3.eth.Contract(deployData.abi as U.AbiItem[]);
      const data = contract.deploy({ data: deployData.bytecode, arguments: deployData.args });
      const deployTx = await this.web3Service.send(contract, data, true);
      const contractObj = await this.dbManagerService.create(
        {
          address: deployTx.contractAddress,
          deployData,
          deployTx,
        },
        ObjectTypes.CONTRACT,
      );

      return new ResponseDto(HttpStatus.OK, null, contractObj);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
