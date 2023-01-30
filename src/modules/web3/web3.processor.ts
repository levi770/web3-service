import * as U from 'web3-utils';
import Web3 from 'web3';
import { Job } from 'bull';
import { CallRequest } from './dto/requests/call.request';
import { WhitelistResponse } from './dto/responses/whitelist.response';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployRequest } from './dto/requests/deploy.request';
import { IpfsManagerService } from '../ipfs/ipfs.service';
import { IMetaData } from './interfaces/metaData.interface';
import { MetadataModel } from '../db/models/metadata.model';
import { IMintData } from './interfaces/mintData.interface';
import { IToken } from '../db/interfaces/token.interface';
import { Process, Processor } from '@nestjs/bull';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db/models/token.model';
import { ITxPayload } from './interfaces/txPayload.interface';
import { Web3Service } from './web3.service';
import { WhitelistRequest } from './dto/requests/whitelist.request';
import { WhitelistModel } from '../db/models/whitelist.model';
import {
  FileTypes,
  MetadataTypes,
  Networks,
  ObjectTypes,
  OperationTypes,
  ProcessTypes,
  Statuses,
} from '../../common/constants';
import { DbService } from '../db/db.service';
import { WalletModel } from '../db/models/wallet.model';
import { ITxResult } from './interfaces/txResult.interface';
import { CreateWalletRequest } from './dto/requests/createWallet.request';
import { IWallet } from '../db/interfaces/wallet.interface';
import { IMerkleProof } from './interfaces/merkleProof.interface';
import { HttpStatus } from '@nestjs/common';
import { DeployResponse } from './dto/responses/deploy.response';
import { MintResponse } from './dto/responses/mint.response';

/**
 * A class that processes web3 jobs.
 */
@Processor('web3')
export class Web3Processor {
  constructor(
    private configService: ConfigService,
    private dbManager: DbService,
    private ipfsManger: IpfsManagerService,
    private web3Service: Web3Service,
  ) {}

  //#region Process Methods

  /**
   * Creates a new encrypted leystore in DB for team_id
   */
  @Process(ProcessTypes.CREATE_WALLET)
  async createWallet(job: Job): Promise<IWallet> {
    try {
      const data: CreateWalletRequest = job.data;
      const wallet = await this.web3Service.newWallet();
      const walletPayload = { team_id: data.team_id, ...wallet };
      const walletObj = (await this.dbManager.create([walletPayload], ObjectTypes.WALLET)) as WalletModel[];
      return { id: walletObj[0].id, address: wallet.address };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Deploys a smart contract on the Ethereum or Polygon network.
   */
  @Process(ProcessTypes.DEPLOY)
  async deploy(job: Job): Promise<DeployResponse> {
    try {
      const deployData: DeployRequest = job.data;
      const { w3, wallet, keystore } = await this.getAccount(deployData);
      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);
      const contractPayload = { status: Statuses.CREATED, deploy_data: deployData };
      const contractObj = (await this.dbManager.create([contractPayload], ObjectTypes.CONTRACT)) as ContractModel[];

      const txData = contractInstance.deploy({
        data: deployData.bytecode,
        arguments: deployData.arguments.split('::'),
      });
      const txPayload: ITxPayload = {
        execute: deployData.execute,
        network: deployData.network,
        contract: contractInstance,
        contract_obj: contractObj[0],
        from_address: deployData.from_address,
        data: txData.encodeABI(),
        operation_type: OperationTypes.DEPLOY,
        keystore: keystore,
      };
      const tx = await this.web3Service.processTx(txPayload);

      await wallet.$add('contract', contractObj[0]);
      await wallet.$add('transaction', tx.txObj);

      if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
        const meta_data = await this.getMetadata(deployData);
        const metadataPayload = {
          status: Statuses.CREATED,
          type: MetadataTypes.COMMON,
          address: tx.txObj.tx_receipt.contractAddress,
          meta_data,
        };
        const metadataObj = (await this.dbManager.create([metadataPayload], ObjectTypes.METADATA)) as MetadataModel[];
        await this.dbManager.setMetadata({ object_id: contractObj[0].id, id: metadataObj[0].id }, ObjectTypes.CONTRACT);
      }

      return { tx, contract: contractObj[0] };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Mints new token.
   */
  @Process(ProcessTypes.MINT)
  async mint(job: Job): Promise<MintResponse> {
    try {
      const callData: CallRequest = job.data;
      const { w3, keystore } = await this.getAccount(callData);
      const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);

      const mintOptions = callData?.operation_options as IMintData;
      if (!mintOptions) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'operation specific options missed',
        });
      }
      const isMetadataExist = mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type ? true : false;
      if (!isMetadataExist && !contractObj.metadata) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'metadata missed',
        });
      }

      const tokenPayload = {
        status: Statuses.CREATED,
        contract_id: contractObj.id,
        address: contractObj.address,
        mint_data: mintOptions,
      };
      const tokenObj = (await this.dbManager.create([tokenPayload], ObjectTypes.TOKEN)) as TokenModel[];

      let metadataObj: MetadataModel[];
      if (isMetadataExist) {
        const meta_data = await this.getMetadata(mintOptions);
        const metadataPayload = {
          status: Statuses.CREATED,
          type: MetadataTypes.SPECIFIED,
          address: contractObj.address,
          meta_data,
        };
        metadataObj = (await this.dbManager.create([metadataPayload], ObjectTypes.METADATA)) as MetadataModel[];
        await this.dbManager.setMetadata({ object_id: tokenObj[0].id, id: metadataObj[0].id }, ObjectTypes.TOKEN);
      } else {
        metadataObj = [contractObj.metadata];
        await this.dbManager.setMetadata({ object_id: tokenObj[0].id, id: metadataObj[0].id }, ObjectTypes.TOKEN);
      }

      const callArgs = this.getArgs(callData.arguments.toString(), abiObj.inputs);
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
      const txPayload: ITxPayload = {
        execute: callData.execute,
        operation_type: OperationTypes.MINT,
        network: callData.network,
        contract: contractInst,
        contract_obj: contractObj,
        token_obj: tokenObj[0],
        metadata_obj: metadataObj[0],
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      const tx = await this.web3Service.processTx(txPayload);
      return { tx, token: tokenObj[0] };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Processes a whitelist job by adding or removing addresses from a whitelist.
   */
  @Process(ProcessTypes.WHITELIST)
  async whitelist(job: Job): Promise<WhitelistResponse> {
    try {
      const callData: CallRequest = job.data;
      const { w3, keystore } = await this.getAccount(callData);
      const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);

      const whitelistOptions = callData.operation_options as WhitelistRequest;
      if (!whitelistOptions) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'operation specific options missed',
        });
      }

      let root: string;
      let proof: { address: string; proof: string[] }[];
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
          // If any of the new objects already exist, remove them from the array
          if (exist.count) {
            (exist.rows as WhitelistModel[]).forEach((row) => {
              const index = addresses.findIndex((x) => x.address === row.address);
              if (index > -1) {
                addresses.splice(index, 1);
              }
            });
            // If all of the new whitelist objects already exist, throw an error
            if (addresses.length === 0) {
              throw new RpcException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'All addresses already exist in whitelist',
              });
            }
          }
          whitelistObj = (await this.dbManager.create(addresses, ObjectTypes.WHITELIST)) as WhitelistModel[];
          // If the whitelist object was not created, throw an error
          if (whitelistObj.length === 0) {
            throw new RpcException({
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'Failed to create whitelist object',
            });
          }
          // Retrieves all of the whitelist objects for the contract.
          const whitelist = await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
            where: { contract_id: callData.contract_id },
          });
          root = await this.web3Service.getMerkleRoot(whitelist.rows as WhitelistModel[]);
          proof = await Promise.all(
            addresses.map(async (x) => {
              const proof = await this.web3Service.getMerkleProof(whitelist.rows as WhitelistModel[], x.address);
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
          // If no addresses were removed, throw an error
          if (deleted === 0) {
            throw new RpcException({
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'Failed to remove whitelist object',
            });
          }
          // Get the updated whitelist from the database
          const whitelist = await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
            where: { contract_id: callData.contract_id },
          });

          root = await this.web3Service.getMerkleRoot(whitelist.rows as WhitelistModel[]);
          break;
        }
      }

      const callArgs = [root];
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
      const txPayload: ITxPayload = {
        execute: callData.execute,
        operation_type: operationType,
        network: callData.network,
        contract: contractInst,
        contract_obj: contractObj,
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      if (callData.operation_type === OperationTypes.WHITELIST_ADD) {
        txPayload.whitelist_obj = whitelistObj;
      }
      const tx = await this.web3Service.processTx(txPayload);
      return { root, proof, tx };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Processes a common blockchain call.
   */
  @Process(ProcessTypes.COMMON)
  async commonCall(job: Job): Promise<ITxResult> {
    try {
      const callData: CallRequest = job.data;
      const { w3, keystore } = await this.getAccount(callData);
      const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);
      const callArgs = this.getArgs(callData.arguments, abiObj.inputs);
      // If the operation type is a read contract, call the method and return the result
      if (callData.operation_type === OperationTypes.READ_CONTRACT) {
        const callResult = await contractInst.methods[callData.method_name](...callArgs).call();
        return { [callData.method_name]: callResult };
      }
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
      const txPayload: ITxPayload = {
        execute: callData.execute,
        operation_type: OperationTypes.COMMON,
        network: callData.network,
        contract: contractInst,
        contract_obj: contractObj,
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      return await this.web3Service.processTx(txPayload);
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Gets a merkle proof for provided address
   */
  @Process(ProcessTypes.MERKLE_PROOF)
  async getMerkleProof(job: Job): Promise<IMerkleProof> {
    try {
      const data: WhitelistRequest = job.data;
      const whitelist = await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
        where: { contract_id: data.contract_id },
      });
      const root = await this.web3Service.getMerkleRoot(whitelist.rows as WhitelistModel[]);
      const proof = await this.web3Service.getMerkleProof(whitelist.rows as WhitelistModel[], data.addresses);
      return { root, proof };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  //#endregion

  //#region Helpers Methods

  /**
   * Retrieves account from DB and Web3 instance.
   */
  async getAccount(data: CallRequest | DeployRequest): Promise<{ w3: Web3; wallet: WalletModel; keystore: any }> {
    const w3: Web3 = this.web3Service.getWeb3(data.network);
    const wallet = (await this.dbManager.findOneByAddress(data.from_address, ObjectTypes.WALLET)) as WalletModel;
    if (data.execute && !wallet) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'team wallet by "from_address" not found',
      });
    }
    const keystore = data.execute ? wallet.keystore : null;
    return { w3, wallet, keystore };
  }

  /**
   * Retrieves contract from DB and contract instance with ABI.
   */
  async getContract(
    data: CallRequest,
    w3: Web3,
  ): Promise<{ contractObj: ContractModel; contractInst: any; abiObj: any }> {
    const contractObj = (await this.dbManager.getOneObject(ObjectTypes.CONTRACT, {
      where: { id: data.contract_id },
      include_child: true,
    })) as ContractModel;
    if (!contractObj) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'contract not found',
      });
    }
    const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi as U.AbiItem[], contractObj.address);
    const abiObj = contractObj.deploy_data.abi.find((x) => x.name === data.method_name && x.type === 'function');
    if (!abiObj) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'method not found',
      });
    }
    return { contractObj, contractInst, abiObj };
  }

  /**
   * Convert a string of arguments into an array of arguments.
   */
  getArgs(args: string, inputs: U.AbiInput[]): any[] {
    try {
      if (args === undefined || args === null || args === '') {
        return [];
      }
      const argsArr = args.toString().split('::');
      if (argsArr.length !== inputs.length) {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'arguments length is not valid',
        });
      }
      if (argsArr.length !== 0) {
        return argsArr.map((value, index) => {
          if (inputs[index].type === 'bytes32[]') {
            return JSON.parse(value);
          }
          return value;
        });
      }
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Retrieves metadata for a given contract.
   */
  async getMetadata(data: IMintData | DeployRequest): Promise<IMetaData> {
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

  //#endregion
}
