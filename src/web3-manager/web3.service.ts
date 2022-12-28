import * as U from 'web3-utils';
import MerkleTree from 'merkletreejs';
import Web3 from 'web3';
import { TransactionReceipt } from 'web3-core';
import { CallDataDto } from './dto/callData.dto';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db-manager/models/contract.model';
import { DeployDataDto } from './dto/deployData.dto';
import { GetJobDto } from './dto/getJob.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, JobPromise, Queue } from 'bull';
import { JobResultDto } from '../common/dto/jobResult.dto';
import { MintDataDto } from './dto/mintData.dto';
import { Networks, OperationTypes, ProcessTypes, WEB3_QUEUE } from '../common/constants';
import { Observable } from 'rxjs';
import { ResponseDto } from '../common/dto/response.dto';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db-manager/models/token.model';
import { TxObj } from './interfaces/txObj.interface';
import { TxPayload } from './interfaces/tx.interface';
import { TxResultDto } from './dto/txResult.dto';
import { v4 as uuidv4 } from 'uuid';
import { WhitelistModel } from '../db-manager/models/whitelist.model';


@Injectable()
/**
 * A service class for interacting with Web3.
 *
 * @export
 * @class Web3Service
 */
export class Web3Service {
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
   * Creates an instance of Web3Service.
   *
   * @param {Queue} web3Queue - The Web3 queue to use for processing jobs.
   * @param {ConfigService} configService - The config service for accessing configuration values.
   * @memberof Web3Service
   * @constructor
   */
  constructor(
    @InjectQueue(WEB3_QUEUE)
    private web3Queue: Queue,
    private configService: ConfigService,
  ) {
    // Initialize a Web3 instance for Ethereum using the HTTP provider with the host specified in the config service
    this.ethereum = new Web3(new Web3.providers.HttpProvider(configService.get('ETHEREUM_HOST')));
    // Initialize a Web3 instance for Polygon using the HTTP provider with the host specified in the config service
    this.polygon = new Web3(new Web3.providers.HttpProvider(configService.get('POLYGON_HOST')));
  }

  /**
   * Retrieve a job from the queue by its ID.
   *
   * @param data An object containing the ID of the job to retrieve.
   * @returns A ResponseDto object with the job, or an error if the job is not found.
   */
  async getJob(data: GetJobDto) {
    // Get the job with the specified ID
    const job = await this.web3Queue.getJob(data.jobId);
    // If the job was not found, throw an error
    if (!job) {
      throw new RpcException('Job not found');
    }
    // Return the job in a ResponseDto object
    return new ResponseDto(HttpStatus.OK, null, job);
  }

  /**
   * Processes a job and returns an Observable that emits job results.
   *
   * @param {CallDataDto | DeployDataDto} data - The data for the job.
   * @param {ProcessTypes} processType - The type of job to process.
   * @return {Promise<Observable<JobResultDto>>} An Observable that emits job results.
   */
  async process(data: CallDataDto | DeployDataDto, processType: ProcessTypes): Promise<Observable<JobResultDto>> {
    // Generate a unique ID for the job
    const jobId = uuidv4();

    // Create an Observable that will emit job results
    const job$: Observable<JobResultDto> = new Observable((observer) => {
      // A function that will be called when the job becomes active
      const active = (job: Job<MintDataDto | DeployDataDto>, jobPromise: JobPromise) => {
        // Check if the observer has been unsubscribed from
        checkSubscriptions();
        // Emit a 'active' result if the job ID matches
        if (job.id === jobId) {
          observer.next(new JobResultDto(job.id, 'active', job.data));
        }
      };

      // A function that will be called when the job completes successfully
      const completed = (job: Job<MintDataDto | DeployDataDto>, result: ContractModel | TokenModel) => {
        // Check if the observer has been unsubscribed from
        checkSubscriptions();
        // Emit a 'completed' result if the job ID matches
        if (job.id === jobId) {
          observer.next(new JobResultDto(job.id, 'completed', result));
          // Complete the Observable
          observer.complete();
          // Remove the event listeners
          removeAllListeners();
        }
      };

      // A function that will be called when the job fails
      const failed = (job: Job<MintDataDto | DeployDataDto>, error: Error) => {
        // Check if the observer has been unsubscribed from
        checkSubscriptions();
        // Emit a 'failed' result if the job ID matches
        if (job.id === jobId) {
          observer.next(new JobResultDto(job.id, 'failed', error.message));
          // Complete the Observable
          observer.complete();
          // Remove the event listeners
          removeAllListeners();
        }
      };

      // Add the event listeners
      this.web3Queue.addListener('active', active);
      this.web3Queue.addListener('completed', completed);
      this.web3Queue.addListener('failed', failed);

      // A function that checks if the observer has been unsubscribed from
      const checkSubscriptions = () => {
        if (observer.closed) {
          // Remove the event listeners if the observer has been unsubscribed from
          removeAllListeners();
        }
      };

      // A function that removes all of the event listeners
      const removeAllListeners = () => {
        this.web3Queue.removeListener('active', active);
        this.web3Queue.removeListener('completed', completed);
        this.web3Queue.removeListener('failed', failed);
      };
    });

    // Add the job to the queue
    await this.web3Queue.add(processType, data, { jobId, delay: 1000 });

    // Return the Observable
    return job$;
  }

  /**
   * Sends a transaction to the Ethereum or Polygon network.
   *
   * @param {TxObj} txObj - An object containing the transaction details.
   * @returns {Promise<TxResultDto>} - A Promise that resolves to an object containing the transaction object, commission, balance, and transaction receipt (if the transaction was executed).
   * @throws {RpcException} - If there is not enough balance to cover the transaction commission.
   */
  async send(txObj: TxObj): Promise<TxResultDto> {
    try {
      // Get the Web3 instance based on the network specified in the txObj
      const w3: Web3 = txObj.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      // Get the account that will sign the transaction using the private key
      const account = w3.eth.accounts.privateKeyToAccount(this.configService.get('PRIV_KEY'));
      // Get the to address for the transaction, or null if the transaction is a contract deployment
      const to = txObj.operationType === OperationTypes.DEPLOY ? null : txObj.contract.options.address;
      // Get the from address for the transaction, or the account address if no from address is specified in the txObj
      const from = txObj.from_address ?? account.address;

      // Create the transaction object with the required parameters
      const tx: TxPayload = {
        // Get the current transaction count for the from address
        nonce: await w3.eth.getTransactionCount(from),
        // Get the current gas price
        maxPriorityFeePerGas: await w3.eth.getGasPrice(),
        // Estimate the gas needed for the transaction
        gas: await w3.eth.estimateGas({
          from,
          data: txObj.data,
          value: 0,
          to,
        }),
        from,
        data: txObj.data,
        value: 0,
        to,
      };

      // Calculate the transaction commission based on the gas and gas price
      const comission = (+tx.gas * +tx.maxPriorityFeePerGas).toString();
      // Get the balance of the account
      const balance = await w3.eth.getBalance(account.address);

      // Throw an error if the balance is not enough to cover the transaction commission
      if (+balance < +comission) {
        throw new RpcException('Not enough balance');
      }

      // If the transaction should not be executed, return the transaction object, commission, and balance
      if (!txObj.execute) {
        return { tx, comission, balance };
      }

      // Sign the transaction with the account
      const signed = await account.signTransaction(tx);
      // Send the signed transaction and get the transaction receipt
      const txReceipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);

      // Return the transaction object, commission, balance, and transaction receipt
      return { tx, comission, balance, txReceipt };
    } catch (error) {
      // Throw a RpcException with the error message
      throw new RpcException(error);
    }
  }

  /**
   * Gets the transaction receipt for a given transaction hash on a specified network.
   *
   * @param {string} txHash - The transaction hash.
   * @param {Networks} network - The network on which the transaction was mined.
   * @returns {Promise<TransactionReceipt>} - A Promise that resolves to the transaction receipt.
   */
  async getTxReceipt(txHash: string, network: Networks): Promise<TransactionReceipt> {
    // Get the Web3 instance based on the specified network
    const w3: Web3 = network === Networks.ETHEREUM ? this.ethereum : this.polygon;
    // Get the transaction receipt for the specified transaction hash
    return await w3.eth.getTransactionReceipt(txHash);
  }

  /**
   * Calculates the root of a Merkle tree using the addresses in the leaves array as the leaves of the tree.
   *
   * @param {WhitelistModel[]} leaves - An array of objects representing the leaves of the Merkle tree.
   * @returns {Promise<string>} - A Promise that resolves to the hexadecimal representation of the root of the Merkle tree.
   */
  async getMerkleRoot(leaves: WhitelistModel[]): Promise<string> {
    // Hash each address in the leaves array
    const hashLeaves = leaves.map((x) => U.keccak256(x.address));
    // Create a Merkle tree using the hashed leaves and the keccak256 hashing function
    const tree = new MerkleTree(hashLeaves, U.keccak256, { sortPairs: true });
    // Get the hexadecimal representation of the root of the Merkle tree
    return tree.getHexRoot();
  }

  /**
   * Calculates the Merkle proof for a given address in the leaves array.
   *
   * @param {WhitelistModel[]} leaves - An array of objects representing the leaves of the Merkle tree.
   * @param {string} address - The address for which the proof will be calculated.
   * @returns {Promise<string[]>} - A Promise that resolves to the hexadecimal representation of the Merkle proof.
   */
  async getMerkleProof(leaves: WhitelistModel[], address: string): Promise<string[]> {
    // Hash each address in the leaves array
    const hashLeaves = leaves.map((x) => U.keccak256(x.address));
    // Create a Merkle tree using the hashed leaves and the keccak256 hashing function
    const tree = new MerkleTree(hashLeaves, U.keccak256, { sortPairs: true });
    // Get the hexadecimal representation of the Merkle proof for the specified address
    return tree.getHexProof(U.keccak256(address));
  }
}
