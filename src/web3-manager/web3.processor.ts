import Web3 from 'web3';
import * as U from 'web3-utils';
import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
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
    private ethereum: Web3,
    private polygon: Web3,
  ) {
    this.ethereum = new Web3(new Web3.providers.HttpProvider(this.configService.get('ETHEREUM_HOST')));
    this.polygon = new Web3(new Web3.providers.HttpProvider(this.configService.get('POLYGON_HOST')));
  }

  @Process('mint')
  async mint(job: Job) {
    try {
      const mintData: MintDataDto = job.data;
      const w3: Web3 = mintData.network === 1 ? this.ethereum : this.polygon;
      const contractObj = await this.dbManagerService.findByPk(mintData.contractId);
      const contractInstance = new w3.eth.Contract(contractObj.deployData.abi as U.AbiItem[]);
      const txData = contractInstance.methods.mint(
        contractObj.address,
        mintData.nft_number,
        Buffer.from(mintData.title),
      );
      const mintTx = await this.web3Service.send(contractInstance, txData, false);
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
      const w3: Web3 = deployData.network === 1 ? this.ethereum : this.polygon;
      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);
      const txData = contractInstance.deploy({ data: deployData.bytecode, arguments: deployData.args });
      const deployTx = await this.web3Service.send(contractInstance, txData, true);
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
