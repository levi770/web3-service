import * as U from 'web3-utils';
import Web3 from 'web3';
import MerkleTree from 'merkletreejs';
import { TransactionReceipt } from 'web3-core';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployRequest } from './dto/requests/deploy.request';
import { GetJobRequest } from './dto/requests/getJob.request';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { JobResult } from '../../common/dto/jobResult.dto';
import { MintData } from './interfaces/mintData.interface';
import { Networks, ObjectTypes, OperationTypes, ProcessTypes, Statuses, WEB3_QUEUE } from '../../common/constants';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db/models/token.model';
import { TxPayload } from './interfaces/txPayload.interface';
import { TxOptions } from './interfaces/txOptions.interface';
import { TxResult } from './interfaces/txResult.interface';
import { v4 as uuidv4 } from 'uuid';
import { WhitelistModel } from '../db/models/whitelist.model';
import { ProcessData } from '../../common/types';
import { DbService } from '../db/db.service';
import { TransactionModel } from '../db/models/transaction.model';
import * as ethUtils from 'ethereumjs-util';
import { Wallet } from './interfaces/wallet.interface';

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
   * Retrieve a job from the queue by its ID.
   */
  async getJob(data: GetJobRequest) {
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
  async processJob(data: ProcessData, processType: ProcessTypes): Promise<Observable<JobResult>> {
    try {
      const jobId = uuidv4();
      const job$: Observable<JobResult> = new Observable((observer) => {
        const active = (job: Job<MintData | DeployRequest>) => {
          checkSubscriptions();
          if (job.id === jobId) {
            observer.next(new JobResult(job.id, 'active', job.data));
          }
        };
        const completed = (job: Job<MintData | DeployRequest>, result: ContractModel | TokenModel) => {
          checkSubscriptions();
          if (job.id === jobId) {
            observer.next(new JobResult(job.id, 'completed', result));
            observer.complete();
            removeAllListeners();
          }
        };
        const failed = (job: Job<MintData | DeployRequest>, error: Error) => {
          checkSubscriptions();
          if (job.id === jobId) {
            observer.next(new JobResult(job.id, 'failed', error.message));
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
  async processTx(txPayload: TxPayload): Promise<TxResult> {
    try {
      const w3: Web3 = this.getWeb3(txPayload.network);
      const contractObj = txPayload.contract_obj;
      const contract = txPayload.contract;
      const tx: TxOptions = {
        nonce: await w3.eth.getTransactionCount(txPayload.from_address),
        maxPriorityFeePerGas: await w3.eth.getGasPrice(),
        from: txPayload.from_address,
        data: txPayload.data,
        value: 0,
      };

      if (txPayload.operation_type != OperationTypes.DEPLOY) {
        tx.to = contract.options.address;
        tx.gas = await w3.eth.estimateGas({
          from: txPayload.from_address,
          to: contract.options.address,
          data: txPayload.data,
          value: 0,
        });
      } else {
        tx.gas = await w3.eth.estimateGas({
          from: txPayload.from_address,
          data: txPayload.data,
          value: 0,
        });
      }

      const comission = (+tx.gas * +tx.maxPriorityFeePerGas).toString();
      const balance = await w3.eth.getBalance(txPayload.from_address);

      if (+balance < +comission) {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Not enough balance',
        });
      }

      if (!txPayload.execute) {
        return { payload: tx, comission, balance };
      }

      const txObjPayload = {
        network: txPayload.network,
        status: Statuses.CREATED,
        address: txPayload.from_address,
        tx_payload: tx,
      };
      const txObj = (await this.dbService.create([txObjPayload], ObjectTypes.TRANSACTION)) as TransactionModel[];
      await contractObj.$add('transaction', txObj[0]);

      const account = w3.eth.accounts.decrypt(txPayload.keystore, this.configService.get('DEFAULT_PASSWORD'));
      const signed = await account.signTransaction(tx);
      const receipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);

      if (receipt.status) {
        txObj[0].status = Statuses.PROCESSED;
        txObj[0].tx_receipt = receipt;
        await txObj[0].save();
        if (txPayload.operation_type === OperationTypes.DEPLOY) {
          contractObj.status = Statuses.PROCESSED;
          contractObj.address = receipt.contractAddress;
          await contractObj.save();
        }
        if (txPayload.operation_type === OperationTypes.MINT) {
          const tokenObj = txPayload.token_obj;
          const metadataObj = txPayload.metadata_obj;
          tokenObj.status = Statuses.PROCESSED;
          tokenObj.token_id = await this.dbService.getTokenId(contractObj.id);
          tokenObj.address = receipt.contractAddress;
          tokenObj.tx_hash = receipt.transactionHash;
          tokenObj.tx_receipt = receipt;
          await tokenObj.save();
          metadataObj.token_id = tokenObj.token_id;
          await metadataObj.save();
        }
        if (txPayload.operation_type === OperationTypes.WHITELIST_ADD) {
          const ids = txPayload.whitelist_obj.map((obj) => obj.id);
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

      return { payload: tx, comission, balance, txObj: txObj[0] };
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
  async getMerkleProof(leaves: WhitelistModel[], addresses: string): Promise<string[]> {
    try {
      const address = addresses.split(',');
      if (address.length > 1) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Only one address is allowed.',
        });
      }
      const hashLeaves = leaves.map((x) => U.keccak256(x.address));
      const tree = new MerkleTree(hashLeaves, U.keccak256, { sortPairs: true });
      return tree.getHexProof(U.keccak256(address[0]));
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

  // async predictContractAddress(data: PredictDto) {
  //   const w3 = this.getWeb3(data.network);
  //   var nonce = await w3.eth.getTransactionCount(data.owner);
  //   return ethUtils.bufferToHex(ethUtils.generateAddress(Buffer.from(data.owner), Buffer.from(nonce.toString())));
  // }
}
