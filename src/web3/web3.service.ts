import * as U from 'web3-utils';
import Web3 from 'web3';
import MerkleTree from 'merkletreejs';
import { TransactionReceipt } from 'web3-core';
import { CallDataDto } from './dto/callData.dto';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployDataDto } from './dto/deployData.dto';
import { GetJobDto } from './dto/getJob.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { JobResultDto } from '../common/dto/jobResult.dto';
import { MintDataDto } from './dto/mintData.dto';
import {
  CRON_QUEUE,
  Networks,
  ObjectTypes,
  OperationTypes,
  ProcessTypes,
  Statuses,
  TX_WORKER,
  WEB3_QUEUE,
} from '../common/constants';
import { Observable } from 'rxjs';
import { ResponseDto } from '../common/dto/response.dto';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db/models/token.model';
import { TxOptions } from './interfaces/txOptions.interface';
import { TxPayload } from './interfaces/tx.interface';
import { TxResultDto } from './dto/txResult.dto';
import { v4 as uuidv4 } from 'uuid';
import { WhitelistModel } from '../db/models/whitelist.model';
import { Wallet } from '../common/types';
import { DbService } from '../db/db.service';
import { TransactionModel } from '../db/models/transaction.model';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * A service class for interacting with Web3.
 *
 * @export
 * @class Web3Service
 */
@Injectable()
export class Web3Service {
  private ethereum: Web3;
  private polygon: Web3;

  constructor(
    @InjectQueue(WEB3_QUEUE) private web3Queue: Queue,
    @InjectQueue(CRON_QUEUE) private cronQueue: Queue,
    private configService: ConfigService,
    private dbService: DbService,
  ) {
    this.ethereum = new Web3(new Web3.providers.HttpProvider(configService.get('ETHEREUM_HOST')));
    this.polygon = new Web3(new Web3.providers.HttpProvider(configService.get('POLYGON_HOST')));
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    return await this.cronQueue.add(TX_WORKER, { db: this.dbService });
  }

  /**
   * Retrieve a job from the queue by its ID.
   *
   * @param data An object containing the ID of the job to retrieve.
   * @returns A ResponseDto object with the job, or an error if the job is not found.
   */
  async getJob(data: GetJobDto) {
    const job = await this.web3Queue.getJob(data.jobId);
    if (!job) {
      throw new RpcException('Job not found');
    }
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
    const jobId = uuidv4();

    const job$: Observable<JobResultDto> = new Observable((observer) => {
      const active = (job: Job<MintDataDto | DeployDataDto>) => {
        checkSubscriptions();
        if (job.id === jobId) {
          observer.next(new JobResultDto(job.id, 'active', job.data));
        }
      };

      const completed = (job: Job<MintDataDto | DeployDataDto>, result: ContractModel | TokenModel) => {
        checkSubscriptions();
        if (job.id === jobId) {
          observer.next(new JobResultDto(job.id, 'completed', result));
          observer.complete();
          removeAllListeners();
        }
      };

      const failed = (job: Job<MintDataDto | DeployDataDto>, error: Error) => {
        checkSubscriptions();
        if (job.id === jobId) {
          observer.next(new JobResultDto(job.id, 'failed', error.message));
          observer.complete();
          removeAllListeners();
        }
      };

      this.web3Queue.addListener('active', active);
      this.web3Queue.addListener('completed', completed);
      this.web3Queue.addListener('failed', failed);

      const checkSubscriptions = () => {
        if (observer.closed) {
          removeAllListeners();
        }
      };

      const removeAllListeners = () => {
        this.web3Queue.removeListener('active', active);
        this.web3Queue.removeListener('completed', completed);
        this.web3Queue.removeListener('failed', failed);
      };
    });

    await this.web3Queue.add(processType, data, { jobId, delay: 1000 });

    return job$;
  }

  /**
   * Sends a transaction to the Ethereum or Polygon network.
   *
   * @param {TxOptions} txOptions - An object containing the transaction details.
   * @returns {Promise<TxResultDto>} - A Promise that resolves to an object containing the transaction object, commission, balance, and transaction receipt (if the transaction was executed).
   * @throws {RpcException} - If there is not enough balance to cover the transaction commission.
   */
  async send(txOptions: TxOptions): Promise<TxResultDto> {
    try {
      const w3: Web3 = txOptions.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const contractObj = txOptions.contractObj;
      const contract = txOptions.contract;

      const tx: TxPayload = {
        nonce: await w3.eth.getTransactionCount(txOptions.from_address),
        maxPriorityFeePerGas: await w3.eth.getGasPrice(),
        from: txOptions.from_address,
        data: txOptions.data,
        value: 0,
      };

      if (txOptions.operationType != OperationTypes.DEPLOY) {
        tx.to = contract.options.address;
        tx.gas = await w3.eth.estimateGas({
          from: txOptions.from_address,
          to: contract.options.address,
          data: txOptions.data,
          value: 0,
        });
      } else {
        tx.gas = await w3.eth.estimateGas({
          from: txOptions.from_address,
          data: txOptions.data,
          value: 0,
        });
      }

      const comission = (+tx.gas * +tx.maxPriorityFeePerGas).toString();
      const balance = await w3.eth.getBalance(txOptions.from_address);

      if (+balance < +comission) {
        throw new RpcException('Not enough balance');
      }

      if (!txOptions.execute) {
        return { tx, comission, balance };
      }

      const txObj = (await this.dbService.create(
        [
          {
            network: txOptions.network,
            status: Statuses.CREATED,
            address: txOptions.from_address,
            tx_payload: tx,
          },
        ],
        ObjectTypes.TRANSACTION,
      )) as TransactionModel[];

      await contractObj.$add('transaction', txObj[0]);

      const account = w3.eth.accounts.decrypt(txOptions.keystore, this.configService.get('DEFAULT_PASSWORD'));
      const signed = await account.signTransaction(tx);

      const hashHandler = async (hash: string) => {
        txObj[0].status = Statuses.PENDING;
        txObj[0].tx_hash = hash;
        await txObj[0].save();
      };

      const receiptHandler = async (receipt: TransactionReceipt) => {
        txObj[0].status = Statuses.PROCESSED;
        txObj[0].tx_receipt = receipt;
        await txObj[0].save();

        if (txOptions.operationType === OperationTypes.DEPLOY) {
          contractObj.status = Statuses.PROCESSED;
          contractObj.address = receipt.contractAddress;
          await contractObj.save();
        }

        if (txOptions.operationType === OperationTypes.MINT) {
          const tokenObj = txOptions.tokenObj;
          tokenObj.status = Statuses.PROCESSED;
          tokenObj.token_id = await this.dbService.getTokenId(contractObj.id);
          tokenObj.address = receipt.contractAddress;
          tokenObj.tx_hash = receipt.transactionHash;
          tokenObj.tx_receipt = receipt;
          await tokenObj.save();
        }

        if (txOptions.operationType === OperationTypes.WHITELIST_ADD) {
          const ids = txOptions.whitelistObj.map((obj) => obj.id);
          await this.dbService.updateStatus({
            object_id: ids,
            object_type: ObjectTypes.WHITELIST,
            status: Statuses.PROCESSED,
            tx_hash: receipt.transactionHash,
            tx_receipt: receipt,
          });
        }
      };
      const txErrorHandler = async (err: Error) => {
        txObj[0].status = Statuses.FAILED;
        txObj[0].error = err;
        await txObj[0].save();
      };
      w3.eth
        .sendSignedTransaction(signed.rawTransaction)
        .on('transactionHash', hashHandler)
        .on('receipt', receiptHandler)
        .on('error', txErrorHandler);

      return { tx, comission, balance, txObj: txObj[0] };
    } catch (error) {
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
    const w3: Web3 = network === Networks.ETHEREUM ? this.ethereum : this.polygon;
    return await w3.eth.getTransactionReceipt(txHash);
  }

  /**
   * Calculates the root of a Merkle tree using the addresses in the leaves array as the leaves of the tree.
   *
   * @param {WhitelistModel[]} leaves - An array of objects representing the leaves of the Merkle tree.
   * @returns {Promise<string>} - A Promise that resolves to the hexadecimal representation of the root of the Merkle tree.
   */
  async getMerkleRoot(leaves: WhitelistModel[]): Promise<string> {
    const hashLeaves = leaves.map((x) => U.keccak256(x.address));
    const tree = new MerkleTree(hashLeaves, U.keccak256, { sortPairs: true });
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
    const hashLeaves = leaves.map((x) => U.keccak256(x.address));
    const tree = new MerkleTree(hashLeaves, U.keccak256, { sortPairs: true });
    return tree.getHexProof(U.keccak256(address));
  }

  /**
   * Creates a new Ethereum account.
   *
   * @returns {Promise<Wallet>} - A Promise that resolves to an object containing the address and keystore of the new account.
   */
  async newWallet(): Promise<Wallet> {
    const password = await this.configService.get('DEFAULT_PASSWORD');
    const account = this.ethereum.eth.accounts.create();
    const address = account.address;
    const keystore = account.encrypt(password);

    return { address, keystore };
  }
}
