import * as U from 'web3-utils';
import Web3 from 'web3';
import { CallDataDto } from './dto/callData.dto';
import { CallResultDto } from './dto/callResult.dto';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployDataDto } from './dto/deployData.dto';
import { DeployResultDto } from './dto/deployResult.dto';
import { IpfsManagerService } from '../ipfs/ipfs.service';
import { Job } from 'bull';
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
export class Web3Processor {
  /**
   * The Ethereum web3 instance.
   * @private
   */
  private ethereum: Web3;

  /**
   * The Polygon web3 instance.
   * @private
   */
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
    // Initialize a Web3 instance for Ethereum using the HTTP provider with the host specified in the config service
    this.ethereum = new Web3(new Web3.providers.HttpProvider(this.configService.get('ETHEREUM_HOST')));
    // Initialize a Web3 instance for Polygon using the HTTP provider with the host specified in the config service
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
  /**
   * Processes a whitelist job by adding or removing addresses from a whitelist.
   *
   * @param {Job} job - The job to be processed.
   * @returns {Promise<CallResultDto>} A promise that resolves with the result of the whitelist operation.
   * @throws {RpcException} If the contract is not found, operation specific options are missed,
   * all addresses already exist in the whitelist, or if the method or ABI object is not found.
   */
  async processWhitelist(job: Job): Promise<CallResultDto> {
    try {
      // Extract the relevant data from the job
      const callData: CallDataDto = job.data;
      // Determine which Web3 instance to use based on the network
      const w3: Web3 = callData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;

      const wallet = (await this.dbManager.findOneById(callData.from_address, ObjectTypes.WALLET)) as WalletModel;
      if (callData.execute && !wallet) {
        throw new RpcException('team wallet by "from_address" not found');
      }

      const contractObj = (await this.dbManager.findOneById(
        callData.contract_id,
        ObjectTypes.CONTRACT,
      )) as ContractModel;

      const whitelistOptions = callData.operation_options as WhitelistDto;

      // If the contract or whitelist options are not found, throw an error
      if (!contractObj) {
        throw new RpcException('contract not found');
      }

      if (!whitelistOptions) {
        throw new RpcException('operation specific options missed');
      }

      // Initialize variables to store the Merkle root and proof
      let merkleRoot: string;
      let merkleProof: { address: string; proof: string[] }[];

      const addresses = whitelistOptions.addresses.split(',').map((address) => {
        return {
          status: callData.execute ? Statuses.PROCESSED : Statuses.CREATED,
          contract_id: contractObj.id,
          address,
        };
      });

      // Check the operation type and perform the appropriate action
      switch (callData.operation_type) {
        case OperationTypes.WHITELIST_ADD: {
          // Get any existing whitelist objects with the same addresses and contract IDs as the new objects
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
              throw new RpcException('All addresses already exist in whitelist');
            }
          }

          // Creates a new whitelist object in the database for each of the given addresses.
          const whitelistObj = await this.dbManager.create(addresses, ObjectTypes.WHITELIST);

          // If the whitelist object was not created, throw an error
          if (whitelistObj.length === 0) {
            throw new RpcException('Failed to create whitelist object');
          }

          // Retrieves all of the whitelist objects for the contract.
          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              contract_id: callData.contract_id,
            })
          ).rows as WhitelistModel[];

          // Calculates the Merkle root of the whitelist objects.
          merkleRoot = await this.web3Service.getMerkleRoot(whitelist);

          // Calculates the Merkle proof for each of the given addresses.
          merkleProof = await Promise.all(
            addresses.map(async (x) => {
              const proof = await this.web3Service.getMerkleProof(whitelist, x.address);

              return {
                address: x.address,
                proof,
              };
            }),
          );

          // Break out of the switch statement
          break;
        }

        case OperationTypes.WHITELIST_REMOVE: {
          // Remove the addresses from the whitelist in the database
          const addressArr = addresses.map((x) => x.address);
          const contractIdArr = addresses.map((x) => x.contract_id);

          const deleted = await this.dbManager.delete(
            { address: addressArr, contract_id: contractIdArr },
            ObjectTypes.WHITELIST,
          );

          // If no addresses were removed, throw an error
          if (deleted === 0) {
            throw new RpcException('Failed to remove whitelist object');
          }

          // Get the updated whitelist from the database
          const whitelist = (
            await this.dbManager.getAllObjects(ObjectTypes.WHITELIST, {
              contract_id: callData.contract_id,
            })
          ).rows as WhitelistModel[];

          // Calculate the Merkle root for the updated whitelist
          merkleRoot = await this.web3Service.getMerkleRoot(whitelist);

          // Break out of the switch statement
          break;
        }
      }

      // Create an instance of the contract using the contract's ABI and its deployed address
      const contractInst = new w3.eth.Contract(contractObj.deploy_data.abi as U.AbiItem[], contractObj.address);
      // Find the ABI object of the method to be called from the contract's ABI or thrpw an error if it is not found
      const abiObj = (contractObj as ContractModel).deploy_data.abi.find(
        (x) => x.name === callData.method_name && x.type === 'function',
      );

      if (!abiObj) {
        throw new RpcException('method not found');
      }

      // Create an array of arguments to be passed to the method
      const callArgs = [merkleRoot];
      // Encode the function call using the ABI object and the arguments array
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs);

      const txObj: TxOptions = {
        execute: callData.execute,
        network: callData.network,
        contract: contractInst,
        from_address: callData.from_address,
        data: txData,
        operationType: OperationTypes.COMMON,
        keystore: callData.execute ? wallet.keystore : null,
      };

      const callTx = await this.web3Service.send(txObj);

      // Return the merkle root, merkle proof, and transaction receipt or payload object of the whitelist transaction.
      return { merkleRoot, merkleProof, callTx };
    } catch (error) {
      // If an error occurs, throw an exception.
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
  /**
   * Processes a job with a common process type.
   *
   * @param {Job} job - The job to be processed.
   * @returns {Promise<CallResultDto>} The result of the job processing.
   * @throws {RpcException} If the contract or method is not found, or if the operation specific options are missing.
   */
  async processCall(job: Job): Promise<CallResultDto> {
    try {
      // Extract the call data from the job
      const callData: CallDataDto = job.data;
      // Determine which Web3 instance to use based on the network
      const w3: Web3 = callData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;

      const wallet = (await this.dbManager.findOneById(callData.from_address, ObjectTypes.WALLET)) as WalletModel;
      if (callData.execute && !wallet) {
        throw new RpcException('team wallet by "from_address" not found');
      }

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

      // Get the arguments for the method call based on the ABI object
      const callArgs = callData.arguments ? await this.getArgs(callData.arguments, abiObj.inputs) : [];

      // If the operation type is a read contract, call the method and return the result
      if (callData.operation_type === OperationTypes.READ_CONTRACT) {
        const callResult = await contractInst.methods[callData.method_name](...callArgs).call();
        return { [callData.method_name]: callResult };
      }

      // Otherwise, encode the function call as a transaction
      const txData = w3.eth.abi.encodeFunctionCall(abiObj, callArgs as any[]);

      const txObj: TxOptions = {
        execute: callData.execute,
        network: callData.network,
        contract: contractInst,
        from_address: callData.from_address,
        data: txData,
        operationType: OperationTypes.COMMON,
        keystore: callData.execute ? wallet.keystore : null,
      };

      const mintOptions = callData?.operation_options as MintDataDto;
      if (OperationTypes.MINT && !mintOptions) {
        throw new RpcException('operation specific options missed');
      }

      const callTx = await this.web3Service.send(txObj);

      // Check the operation type and perform the appropriate action
      switch (callData.operation_type) {
        // If the operation type is COMMON, return the call transaction object.
        case OperationTypes.COMMON:
          return { callTx };

        // If the operation type is MINT, do the following:
        case OperationTypes.MINT:
          // If the execute flag is set, set the tx variable to the transaction receipt of the call transaction.
          // Otherwise, set it to null.
          const tx = callData.execute ? callTx.txReceipt : null;
          const status = callData.execute ? Statuses.PROCESSED : Statuses.CREATED;
          // Get the token ID for the contract.
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
              } as TokenDto,
            ],
            ObjectTypes.TOKEN,
          )) as TokenModel[];

          // If the mint options include metadata, asset URL, and asset type, do the following:
          // Create a variable to store the metadata object
          let metadataObj: MetadataModel[];

          if (mintOptions.meta_data && mintOptions.asset_url && mintOptions.asset_type) {
            // Get the metadata for the mint options.
            const meta_data = await this.getMetadata(mintOptions);
            metadataObj = (await this.dbManager.create(
              [{ status: Statuses.CREATED, type: MetadataTypes.SPECIFIED, token_id: tokenObj[0].id, meta_data }],
              ObjectTypes.METADATA,
            )) as MetadataModel[];
            await this.dbManager.setMetadata(
              { object_id: tokenObj[0].id, metadata_id: metadataObj[0].id },
              ObjectTypes.TOKEN,
            );
            // Return the call transaction object, metadata, created metadata object, and created token object.
            return { callTx, meta_data, metadataObj: metadataObj[0], tokenObj: tokenObj[0] };
          }
          // If the mint options do not include metadata, asset URL, and asset type, do the following:
          // Define metadataObj as metadata of the contract object
          metadataObj = [contractObj.metadata];

          await this.dbManager.setMetadata(
            { object_id: tokenObj[0].id, metadata_id: metadataObj[0].id },
            ObjectTypes.TOKEN,
          );

          return { callTx, metadataObj: metadataObj[0], tokenObj: tokenObj[0] };
      }
    } catch (error) {
      // If an error occurs, throw an exception.
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
  /**
   * Deploys a smart contract on the Ethereum or Polygon network.
   *
   * @param {Job} job - The job object containing the deploy data.
   * @returns {Promise<DeployResultDto>} - A promise that resolves with the deploy transaction object,
   * contract object, metadata object (if applicable), and metadata (if applicable).
   * @throws {RpcException} - If an error occurs during deployment.
   */
  async deploy(job: Job): Promise<DeployResultDto> {
    try {
      // Extract the deploy data from the job.
      const deployData: DeployDataDto = job.data;

      const wallet = (await this.dbManager.findOneById(deployData.from_address, ObjectTypes.WALLET)) as WalletModel;
      if (!wallet) {
        throw new RpcException('team wallet by "from_address" not found');
      }

      const w3: Web3 = deployData.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      // Create an instance of the contract using its ABI.
      const contractInstance = new w3.eth.Contract(deployData.abi as U.AbiItem[]);
      // Create a deploy transaction object with the contract instance, bytecode, and arguments.
      const txData = contractInstance.deploy({
        data: deployData.bytecode,
        arguments: deployData.arguments.split('::'),
      });

      const txObj: TxOptions = {
        execute: deployData.execute,
        network: deployData.network,
        contract: contractInstance,
        from_address: !deployData.execute ? deployData.from_address : null,
        data: txData.encodeABI(), // Encode the transaction object as ABI data.
        operationType: OperationTypes.DEPLOY,
        keystore: wallet.keystore,
      };

      //

      const deployTx = await this.web3Service.send(txObj);
      // If the execute flag is set, set the tx variable to the transaction receipt of the deploy transaction.
      // Otherwise, set it to null.
      const tx = deployData.execute ? deployTx.txReceipt : null;
      // Create a new contract object with the obtained data and store it in the database.
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

      await wallet.$add('contract', contractObj[0]);

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
        //Return the deploy transaction object, contract object, and metadata object (if applicable).
        return { deployTx, meta_data, contractObj: contractObj[0], metadataObj: metadataObj[0] };
      }
      // If metadata is not provided, return the deploy transaction object and contract object.
      return { deployTx, contractObj: contractObj[0] };
    } catch (error) {
      // If an error occurs, throw an exception.
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
    // Upload the asset to IPFS and get its file ID.
    const fileId = await this.ipfsManger.upload(data.asset_url);
    // Get the metadata from the data input.
    const metadata = data.meta_data;

    // Check the asset type and update the metadata accordingly.
    switch (data.asset_type) {
      case FileTypes.IMAGE:
        metadata.image = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;

      case FileTypes.OBJECT:
        metadata.model_url = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;
    }

    // Return the updated metadata.
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
      // Split the string of arguments into an array.
      const argsArr = args.split('::');
      if (argsArr.length !== inputs.length) {
        throw new RpcException('arguments length is not valid');
      }
      return argsArr.map((value, index) => {
        // If the ABI input type is 'bytes32[]', parse the value as JSON.
        if (inputs[index].type === 'bytes32[]') {
          return JSON.parse(value);
        }
        return value;
      });
    } catch (error) {
      // If an error occurs, throw an exception.
      throw new RpcException('Failed to get arguments: ' + error);
    }
  }
}
