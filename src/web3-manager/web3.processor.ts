import Web3 from 'web3';
import * as U from 'web3-utils';
import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { MintDataDto } from './dto/mintData.dto';
import { DbManagerService } from '../db-manager/db-manager.service';
import { Web3Service } from './web3.service';
import { DeployDataDto } from './dto/deployData.dto';
import { FileTypes, Networks, ObjectTypes, OperationTypes, ProcessTypes } from '../common/constants';
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service';
import { ContractModel } from '../db-manager/models/contract.model';
import { TokenModel } from '../db-manager/models/token.model';
import { MetaDataDto } from './dto/metaData.dto';
import { RpcException } from '@nestjs/microservices';
import { CallDataDto } from './dto/callData.dto';
import { WhitelistDto } from './dto/whitelist.dto';
import { WhitelistModel } from '../db-manager/models/whitelist.model';
import MerkleTree from 'merkletreejs';

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
  async processWhitelist(job: Job) {
    try {
      const callData: CallDataDto = job.data;
      const w3: Web3 = callData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractObj = await this.dbManager.findById(callData.contract_id, ObjectTypes.CONTRACT);

      if (!contractObj) {
        throw new RpcException('contract not found');
      }

      let root: string, proof: string[];

      const whitelistOptions = callData?.operation_options as WhitelistDto;

      if (!whitelistOptions) {
        throw new RpcException('operation specific options missed');
      }

      switch (callData.operation_type) {
        case OperationTypes.WHITELIST_ADD: {
          const whitelistObj = await this.dbManager.create(whitelistOptions, ObjectTypes.WHITELIST);

          if (!whitelistObj) {
            throw new RpcException('whitelist object creation failed');
          }

          const whitelist = (await this.dbManager.getAllObjects(ObjectTypes.WHITELIST)).rows;
          const { merkleRoot, merkleProof } = await this.getMerkleRootProof(
            whitelist as WhitelistModel[],
            whitelistOptions.address,
          );

          root = merkleRoot;
          proof = merkleProof;

          break;
        }

        case OperationTypes.WHITELIST_REMOVE: {
          const deleted = await this.dbManager.delete(whitelistOptions, ObjectTypes.WHITELIST);

          if (deleted === 0) {
            throw new RpcException('whitelist object creation failed');
          }

          const whitelist = (await this.dbManager.getAllObjects(ObjectTypes.WHITELIST)).rows;
          const { merkleRoot } = await this.getMerkleRootProof(whitelist as WhitelistModel[]);
          root = merkleRoot;

          break;
        }
      }

      const contractInst = new w3.eth.Contract(
        (contractObj as ContractModel).deploy_data.abi as U.AbiItem[],
        contractObj.address,
      );

      const abiObj = (contractObj as ContractModel).deploy_data.abi.find(
        (x) => x.name === callData.method_name && x.type === 'function',
      );

      if (!abiObj) {
        throw new RpcException('method not found');
      }

      const callArgs = [root];

      const isValidArgs = callArgs.length === abiObj.inputs.length;

      if (!isValidArgs) {
        throw new RpcException('arguments length is not valid');
      }

      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
      const tx = await this.web3Service.send(callData.network, contractInst, txData);

      return { proof, ...tx };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Process(ProcessTypes.COMMON)
  async processCall(job: Job) {
    try {
      const callData: CallDataDto = job.data;
      const w3: Web3 = callData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractObj = await this.dbManager.findById(callData.contract_id, ObjectTypes.CONTRACT);

      if (!contractObj) {
        throw new RpcException('contract not found');
      }

      const contractInst = new w3.eth.Contract(
        (contractObj as ContractModel).deploy_data.abi as U.AbiItem[],
        contractObj.address,
      );
      const abiObj = (contractObj as ContractModel).deploy_data.abi.find(
        (x) => x.name === callData.method_name && x.type === 'function',
      );

      if (!abiObj) {
        throw new RpcException('method not found');
      }

      const callArgs = callData.arguments ? await this.getArgs(callData.arguments, abiObj.inputs) : [];

      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any);
      const tx = await this.web3Service.send(callData.network, contractInst, txData);

      switch (callData.operation_type) {
        case OperationTypes.COMMON:
          return tx;

        case OperationTypes.MINT:
          const mintOptions = callData?.operation_options as MintDataDto;

          if (!mintOptions) {
            throw new RpcException('operation specific options missed');
          }

          const metaData = await this.getMetadata(mintOptions);

          return await this.dbManager.create(
            {
              contract_id: contractObj.id,
              address: contractObj.address,
              nft_number: mintOptions.nft_number,
              meta_data: metaData,
              mint_data: mintOptions,
              mint_tx: tx,
            },
            ObjectTypes.TOKEN,
          );
      }
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Process(ProcessTypes.DEPLOY)
  async deploy(job: Job): Promise<ContractModel> {
    try {
      const deployData: DeployDataDto = job.data;
      const w3: Web3 = deployData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);

      const txData = contractInstance.deploy({ data: deployData.bytecode, arguments: deployData.arguments.split(',') });
      const deployTx = await this.web3Service.send(
        deployData.network,
        contractInstance,
        txData.encodeABI(),
        OperationTypes.DEPLOY,
      );

      const contractObj = await this.dbManager.create(
        {
          address: deployTx.contractAddress,
          deploy_data: deployData,
          deploy_tx: deployTx,
        },
        ObjectTypes.CONTRACT,
      );

      return contractObj as ContractModel;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getMetadata(data: MintDataDto): Promise<MetaDataDto> {
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

  async getMerkleRootProof(leaves: WhitelistModel[], leaf?: string) {
    const hash_leaves = leaves.map((x) => {
      return U.keccak256(x.address);
    });

    const tree = new MerkleTree(hash_leaves, U.keccak256, { sortPairs: true });
    const merkleRoot = tree.getHexRoot();

    if (leaf) {
      const merkleProof = tree.getHexProof(U.keccak256(leaf));
      return { merkleRoot, merkleProof };
    }

    return { merkleRoot };
  }

  async getArgs(args: string, inputs: U.AbiInput[]) {
    const argsArr = args.split('::');

    const isValidArgs = argsArr.length === inputs.length;

    if (!isValidArgs) {
      throw new RpcException('arguments length is not valid');
    }

    return argsArr.map((value, index, array) => {
      if (inputs[index].type === 'bytes32[]') {
        return JSON.parse(value);
      }

      return value;
    });
  }
}
