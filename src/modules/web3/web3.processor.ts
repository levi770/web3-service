import * as U from 'web3-utils';
import Web3 from 'web3';
import { Job } from 'bull';
import { CallDataDto } from './dto/callData.dto';
import { WhitelistResultDto } from './dto/whitelistResult.dto';
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
} from '../../common/constants';
import { DbService } from '../db/db.service';
import { WalletModel } from '../db/models/wallet.model';
import { TxResultDto } from './dto/txResult.dto';
import { CreateWalletDto } from './dto/createWallet.dto';
import { WalletDto } from '../db/dto/wallet.dto';
import { MerkleProofDto } from './dto/merkleProof.dto';
import { HttpStatus } from '@nestjs/common';
import { DeployResultDto } from './dto/deployResult.dto';
import { MintResultDto } from './dto/mintResult.dto';

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
  async createWallet(job: Job): Promise<WalletDto> {
    try {
      const data: CreateWalletDto = job.data;
      const wallet = await this.web3Service.newWallet();
      const walletObj = (await this.dbManager.create(
        [{ team_id: data.team_id, ...wallet }],
        ObjectTypes.WALLET,
      )) as WalletModel[];
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
  async deploy(job: Job): Promise<DeployResultDto> {
    try {
      const deployData: DeployDataDto = job.data;
      const { w3, wallet, keystore } = await this.getAccount(deployData);
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
        keystore: keystore,
      };
      const tx = await this.web3Service.processTx(txOptions);
      
      await wallet.$add('contract', contractObj[0]);
      await wallet.$add('transaction', tx.txObj);
      if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
        const meta_data = await this.getMetadata(deployData);
        const metadataObj = (await this.dbManager.create(
          [{ status: Statuses.CREATED, type: MetadataTypes.COMMON, address: tx.txObj.tx_receipt.contractAddress, meta_data }],
          ObjectTypes.METADATA,
        )) as MetadataModel[];
        await this.dbManager.setMetadata(
          { object_id: contractObj[0].id, metadata_id: metadataObj[0].id },
          ObjectTypes.CONTRACT,
        );
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
  async mint(job: Job): Promise<MintResultDto> {
    try {
      const callData: CallDataDto = job.data;
      const { w3, keystore } = await this.getAccount(callData);
      const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);
      const mintOptions = callData?.operation_options as MintDataDto;
      if (!mintOptions) {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'operation specific options missed',
        });
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

      let metadataObj: MetadataModel[];
      if (mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type) {
        const meta_data = await this.getMetadata(mintOptions);
        metadataObj = (await this.dbManager.create(
          [{ status: Statuses.CREATED, type: MetadataTypes.SPECIFIED, address: contractObj.address, meta_data }],
          ObjectTypes.METADATA,
        )) as MetadataModel[];
        await this.dbManager.setMetadata(
          { object_id: tokenObj[0].id, metadata_id: metadataObj[0].id },
          ObjectTypes.TOKEN,
        );
      } else {
        if (!contractObj.metadata) {
          throw new RpcException({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'contract metadata missed',
          });
        }
        metadataObj = [contractObj.metadata];
        await this.dbManager.setMetadata(
          { object_id: tokenObj[0].id, metadata_id: metadataObj[0].id },
          ObjectTypes.TOKEN,
        );
      }

      const callArgs = this.getArgs(callData.arguments.toString(), abiObj.inputs);
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
      const txOptions: TxOptions = {
        execute: callData.execute,
        operationType: OperationTypes.MINT,
        network: callData.network,
        contract: contractInst,
        contractObj: contractObj,
        tokenObj: tokenObj[0],
        metadataObj: metadataObj[0],
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      const tx = await this.web3Service.processTx(txOptions);
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
  async whitelist(job: Job): Promise<WhitelistResultDto> {
    try {
      const callData: CallDataDto = job.data;
      const { w3, keystore } = await this.getAccount(callData);
      const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);
      const whitelistOptions = callData.operation_options as WhitelistDto;
      if (!whitelistOptions) {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
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
          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              where: { contract_id: callData.contract_id },
            })
          ).rows as WhitelistModel[];
          root = await this.web3Service.getMerkleRoot(whitelist);
          proof = await Promise.all(
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
          // If no addresses were removed, throw an error
          if (deleted === 0) {
            throw new RpcException({
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'Failed to remove whitelist object',
            });
          }
          // Get the updated whitelist from the database
          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              where: { contract_id: callData.contract_id },
            })
          ).rows as WhitelistModel[];
          root = await this.web3Service.getMerkleRoot(whitelist);
          break;
        }
      }

      const callArgs = [root];
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);
      const txOptions: TxOptions = {
        execute: callData.execute,
        operationType: operationType,
        network: callData.network,
        contract: contractInst,
        contractObj: contractObj,
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      if (callData.operation_type === OperationTypes.WHITELIST_ADD) {
        txOptions.whitelistObj = whitelistObj;
      }
      const tx = await this.web3Service.processTx(txOptions);
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
  async commonCall(job: Job): Promise<TxResultDto> {
    try {
      const callData: CallDataDto = job.data;
      const { w3, keystore } = await this.getAccount(callData);
      const { contractObj, contractInst, abiObj } = await this.getContract(callData, w3);
      const callArgs = this.getArgs(callData.arguments, abiObj.inputs);
      // If the operation type is a read contract, call the method and return the result
      if (callData.operation_type === OperationTypes.READ_CONTRACT) {
        const callResult = await contractInst.methods[callData.method_name](...callArgs).call();
        return { [callData.method_name]: callResult };
      }
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
      const txOptions: TxOptions = {
        execute: callData.execute,
        operationType: OperationTypes.COMMON,
        network: callData.network,
        contract: contractInst,
        contractObj: contractObj,
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      return await this.web3Service.processTx(txOptions);
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
  async getMerkleProof(job: Job): Promise<MerkleProofDto> {
    try {
      const data: WhitelistDto = job.data;
      const whitelist = (
        await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, { where: { contract_id: data.contract_id } })
      ).rows as WhitelistModel[];
      const root = await this.web3Service.getMerkleRoot(whitelist);
      const proof = await this.web3Service.getMerkleProof(whitelist, data.address);
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
  async getAccount(data: CallDataDto | DeployDataDto): Promise<{ w3: Web3; wallet: WalletModel; keystore: any }> {
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
    data: CallDataDto,
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

  //#endregion
}
