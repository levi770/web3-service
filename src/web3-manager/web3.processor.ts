import Web3 from 'web3';
import * as U from 'web3-utils';
import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { MintDataDto } from './dto/mintData.dto';
import { DbManagerService } from '../db-manager/db-manager.service';
import { Web3Service } from './web3.service';
import { DeployDataDto } from './dto/deployData.dto';
import { FileTypes, Networks, ObjectTypes, ProcessTypes } from '../common/constants';
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service';
import { ContractModel } from '../db-manager/models/contract.model';
import { TokenModel } from '../db-manager/models/token.model';
import { MetaDataDto } from './dto/metaData.dto';
import { RpcException } from '@nestjs/microservices';

@Processor('web3')
export class Web3Processor {
  private ethereum: Web3;
  private polygon: Web3;

  constructor(
    private configService: ConfigService,
    private dbManager: DbManagerService,
    private ipfsManger: IpfsManagerService,
    private web3Service: Web3Service,
  ) {
    this.ethereum = new Web3(new Web3.providers.HttpProvider(this.configService.get('ETHEREUM_HOST')));
    this.polygon = new Web3(new Web3.providers.HttpProvider(this.configService.get('POLYGON_HOST')));
  }

  @Process(ProcessTypes.MINT)
  async mint(job: Job): Promise<ContractModel | TokenModel> {
    try {
      const mintData: MintDataDto = job.data;
      const w3: Web3 = mintData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractObj = await this.dbManager.findByPk(mintData.contract_id);
      const contractInstance = new w3.eth.Contract(contractObj.deploy_data.abi as U.AbiItem[], contractObj.address);
      const methodArgs = mintData.arguments.split(',');
      const methodObj = contractObj.deploy_data.abi.find(
        (x) => x.name === mintData.method_name && x.type === 'function',
      );
      
      const txData = w3.eth.abi.encodeFunctionCall(methodObj, methodArgs);
      const mintTx = await this.web3Service.send(contractInstance, txData, ProcessTypes.MINT, mintData.network);
      const metaData = await this.generateMetadata(mintData);
      
      const tokenObj = await this.dbManager.create(
        {
          address: contractObj.address,
          nft_number: mintData.nft_number,
          meta_data: metaData,
          mint_data: mintData,
          mint_tx: mintTx,
        },
        ObjectTypes.TOKEN,
      );

      await contractObj.$add('token', [tokenObj.id]);

      return tokenObj;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Process(ProcessTypes.DEPLOY)
  async deploy(job: Job): Promise<ContractModel | TokenModel> {
    try {
      const deployData: DeployDataDto = job.data;
      const w3: Web3 = deployData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);
      
      const txData = contractInstance.deploy({ data: deployData.bytecode, arguments: deployData.args.split(',') });
      const deployTx = await this.web3Service.send(contractInstance, txData.encodeABI(), ProcessTypes.DEPLOY, deployData.network);

      const contractObj = await this.dbManager.create(
        {
          address: deployTx.contractAddress,
          deploy_data: deployData,
          deploy_tx: deployTx,
        },
        ObjectTypes.CONTRACT,
      );

      return contractObj;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async generateMetadata(data: MintDataDto): Promise<MetaDataDto> {
    const fileId = await this.ipfsManger.upload(data.asset_url);
    const metadata = data.meta_data;

    switch (data.asset_type) {
      case FileTypes.IMAGE:
        metadata.image = `${fileId}/${data.asset_url}`;
        break;

      case FileTypes.OBJECT:
        metadata.model_url = `${fileId}/${data.asset_url}`;
        break;
    }

    return metadata;
  }
}
