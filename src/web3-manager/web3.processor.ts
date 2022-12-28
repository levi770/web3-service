import * as U from 'web3-utils';
import Web3 from 'web3';
import { CallDataDto } from './dto/callData.dto';
import { CallResultDto } from './dto/callResult.dto';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db-manager/models/contract.model';
import { DbManagerService } from '../db-manager/db-manager.service';
import { DeployDataDto } from './dto/deployData.dto';
import { DeployResultDto } from './dto/deployResult.dto';
import { IpfsManagerService } from '../ipfs-manager/ipfs-manager.service';
import { Job } from 'bull';
import { MetaDataDto } from './dto/metaData.dto';
import { MetadataModel } from '../db-manager/models/metadata.model';
import { MintDataDto } from './dto/mintData.dto';
import { NewTokenDto } from '../db-manager/dto/newToken.dto';
import { Process, Processor } from '@nestjs/bull';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db-manager/models/token.model';
import { TxObj } from './interfaces/txObj.interface';
import { Web3Service } from './web3.service';
import { WhitelistDto } from './dto/whitelist.dto';
import { WhitelistModel } from '../db-manager/models/whitelist.model';
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
      const whitelistOptions = callData.operation_options as WhitelistDto;

      if (!contractObj) {
        throw new RpcException('contract not found');
      }

      if (!whitelistOptions) {
        throw new RpcException('operation specific options missed');
      }

      let merkleRoot: string;
      let merkleProof: { address: string; proof: string[] }[];

      let addresses = whitelistOptions.addresses.split(',').map((address) => {
        return {
          status: callData.execute ? Statuses.PROCESSED : Statuses.CREATED,
          contract_id: contractObj.id,
          address,
        };
      });

      switch (callData.operation_type) {
        case OperationTypes.WHITELIST_ADD: {
          const addressArr = addresses.map((x) => x.address);
          const contractIdArr = addresses.map((x) => x.contract_id);
          const exist = await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
            where: { address: addressArr, contract_id: contractIdArr },
          });

          if (exist.count) {
            (exist.rows as WhitelistModel[]).forEach((row) => {
              const index = addresses.findIndex((x) => x.address === row.address);

              if (index > -1) {
                addresses.splice(index, 1);
              }
            });

            if (addresses.length === 0) {
              throw new RpcException('All addresses already exist in whitelist');
            }
          }

          const whitelistObj = await this.dbManager.create(addresses, ObjectTypes.WHITELIST);

          if (whitelistObj.length === 0) {
            throw new RpcException('Failed to create whitelist object');
          }

          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              contract_id: callData.contract_id,
            })
          ).rows as WhitelistModel[];

          merkleRoot = await this.web3Service.getMerkleRoot(whitelist);

          merkleProof = await Promise.all(
            addresses.map(async (x) => {
              const proof = await this.web3Service.getMerkleProof(whitelist, x.address);

              return {
                address: x.address,
                proof,
              };
            }),
          );

          break;
        }

        case OperationTypes.WHITELIST_REMOVE: {
          const addressArr = addresses.map((x) => x.address);
          const contractIdArr = addresses.map((x) => x.contract_id);
          const deleted = await this.dbManager.delete(
            { address: addressArr, contract_id: contractIdArr },
            ObjectTypes.WHITELIST,
          );

          if (deleted === 0) {
            throw new RpcException('Failed to remove whitelist object');
          }

          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              contract_id: callData.contract_id,
            })
          ).rows as WhitelistModel[];

          merkleRoot = await this.web3Service.getMerkleRoot(whitelist);

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

      const callArgs = [merkleRoot];
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
      const txObj: TxObj = {
        execute: callData.execute,
        network: callData.network,
        contract: contractInst,
        data: txData,
        operationType: OperationTypes.COMMON,
      };
      const callTx = await this.web3Service.send(txObj);

      return { merkleRoot, merkleProof, callTx };
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
        from_address: !callData.execute ? callData.from_address : null,
        data: txData,
        operationType: OperationTypes.COMMON,
      };

      const callTx = await this.web3Service.send(txObj);

      switch (callData.operation_type) {
        case OperationTypes.COMMON:
          return { callTx };

        case OperationTypes.MINT:
          const tx = callData.execute ? callTx.txReceipt : null;
          const mintOptions = callData?.operation_options as MintDataDto;

          if (!mintOptions) {
            throw new RpcException('operation specific options missed');
          }

          const status = callData.execute ? Statuses.PROCESSED : Statuses.CREATED;
          const token_id = await this.dbManager.getTokenId(contractObj.id);

          const tokenObj = (await this.dbManager.create(
            [
              {
                status,
                token_id,
                contract_id: contractObj.id,
                address: contractObj.address,
                nft_number: mintOptions.nft_number,
                mint_data: mintOptions,
                tx_hash: tx?.transactionHash,
                tx_receipt: tx,
              } as NewTokenDto,
            ],
            ObjectTypes.TOKEN,
          )) as TokenModel[];

          let metadataObj: MetadataModel[];

          if (mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type) {
            const meta_data = await this.getMetadata(mintOptions);

            metadataObj = (await this.dbManager.create(
              [{ status: Statuses.CREATED, type: MetadataTypes.SPECIFIED, token_id: tokenObj[0].id, meta_data }],
              ObjectTypes.METADATA,
            )) as MetadataModel[];

            await this.dbManager.setMetadata(
              { object_id: tokenObj[0].id, metadata_id: metadataObj[0].id },
              ObjectTypes.TOKEN,
            );

            return { callTx, meta_data, metadataObj: metadataObj[0], tokenObj: tokenObj[0] };
          }

          metadataObj = [contractObj.metadata];
          await this.dbManager.setMetadata(
            { object_id: tokenObj[0].id, metadata_id: metadataObj[0].id },
            ObjectTypes.TOKEN,
          );

          return { callTx, metadataObj: metadataObj[0], tokenObj: tokenObj[0] };
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
        from_address: !deployData.execute ? deployData.from_address : null,
        data: txData.encodeABI(),
        operationType: OperationTypes.DEPLOY,
      };

      const deployTx = await this.web3Service.send(txObj);
      const tx = deployData.execute ? deployTx.txReceipt : null;

      const contractObj = (await this.dbManager.create(
        [
          {
            status: deployData.execute ? Statuses.PROCESSED : Statuses.CREATED,
            address: tx?.contractAddress ?? null,
            deploy_data: deployData,
            deploy_tx: tx,
          },
        ],
        ObjectTypes.CONTRACT,
      )) as ContractModel[];

      if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
        const meta_data = await this.getMetadata(deployData);
        const metadataObj = (await this.dbManager.create(
          [{ status: Statuses.CREATED, type: MetadataTypes.COMMON, meta_data }],
          ObjectTypes.METADATA,
        )) as MetadataModel[];

        await this.dbManager.setMetadata(
          { object_id: contractObj[0].id, metadata_id: metadataObj[0].id },
          ObjectTypes.CONTRACT,
        );

        return { deployTx, meta_data, contractObj: contractObj[0], metadataObj: metadataObj[0] };
      }

      return { deployTx, contractObj: contractObj[0] };
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
