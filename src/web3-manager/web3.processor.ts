import Web3 from 'web3';
import * as U from 'web3-utils';
import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { MintDataDto } from './dto/mintData.dto';
import { DbManagerService } from '../db-manager/db-manager.service';
import { Web3Service } from './web3.service';
import { DeployDataDto } from './dto/deployData.dto';
import { FileTypes, Networks, ObjectTypes } from '../common/constants';
import { ResponseDto } from '../common/dto/response.dto';
import { NftContract } from '../common/contracts/types/nft-contract';
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service';
import { MetaDataDto } from './dto/metaData.dto';

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

  @Process('mint')
  async mint(job: Job) {
    try {
      const mintData: MintDataDto = job.data;
      const w3: Web3 = mintData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractObj = await this.dbManager.findByPk(mintData.contract_id);
      const contractInstance = new w3.eth.Contract(contractObj.deploy_data.abi as U.AbiItem[]);
      const contractMethods: NftContract = contractInstance.methods;
      const txData = contractMethods.mintTo(mintData.mint_to, mintData.nft_number);
      const mintTx = await this.web3Service.send(contractInstance, txData, false, mintData.network);
      const metaData = this.generateMetadata(mintData);

      const tokenObj = await this.dbManager.create(
        {
          address: mintTx.contractAddress,
          nft_number: mintData.nft_number,
          meta_data: metaData,
          mint_data: mintData,
          mint_tx: mintTx,
        },
        ObjectTypes.TOKEN,
      );

      return tokenObj;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Process('deploy')
  async deploy(job: Job) {
    try {
      const deployData: DeployDataDto = job.data;
      const w3: Web3 = deployData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);
      const args = deployData.args;
      const txData = contractInstance.deploy({
        data: deployData.bytecode,
        arguments: [args.supplyLimit, args.mintPrice, args.withdrawalWallet, args.name, args.ticker, args.baseURI],
      });
      const deployTx = await this.web3Service.send(contractInstance, txData, true, deployData.network);

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
      throw new InternalServerErrorException(error.message);
    }
  }

  async generateMetadata(data: MintDataDto) {
    //const fileId = await this.ipfsManger.upload(data.asset_url);
    const metadata = data.meta_data;

    switch (data.asset_type) {
      case FileTypes.IMAGE:
        //metadata.image = fileId;
        break;

      case FileTypes.OBJECT:
        //metadata.model_url = fileId;
        break;
    }

    return metadata;
  }
}
