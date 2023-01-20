import * as U from 'web3-utils';
import Web3 from 'web3';
import { Job } from 'bull';
import { CallDataDto } from './dto/callData.dto';
import { CallResultDto } from './dto/callResult.dto';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployDataDto } from './dto/deployData.dto';
import { IpfsManagerService } from '../ipfs/ipfs.service';
import { MetaDataDto } from './dto/metaData.dto';
import { MetadataModel } from '../db/models/metadata.model';
import { MintDataDto } from './dto/mintData.dto';
import { TokenDto } from '../db/dto/token.dto';
import { Process, Processor } from '@nestjs/bull';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db/models/token.model';
import { TxOptions } from './interfaces/txOptions.interface';
import { Web3Service } from './web3.service';
import { WhitelistDto } from './dto/whitelist.dto';
import { WhitelistModel } from '../db/models/whitelist.model';
import {
  FileTypes,
  MetadataTypes,
  Networks,
  ObjectTypes,
  OperationTypes,
  ProcessTypes,
  Statuses,
} from '../common/constants';
import { DbService } from '../db/db.service';
import { WalletModel } from '../db/models/wallet.model';
import { CreatedObjects } from '../common/types';
import { TxResultDto } from './dto/txResult.dto';

/**
 * A class that processes web3 jobs.
 *
 * @param {ConfigService} configService - A service for getting configuration data.
 * @param {DbManagerService} dbManager - A service for managing database operations.
 * @param {IpfsManagerService} ipfsManger - A service for managing IPFS operations.
 * @param {Web3Service} web3Service - A service for interacting with the web3 provider.
 * @export
 * @class Web3Processor
 */
@Processor('web3')
export class Web3Processor {
  private ethereum: Web3;
  private polygon: Web3;

  /**
   * Creates an instance of Web3Processor.
   *
   * @param {ConfigService} configService - A service for getting configuration data.
   * @param {DbManagerService} dbManager - A service for managing database operations.
   * @param {IpfsManagerService} ipfsManger - A service for managing IPFS operations.
   * @param {Web3Service} web3Service - A service for interacting with the web3 provider.
   * @memberof Web3Processor
   * @constructor
   */
  constructor(
    private configService: ConfigService,
    private dbManager: DbService,
    private ipfsManger: IpfsManagerService,
    private web3Service: Web3Service,
  ) {
    this.ethereum = new Web3(new Web3.providers.HttpProvider(this.configService.get('ETHEREUM_HOST')));
    this.polygon = new Web3(new Web3.providers.HttpProvider(this.configService.get('POLYGON_HOST')));
  }

  /**
   * Processes a whitelist job by adding or removing addresses from a whitelist.
   *
   * @param {Job} job - The job to be processed.
   * @returns {Promise<CallResultDto>} A promise that resolves with the result of the whitelist operation.
   * @throws {RpcException} If the contract is not found, operation specific options are missed,
   * all addresses already exist in the whitelist, or if the method or ABI object is not found.
   */
  @Process(ProcessTypes.WHITELIST)
  async processWhitelist(job: Job): Promise<CallResultDto> {
    try {
      const callData: CallDataDto = job.data;

      const w3: Web3 = callData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;

      const wallet = (await this.dbManager.findOneById(callData.from_address, ObjectTypes.WALLET)) as WalletModel;

      if (callData.execute && !wallet) {
        throw new RpcException('team wallet by "from_address" not found');
      }

      const contractObj = (await this.dbManager.findOneById(
        callData.contract_id,
        ObjectTypes.CONTRACT,
      )) as ContractModel;

      if (!contractObj) {
        throw new RpcException('contract not found');
      }

      const whitelistOptions = callData.operation_options as WhitelistDto;

      if (!whitelistOptions) {
        throw new RpcException('operation specific options missed');
      }

      let merkleRoot: string;
      let merkleProof: { address: string; proof: string[] }[];
      let whitelistObj: WhitelistModel[];
      let operationType: OperationTypes;

      switch (callData.operation_type) {
        case OperationTypes.WHITELIST_ADD: {
          operationType = OperationTypes.WHITELIST_ADD;

          const addresses = whitelistOptions.addresses.split(',').map((address) => {
            return {
              status: Statuses.CREATED,
              contract_id: contractObj.id,
              address,
            };
          });

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

          whitelistObj = (await this.dbManager.create(addresses, ObjectTypes.WHITELIST)) as WhitelistModel[];

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
          operationType = OperationTypes.WHITELIST_REMOVE;

          const addresses = whitelistOptions.addresses.split(',').map((address) => {
            return {
              status: Statuses.DELETED,
              contract_id: contractObj.id,
              address,
            };
          });

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

      const txOptions: TxOptions = {
        execute: callData.execute,
        network: callData.network,
        contract: contractInst,
        from_address: callData.from_address,
        data: txData,
        keystore: callData.execute ? wallet.keystore : null,
        operationType,
        contractObj,
      };

      if (callData.operation_type === OperationTypes.WHITELIST_ADD) {
        txOptions.whitelistObj = whitelistObj;
      }

      const tx = await this.web3Service.send(txOptions);

      return { merkleRoot, merkleProof, tx };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * Processes a job with a common process type.
   *
   * @param {Job} job - The job to be processed.
   * @returns {Promise<CallResultDto>} The result of the job processing.
   * @throws {RpcException} If the contract or method is not found, or if the operation specific options are missing.
   */
  @Process(ProcessTypes.COMMON)
  async processCall(job: Job): Promise<TxResultDto> {
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

      const walletObj = (await this.dbManager.findOneById(callData.from_address, ObjectTypes.WALLET)) as WalletModel;

      if (callData.execute && !walletObj) {
        throw new RpcException('team wallet by "from_address" not found');
      }

      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);

      const txOptions: TxOptions = {
        execute: callData.execute,
        network: callData.network,
        contract: contractInst,
        from_address: callData.from_address,
        data: txData,
        operationType: OperationTypes.COMMON,
        keystore: callData.execute ? walletObj.keystore : null,
        contractObj,
      };

      const mintOptions = callData?.operation_options as MintDataDto;

      if (callData.operation_type === OperationTypes.MINT) {
        txOptions.operationType = OperationTypes.MINT;

        if (!mintOptions) {
          throw new RpcException('operation specific options missed');
        }

        const tokenObj = (await this.dbManager.create(
          [
            {
              status: Statuses.CREATED,
              contract_id: contractObj.id,
              address: contractObj.address,
              nft_number: mintOptions.nft_number,
              mint_data: mintOptions,
            } as TokenDto,
          ],
          ObjectTypes.TOKEN,
        )) as TokenModel[];

        txOptions.tokenObj = tokenObj[0];

        const tx = await this.web3Service.send(txOptions);

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
        } else {
          metadataObj = [contractObj.metadata];

          await this.dbManager.setMetadata(
            { object_id: tokenObj[0].id, metadata_id: metadataObj[0].id },
            ObjectTypes.TOKEN,
          );
        }

        return tx;
      }

      return await this.web3Service.send(txOptions);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * Deploys a smart contract on the Ethereum or Polygon network.
   *
   * @param {Job} job - The job object containing the deploy data.
   * @returns {Promise<DeployResultDto>} - A promise that resolves with the deploy transaction object,
   * contract object, metadata object (if applicable), and metadata (if applicable).
   * @throws {RpcException} - If an error occurs during deployment.
   */
  @Process(ProcessTypes.DEPLOY)
  async deploy(job: Job): Promise<TxResultDto> {
    try {
      const deployData: DeployDataDto = job.data;

      const walletObj = (await this.dbManager.findOneById(deployData.from_address, ObjectTypes.WALLET)) as WalletModel;

      if (!walletObj) {
        throw new RpcException('team wallet by "from_address" not found');
      }

      const w3: Web3 = deployData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;

      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);
      const contractObj = (await this.dbManager.create(
        [
          {
            status: Statuses.CREATED,
            deploy_data: deployData,
          },
        ],
        ObjectTypes.CONTRACT,
      )) as ContractModel[];

      const txData = contractInstance.deploy({
        data: deployData.bytecode,
        arguments: deployData.arguments.split('::'),
      });

      const txOptions: TxOptions = {
        execute: deployData.execute,
        network: deployData.network,
        contract: contractInstance,
        contractObj: contractObj[0],
        from_address: deployData.from_address,
        data: txData.encodeABI(),
        operationType: OperationTypes.DEPLOY,
        keystore: walletObj.keystore,
      };

      const tx = await this.web3Service.send(txOptions);

      await walletObj.$add('contract', contractObj[0]);
      await walletObj.$add('transaction', tx.txObj);

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
      }

      return tx;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * Retrieves metadata for a given contract.
   *
   * @param {(MintDataDto | DeployDataDto)} data - The data to use to retrieve the metadata.
   * @returns {Promise<MetaDataDto>} The metadata for the contract.
   */
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

  /**
   * Convert a string of arguments into an array of arguments.
   *
   * @param {string} args - The string of arguments to be converted.
   * @param {U.AbiInput[]} inputs - The ABI input objects for the method.
   * @returns {any[]} An array of arguments.
   * @throws {RpcException} If the arguments length is invalid or if an error occurs while getting the arguments.
   */
  async getArgs(args: string, inputs: U.AbiInput[]): Promise<any[]> {
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
