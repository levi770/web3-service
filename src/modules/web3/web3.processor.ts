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
import { IMintOptions } from './interfaces/mintOptions.interface';
import { Process, Processor } from '@nestjs/bull';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db/models/token.model';
import { ITxPayload } from './interfaces/txPayload.interface';
import { Web3Service } from './web3.service';
import { WhitelistRequest } from './dto/requests/whitelist.request';
import { WhitelistModel } from '../db/models/whitelist.model';
import { FileTypes, MetadataTypes, ObjectTypes, OperationTypes, ProcessTypes, Statuses } from '../../common/constants';
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
      const account = await this.web3Service.newWallet(data);
      const walletPayload = { team_id: data.team_id, ...account };
      const [wallet] = (await this.dbManager.create([walletPayload], ObjectTypes.WALLET)) as WalletModel[];
      return { id: wallet.id, address: account.address };
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
      const contractInst = new w3.eth.Contract(deployData.abi as U.AbiItem[]);
      const contractPayload = {
        status: Statuses.CREATED,
        deploy_data: deployData,
        slug: deployData.slug,
        price: deployData.price,
      };
      const [contract] = (await this.dbManager.create([contractPayload], ObjectTypes.CONTRACT)) as ContractModel[];
      const txPayload: ITxPayload = {
        execute: deployData.execute,
        network: deployData.network,
        contract: contractInst,
        contract_obj: contract,
        from_address: deployData.from_address,
        data: contractInst
          .deploy({
            data: deployData.bytecode,
            arguments: deployData.arguments.split('::'),
          })
          .encodeABI(),
        operation_type: OperationTypes.DEPLOY,
        keystore: keystore,
      };
      const tx = await this.web3Service.processTx(txPayload);
      await wallet.$add('contract', contract);
      await wallet.$add('transaction', tx.txObj);
      if (deployData.meta_data && deployData.asset_url && deployData.asset_type) {
        const meta_data = await this.getMetadata(deployData);
        const metadataPayload = {
          status: Statuses.CREATED,
          type: MetadataTypes.COMMON,
          address: tx.txObj.tx_receipt.contractAddress,
          slug: deployData.slug,
          meta_data,
        };
        const [metadataObj] = (await this.dbManager.create([metadataPayload], ObjectTypes.METADATA)) as MetadataModel[];
        await this.dbManager.setMetadata({ object_id: contract.id, id: metadataObj.id }, ObjectTypes.CONTRACT);
      }
      return { tx, contract };
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
      const mintOptions = callData?.operation_options as IMintOptions;
      this.validateMintOptions(mintOptions, contractObj);
      const tokenObj = await this.createToken(mintOptions, contractObj);
      const metadataObj = await this.createMetadata(mintOptions, contractObj, tokenObj);
      const txData = this.encodeFunctionCall(w3, abiObj, callData.arguments);
      const txPayload: ITxPayload = {
        execute: callData.execute,
        operation_type: OperationTypes.MINT,
        network: callData.network,
        contract: contractInst,
        contract_obj: contractObj,
        token_obj: tokenObj,
        metadata_obj: metadataObj,
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      const tx = await this.web3Service.processTx(txPayload);
      return { tx, token: tokenObj };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  private validateMintOptions(mintOptions: IMintOptions, contractObj: ContractModel) {
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
  }

  private async createToken(mintOptions: IMintOptions, contractObj: ContractModel): Promise<TokenModel> {
    try {
      const tokenPayload = {
        status: Statuses.CREATED,
        contract_id: contractObj.id,
        address: contractObj.address,
        qty: mintOptions.qty,
      };
      const tokenObj = (await this.dbManager.create([tokenPayload], ObjectTypes.TOKEN)) as TokenModel[];
      return tokenObj[0];
    } catch (err) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
      });
    }
  }

  private async createMetadata(
    mintOptions: IMintOptions,
    contractObj: ContractModel,
    tokenObj: TokenModel,
  ): Promise<MetadataModel> {
    let metadata: MetadataModel[];
    try {
      const isMetadataExist = mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type ? true : false;
      if (isMetadataExist) {
        const meta_data = await this.getMetadata(mintOptions);
        const token_id = await this.dbManager.getTokenId(contractObj.id, tokenObj.qty);
        const metadataPayload = {
          status: Statuses.CREATED,
          type: MetadataTypes.SPECIFIED,
          slug: contractObj.slug,
          meta_data,
          token_id,
        };

        metadata = (await this.dbManager.create([metadataPayload], ObjectTypes.METADATA)) as MetadataModel[];
        await this.dbManager.setMetadata({ object_id: tokenObj.id, id: metadata[0].id }, ObjectTypes.TOKEN);
      } else {
        metadata = [contractObj.metadata];
        await this.dbManager.setMetadata({ object_id: tokenObj.id, id: metadata[0].id }, ObjectTypes.TOKEN);
      }
      return metadata[0];
    } catch (err) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
      });
    }
  }

  private encodeFunctionCall(w3: Web3, abiObj: any, args: string | string[]) {
    const callArgs = this.getArgs(args.toString(), abiObj.inputs);
    return w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);
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
      let root: string, proof: { address: string; proof: string[] }[], new_whitelist: WhitelistModel[];
      this.validateWhitelistOptions(whitelistOptions);

      switch (callData.operation_type) {
        case OperationTypes.WHITELIST_ADD: {
          new_whitelist = await this.addWhitelist(whitelistOptions, contractObj);
          const whitelist = await this.getWhitelist(contractObj);
          root = await this.web3Service.getMerkleRoot(whitelist);
          proof = await Promise.all(
            new_whitelist.map(async (x) => {
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
          await this.removeWhitelist(whitelistOptions, contractObj);
          const whitelist = await this.getWhitelist(contractObj);
          root = await this.web3Service.getMerkleRoot(whitelist);
          break;
        }
      }

      const txData = this.encodeFunctionCall(w3, abiObj, [root]);
      const txPayload: ITxPayload = {
        execute: callData.execute,
        operation_type: callData.operation_type,
        network: callData.network,
        contract: contractInst,
        contract_obj: contractObj,
        whitelist_obj: new_whitelist,
        from_address: callData.from_address,
        data: txData,
        keystore: keystore,
      };
      const tx = await this.web3Service.processTx(txPayload);
      return { root, proof, tx };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  private validateWhitelistOptions(whitelistOptions: WhitelistRequest) {
    if (!whitelistOptions) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'operation specific options missed',
      });
    }
  }

  private async addWhitelist(
    whitelistOptions: WhitelistRequest,
    contractObj: ContractModel,
  ): Promise<WhitelistModel[]> {
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
    const whitelist = (await this.dbManager.create(addresses, ObjectTypes.WHITELIST)) as WhitelistModel[];
    // If the whitelist object was not created, throw an error
    if (whitelist.length === 0) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create whitelist object',
      });
    }
    return whitelist;
  }

  private async removeWhitelist(whitelistOptions: WhitelistRequest, contractObj: ContractModel) {
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
  }

  private async getWhitelist(contractObj: ContractModel): Promise<WhitelistModel[]> {
    const whitelist = await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
      where: { contract_id: contractObj.id },
    });
    return whitelist.rows as WhitelistModel[];
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
        value: callData?.value,
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
      if (!whitelist.rows.length) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'No whitelist found for this contract',
        });
      }
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
    if (data?.execute && !wallet) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'team wallet by "from_address" not found',
      });
    }
    const keystore = data?.execute ? wallet.keystore : null;
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
        status: HttpStatus.NOT_FOUND,
        message: 'contract not found',
      });
    }
    const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi as U.AbiItem[], contractObj.address);
    const abiObj = contractObj.deploy_data.abi.find((x) => x.name === data.method_name && x.type === 'function');
    if (!abiObj) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'method not found',
      });
    }
    const contractObject = { contractObj, contractInst, abiObj };
    return contractObject;
  }

  /**
   * Convert a string of arguments into an array of arguments.
   */
  getArgs(args: string, inputs: U.AbiInput[]): any[] {
    try {
      if (!args || args === '') {
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
  async getMetadata(data: IMintOptions | DeployRequest): Promise<IMetaData> {
    const fileId = await this.ipfsManger.upload(data.asset_url);
    const metadata = data.meta_data;
    switch (data.asset_type) {
      case FileTypes.IMAGE:
        metadata.image = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;
      case FileTypes.OBJECT:
        metadata.model_url = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;
      default:
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'File type not supported',
        });
    }
    return metadata;
  }

  //#endregion
}
