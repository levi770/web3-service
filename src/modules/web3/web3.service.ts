import * as U from 'web3-utils';
import Web3 from 'web3';
import MerkleTree from 'merkletreejs';
import { TransactionReceipt } from 'web3-core';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployDataDto } from './dto/deployData.dto';
import { GetJobDto } from './dto/getJob.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { JobResultDto } from '../../common/dto/jobResult.dto';
import { MintDataDto } from './dto/mintData.dto';
import {
  CRON_QUEUE,
  Networks,
  ObjectTypes,
  OperationTypes,
  ProcessTypes,
  Statuses,
  WEB3_QUEUE,
} from '../../common/constants';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db/models/token.model';
import { TxOptions } from './interfaces/txOptions.interface';
import { TxPayload } from './interfaces/tx.interface';
import { TxResultDto } from './dto/txResult.dto';
import { v4 as uuidv4 } from 'uuid';
import { WhitelistModel } from '../db/models/whitelist.model';
import { ProcessData, Wallet } from '../../common/types';
import { DbService } from '../db/db.service';
import { TransactionModel } from '../db/models/transaction.model';
import { PredictDto } from './dto/predict.dto';
import * as ethUtils from 'ethereumjs-util';

/**
 * A service class for interacting with Web3.
 */
@Injectable()
export class Web3Service {
  private ethereum: Web3;
  private polygon: Web3;
  private local: Web3;

  constructor(
    @InjectQueue(WEB3_QUEUE) private web3Queue: Queue,
    private configService: ConfigService,
    private dbService: DbService,
  ) {
    this.ethereum = new Web3(new Web3.providers.HttpProvider(configService.get('ETHEREUM_HOST')));
    this.polygon = new Web3(new Web3.providers.HttpProvider(configService.get('POLYGON_HOST')));
    this.local = new Web3(new Web3.providers.HttpProvider(configService.get('LOCAL_HOST')));
  }

  /**
   * Transaction observer worker cron task. Runs every 10 seconds.
   */
  // @Cron(CronExpression.EVERY_10_SECONDS)
  // async handleTask() {
  //   return await this.cronQueue.add(TX_WORKER);
  // }

  /**
   * Retrieve a job from the queue by its ID.
   */
  async getJob(data: GetJobDto) {
    const job = await this.web3Queue.getJob(data.jobId);
    if (!job) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Job not found',
      });
    }
    return job;
  }

  /**
   * Processes a job and returns an Observable that emits job results.
   */
  async processJob(data: ProcessData, processType: ProcessTypes): Promise<Observable<JobResultDto>> {
    try {
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

        this.web3Queue.addListener('active', active);
        this.web3Queue.addListener('completed', completed);
        this.web3Queue.addListener('failed', failed);
      });

      await this.web3Queue.add(processType, data, { jobId, delay: 1000 });
      return job$;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Sends a transaction to the Ethereum or Polygon network.
   */
  async processTx(txOptions: TxOptions): Promise<TxResultDto> {
    try {
      const w3: Web3 = this.getWeb3(txOptions.network);
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
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Not enough balance',
        });
      }

      if (!txOptions.execute) {
        return { tx, comission, balance };
      }

      const txObjData = {
        network: txOptions.network,
        status: Statuses.CREATED,
        address: txOptions.from_address,
        tx_payload: tx,
      };
      const txObj = (await this.dbService.create([txObjData], ObjectTypes.TRANSACTION)) as TransactionModel[];
      await contractObj.$add('transaction', txObj[0]);

      // const receiptHandler = async (receipt: TransactionReceipt) => {
      //   txObj[0].status = Statuses.PROCESSED;
      //   txObj[0].tx_receipt = receipt;
      //   await txObj[0].save();
      //   if (txOptions.operationType === OperationTypes.DEPLOY) {
      //     contractObj.status = Statuses.PROCESSED;
      //     contractObj.address = receipt.contractAddress;
      //     await contractObj.save();
      //   }
      //   if (txOptions.operationType === OperationTypes.MINT) {
      //     const tokenObj = txOptions.tokenObj;
      //     tokenObj.status = Statuses.PROCESSED;
      //     tokenObj.token_id = await this.dbService.getTokenId(contractObj.id);
      //     tokenObj.address = receipt.contractAddress;
      //     tokenObj.tx_hash = receipt.transactionHash;
      //     tokenObj.tx_receipt = receipt;
      //     await tokenObj.save();
      //   }
      //   if (txOptions.operationType === OperationTypes.WHITELIST_ADD) {
      //     const ids = txOptions.whitelistObj.map((obj) => obj.id);
      //     await this.dbService.updateStatus(
      //       {
      //         object_id: ids,
      //         status: Statuses.PROCESSED,
      //         tx_hash: receipt.transactionHash,
      //         tx_receipt: receipt,
      //       },
      //       ObjectTypes.WHITELIST,
      //     );
      //   }
      // };
      // const hashHandler = async (hash: string) => {
      //   txObj[0].status = Statuses.PENDING;
      //   txObj[0].tx_hash = hash;
      //   await txObj[0].save();
      // };
      // const txErrorHandler = async (err: Error) => {
      //   txObj[0].status = Statuses.FAILED;
      //   txObj[0].error = err;
      //   await txObj[0].save();
      // };

      const account = w3.eth.accounts.decrypt(txOptions.keystore, this.configService.get('DEFAULT_PASSWORD'));
      const signed = await account.signTransaction(tx);
      const receipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);
      // .on('transactionHash', hashHandler)
      // .on('receipt', receiptHandler)
      // .on('error', txErrorHandler);

      if (receipt.status) {
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
          const metadataObj = txOptions.metadataObj;
          tokenObj.status = Statuses.PROCESSED;
          tokenObj.token_id = await this.dbService.getTokenId(contractObj.id);
          tokenObj.address = receipt.contractAddress;
          tokenObj.tx_hash = receipt.transactionHash;
          tokenObj.tx_receipt = receipt;
          await tokenObj.save();
          metadataObj.token_id = tokenObj.token_id;
          await metadataObj.save();
        }
        if (txOptions.operationType === OperationTypes.WHITELIST_ADD) {
          const ids = txOptions.whitelistObj.map((obj) => obj.id);
          await this.dbService.updateStatus(
            {
              object_id: ids,
              status: Statuses.PROCESSED,
              tx_hash: receipt.transactionHash,
              tx_receipt: receipt,
            },
            ObjectTypes.WHITELIST,
          );
        }
      } else {
        txObj[0].status = Statuses.FAILED;
        await txObj[0].save();
      }

      return { tx, comission, balance, txObj: txObj[0] };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Gets the transaction receipt for a given transaction hash on a specified network.
   */
  async getTxReceipt(txHash: string, network: Networks): Promise<TransactionReceipt> {
    try {
      const w3: Web3 = this.getWeb3(network);
      return await w3.eth.getTransactionReceipt(txHash);
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Calculates the root of a Merkle tree using the addresses in the leaves array as the leaves of the tree.
   */
  async getMerkleRoot(leaves: WhitelistModel[]): Promise<string> {
    try {
      const hashLeaves = leaves.map((x) => U.keccak256(x.address));
      const tree = new MerkleTree(hashLeaves, U.keccak256, { sortPairs: true });
      return tree.getHexRoot();
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Calculates the Merkle proof for a given address in the leaves array.
   */
  async getMerkleProof(leaves: WhitelistModel[], address: string): Promise<string[]> {
    try {
      const hashLeaves = leaves.map((x) => U.keccak256(x.address));
      const tree = new MerkleTree(hashLeaves, U.keccak256, { sortPairs: true });
      return tree.getHexProof(U.keccak256(address));
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Creates a new Ethereum account.
   */
  async newWallet(): Promise<Wallet> {
    try {
      const password = await this.configService.get('DEFAULT_PASSWORD');
      const account = this.ethereum.eth.accounts.create();
      const address = account.address;
      const keystore = account.encrypt(password);
      return { address, keystore };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  getWeb3(network: Networks): Web3 {
    switch (network) {
      case Networks.ETHEREUM:
        return this.ethereum;
      case Networks.POLYGON:
        return this.polygon;
      default:
        return this.local;
    }
  }

  async predictContractAddress(data: PredictDto) {
    const w3 = this.getWeb3(data.network);
    var nonce = await w3.eth.getTransactionCount(data.owner);
    return ethUtils.bufferToHex(ethUtils.generateAddress(Buffer.from(data.owner), Buffer.from(nonce.toString())));
  }
}
