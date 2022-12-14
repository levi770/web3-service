import * as U from 'web3-utils'
import MerkleTree from 'merkletreejs'
import Web3 from 'web3'
import { CallDataDto } from './dto/callData.dto'
import { CallResultDto } from './dto/callResult.dto'
import { ConfigService } from '@nestjs/config'
import { ContractModel } from '../db-manager/models/contract.model'
import { DbManagerService } from '../db-manager/db-manager.service'
import { DeployDataDto } from './dto/deployData.dto'
import { DeployResultDto } from './dto/deployResult.dto'
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service'
import { Job } from 'bull'
import { MetaDataDto } from './dto/metaData.dto'
import { MetadataModel } from '../db-manager/models/metadata.model'
import { MintDataDto } from './dto/mintData.dto'
import { Process, Processor } from '@nestjs/bull'
import { RpcException } from '@nestjs/microservices'
import { TokenModel } from '../db-manager/models/token.model'
import { TxObj } from './interfaces/txObj.interface'
import { Web3Service } from './web3.service'
import { WhitelistDto } from './dto/whitelist.dto'
import { WhitelistModel } from '../db-manager/models/whitelist.model'
import {
  FileTypes,
  MetadataTypes,
  Networks,
  ObjectTypes,
  OperationTypes,
  ProcessTypes,
  Statuses,
} from '../common/constants';

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

  @Process(ProcessTypes.WHITELIST)
  async processWhitelist(job: Job): Promise<CallResultDto> {
    try {
      const callData: CallDataDto = job.data;
      const w3: Web3 = callData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractObj = (await this.dbManager.findById(callData.contract_id, ObjectTypes.CONTRACT)) as ContractModel;

      if (!contractObj) {
        throw new RpcException('contract not found');
      }

      let merkle: { merkleRoot: any; merkleProof?: any };

      const whitelistOptions = {
        status: callData.execute ? Statuses.PROCESSED : Statuses.CREATED,
        contract_id: contractObj.id,
        address: (callData.operation_options as WhitelistDto).address,
      };

      if (!whitelistOptions) {
        throw new RpcException('operation specific options missed');
      }

      switch (callData.operation_type) {
        case OperationTypes.WHITELIST_ADD: {
          const addressObj = await this.dbManager.getOneObject(ObjectTypes.WHITELIST, {
            address: whitelistOptions.address,
            contract_id: whitelistOptions.contract_id,
          });

          if (addressObj) {
            throw new RpcException('Address already exist in whitelist');
          }

          const whitelistObj = await this.dbManager.create(whitelistOptions, ObjectTypes.WHITELIST);

          if (!whitelistObj) {
            throw new RpcException('Failed to create whitelist object');
          }

          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              contract_id: callData.contract_id,
            })
          ).rows as WhitelistModel[];

          merkle = await this.web3Service.getMerkleRootProof(whitelist, whitelistOptions.address);

          break;
        }

        case OperationTypes.WHITELIST_REMOVE: {
          const deleted = await this.dbManager.delete(whitelistOptions, ObjectTypes.WHITELIST);

          if (deleted === 0) {
            throw new RpcException('Failed to remove whitelist object');
          }

          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              contract_id: callData.contract_id,
            })
          ).rows;

          merkle = await this.web3Service.getMerkleRootProof(whitelist as WhitelistModel[]);

          break;
        }
      }

      const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi as U.AbiItem[], contractObj.address);
      const abiObj = (contractObj as ContractModel).deploy_data.abi.find(
        (x) => x.name === callData.method_name && x.type === 'function',
      );

      if (!abiObj) {
        throw new RpcException('method not found');
      }

      const callArgs = [merkle.merkleRoot];
      const isValidArgs = callArgs.length === abiObj.inputs.length;

      if (!isValidArgs) {
        throw new RpcException('arguments length is not valid');
      }

      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);

      const txObj: TxObj = {
        execute: callData.execute,
        network: callData.network,
        contract: contractInst,
        data: txData,
        operationType: OperationTypes.COMMON,
      };

      const callTx = await this.web3Service.send(txObj);

      return { merkle, callTx };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Process(ProcessTypes.COMMON)
  async processCall(job: Job): Promise<CallResultDto> {
    try {
      const callData: CallDataDto = job.data;
      const w3: Web3 = callData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractObj = (await this.dbManager.getOneObject(ObjectTypes.CONTRACT, {
        id: callData.contract_id,
        include_child: true,
      })) as ContractModel;

      if (!contractObj) {
        throw new RpcException('contract not found');
      }

      const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi as U.AbiItem[], contractObj.address);
      const abiObj = contractObj.deploy_data.abi.find((x) => x.name === callData.method_name && x.type === 'function');

      if (!abiObj) {
        throw new RpcException('method not found');
      }

      const callArgs = callData.arguments ? await this.getArgs(callData.arguments, abiObj.inputs) : [];

      if (callData.operation_type === OperationTypes.READ_CONTRACT) {
        const callResult = await contractInst.methods[callData.method_name](...callArgs).call();

        return { [callData.method_name]: callResult };
      }

      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);

      const txObj: TxObj = {
        execute: callData.execute,
        network: callData.network,
        contract: contractInst,
        data: txData,
        operationType: OperationTypes.COMMON,
      };

      const callTx = await this.web3Service.send(txObj);
      const tx = callData.execute ? callTx.txReceipt : null;

      switch (callData.operation_type) {
        case OperationTypes.COMMON:
          return { callTx };

        case OperationTypes.MINT:
          const mintOptions = callData?.operation_options as MintDataDto;

          if (!mintOptions) {
            throw new RpcException('operation specific options missed');
          }

          const status = callData.execute ? Statuses.PROCESSED : Statuses.CREATED;

          const tokenObj = (await this.dbManager.create(
            {
              status,
              contract_id: contractObj.id,
              address: contractObj.address,
              nft_number: mintOptions.nft_number,
              mint_data: mintOptions,
              tx_hash: tx?.transactionHash,
              tx_receipt: tx,
            },
            ObjectTypes.TOKEN,
          )) as TokenModel;

          let metadataObj: MetadataModel;

          if (mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type) {
            const meta_data = await this.getMetadata(mintOptions);

            metadataObj = (await this.dbManager.create(
              { status: Statuses.CREATED, type: MetadataTypes.SPECIFIED, token_id: tokenObj.id, meta_data },
              ObjectTypes.METADATA,
            )) as MetadataModel;

            await this.dbManager.setMetadata(
              { object_id: tokenObj.id, metadata_id: metadataObj.id },
              ObjectTypes.TOKEN,
            );

            return { callTx, meta_data, metadataObj, tokenObj };
          }

          metadataObj = contractObj.metadata;
          await this.dbManager.setMetadata({ object_id: tokenObj.id, metadata_id: metadataObj.id }, ObjectTypes.TOKEN);

          return { callTx, metadataObj, tokenObj };
      }
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Process(ProcessTypes.DEPLOY)
  async deploy(job: Job): Promise<DeployResultDto> {
    try {
      const deployData: DeployDataDto = job.data;
      const w3: Web3 = deployData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);

      const txData = contractInstance.deploy({
        data: deployData.bytecode,
        arguments: deployData.arguments.split('::'),
      });

      const txObj: TxObj = {
        execute: deployData.execute,
        network: deployData.network,
        contract: contractInstance,
        data: txData.encodeABI(),
        operationType: OperationTypes.DEPLOY,
      };

      const deployTx = await this.web3Service.send(txObj);
      const tx = deployData.execute ? deployTx.txReceipt : null;

      const contractObj = (await this.dbManager.create(
        {
          status: deployData.execute ? Statuses.PROCESSED : Statuses.CREATED,
          address: tx?.contractAddress ?? null,
          deploy_data: deployData,
          deploy_tx: tx,
        },
        ObjectTypes.CONTRACT,
      )) as ContractModel;

      if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
        const meta_data = await this.getMetadata(deployData);
        const metadataObj = (await this.dbManager.create(
          { status: Statuses.CREATED, type: MetadataTypes.COMMON, meta_data },
          ObjectTypes.METADATA,
        )) as MetadataModel;

        await this.dbManager.setMetadata(
          { object_id: contractObj.id, metadata_id: metadataObj.id },
          ObjectTypes.CONTRACT,
        );

        return { deployTx, meta_data, metadataObj, contractObj };
      }

      return { deployTx, contractObj };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getMetadata(data: MintDataDto | DeployDataDto): Promise<MetaDataDto> {
    const fileId = await this.ipfsManger.upload(data.asset_url);
    const metadata = data.meta_data;

    switch (data.asset_type) {
      case FileTypes.IMAGE:
        metadata.image = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;

      case FileTypes.OBJECT:
        metadata.model_url = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;
    }

    return metadata;
  }

  async getArgs(args: string, inputs: U.AbiInput[]) {
    try {
      const argsArr = args.split('::');

      if (argsArr.length !== inputs.length) {
        throw new RpcException('arguments length is not valid');
      }

      return argsArr.map((value, index) => {
        if (inputs[index].type === 'bytes32[]') {
          return JSON.parse(value);
        }

        return value;
      });
    } catch (error) {
      throw new RpcException('Failed to get arguments: ' + error);
    }
  }
}
