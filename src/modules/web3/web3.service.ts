import * as U from 'web3-utils';
import Web3 from 'web3';
import MerkleTree from 'merkletreejs';
import ganache from 'ganache';
import { TransactionReceipt } from 'web3-core';
import { ConfigService } from '@nestjs/config';
import { ContractModel } from '../db/models/contract.model';
import { DeployRequest } from './dto/requests/deploy.request';
import { GetJobRequest } from './dto/requests/getJob.request';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { JobResult } from '../../common/dto/jobResult.dto';
import { IMintOptions } from './interfaces/mintOptions.interface';
import { Networks, ObjectTypes, OperationTypes, ProcessTypes, Statuses, WEB3_QUEUE } from '../../common/constants';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from '../db/models/token.model';
import { ITxPayload } from './interfaces/txPayload.interface';
import { ITxOptions } from './interfaces/txOptions.interface';
import { ITxResult } from './interfaces/txResult.interface';
import { v4 as uuidv4 } from 'uuid';
import { WhitelistModel } from '../db/models/whitelist.model';
import { ProcessData } from '../../common/types';
import { DbService } from '../db/db.service';
import { TransactionModel } from '../db/models/transaction.model';
import { IWallet } from './interfaces/wallet.interface';
import { CreateWalletRequest } from './dto/requests/createWallet.request';
import { SendAdminDto } from './dto/requests/sendAdmin.dto';
import { GetAdminDto } from './dto/requests/getAdmin.dto';
import { WalletModel } from '../db/models/wallet.model';

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
    if (configService.get('USE_GANACHE') === 'true') {
      this.local = new Web3(
        ganache.provider({
          wallet: { accounts: [{ secretKey: configService.get('PRIV_KEY'), balance: U.toHex(U.toWei('1000')) }] },
          logging: { quiet: true },
        }),
      );
    }
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
  async process(data: ProcessData, processType: ProcessTypes): Promise<Observable<JobResult>> {
    try {
      const jobId = uuidv4();
      const job$: Observable<JobResult> = new Observable((observer) => {
        const active = (job: Job<IMintOptions | DeployRequest>) => {
          checkSubscriptions();
          if (job.id === jobId) {
            observer.next(new JobResult(job.id, Statuses.ACTIVE, job.data));
          }
        };
        const completed = (job: Job<IMintOptions | DeployRequest>, result: ContractModel | TokenModel) => {
          checkSubscriptions();
          if (job.id === jobId) {
            observer.next(new JobResult(job.id, Statuses.COMPLETED, result));
            observer.complete();
            removeAllListeners();
          }
        };
        const failed = (job: Job<IMintOptions | DeployRequest>, error: Error) => {
          checkSubscriptions();
          if (job.id === jobId) {
            observer.next(new JobResult(job.id, Statuses.FAILED, error.message));
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
          this.web3Queue.removeListener(Statuses.ACTIVE, active);
          this.web3Queue.removeListener(Statuses.COMPLETED, completed);
          this.web3Queue.removeListener(Statuses.FAILED, failed);
        };

        this.web3Queue.addListener(Statuses.ACTIVE, active);
        this.web3Queue.addListener(Statuses.COMPLETED, completed);
        this.web3Queue.addListener(Statuses.FAILED, failed);
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
  async processTx(txPayload: ITxPayload): Promise<ITxResult> {
    const w3 = this.getWeb3(txPayload.network);
    const { maxFeePerGas, maxPriorityFeePerGas } = await this.calculateGas(w3, txPayload.network);
    const gasPrice = await w3.eth.getGasPrice();
    const contractObj = txPayload.contract_obj;
    const contract = txPayload.contract;
    const tx: ITxOptions = {
      nonce: await w3.eth.getTransactionCount(txPayload.from_address),
      from: txPayload.from_address,
      data: txPayload.data,
      maxPriorityFeePerGas,
    };

    switch (txPayload.operation_type) {
      case OperationTypes.DEPLOY:
        tx.gas = await w3.eth.estimateGas({
          from: txPayload.from_address,
          data: txPayload.data,
          value: 0,
        });
        break;
      case OperationTypes.MINT:
        tx.to = contract.options.address;
        tx.value = +U.toWei(contractObj.price, 'ether');
        tx.gas = await w3.eth.estimateGas({
          from: txPayload.from_address,
          to: tx.to,
          data: txPayload.data,
          value: tx.value || 0,
        });
        break;
      default:
        const value = txPayload.value ? +U.toWei(txPayload.value, 'ether') : 0;
        tx.to = contract.options.address;
        tx.value = value;
        tx.gas = await w3.eth.estimateGas({
          from: txPayload.from_address,
          to: tx.to,
          data: txPayload.data,
          value: value || 0,
        });
        break;
    }

    const commission = (+tx.gas * +gasPrice).toString();
    const balance = await w3.eth.getBalance(txPayload.from_address);

    if (+balance < +commission) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Not enough balance',
      });
    }

    if (!txPayload.execute) {
      return { payload: tx, commission, balance };
    }

    const txObjPayload = {
      network: txPayload.network,
      status: Statuses.CREATED,
      address: txPayload.from_address,
      tx_payload: tx,
    };
    const [txObj] = (await this.dbService.create([txObjPayload], ObjectTypes.TRANSACTION)) as TransactionModel[];
    await contractObj.$add('transaction', txObj);
    const account = w3.eth.accounts.decrypt(txPayload.keystore, this.configService.get('DEFAULT_PASSWORD'));
    const signed = await account.signTransaction(tx);
    const receipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);

    if (receipt.status) {
      txObj.status = Statuses.PROCESSED;
      txObj.tx_receipt = receipt;
      await txObj.save();

      switch (txPayload.operation_type) {
        case OperationTypes.DEPLOY:
          contractObj.status = Statuses.PROCESSED;
          contractObj.address = receipt.contractAddress;
          await contractObj.save();
          break;
        case OperationTypes.MINT:
          const tokenObj = txPayload.token_obj;
          tokenObj.status = Statuses.PROCESSED;
          tokenObj.tx_receipt = receipt;
          await tokenObj.save();
          break;
        case OperationTypes.WHITELIST_ADD:
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
          break;
      }
    } else {
      txObj[0].status = Statuses.FAILED;
      await txObj[0].save();
    }

    return { payload: tx, commission, balance, txObj };
  }

  async calculateGas(w3: Web3, network: Networks): Promise<{ maxFeePerGas: number; maxPriorityFeePerGas: string }> {
    if (network === Networks.LOCAL) {
      const gasPrice = await w3.eth.getGasPrice();
      return { maxFeePerGas: +gasPrice, maxPriorityFeePerGas: gasPrice };
    }

    const block = await w3.eth.getBlock('latest');
    let maxPriorityFeePerGas = (
      await (
        await fetch((w3.currentProvider as any).host, {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'eth_maxPriorityFeePerGas' }),
        })
      ).json()
    ).result;
    let max_priority_fee = U.hexToNumber(maxPriorityFeePerGas);
    let maxFeePerGas = block.baseFeePerGas + +max_priority_fee;
    return { maxFeePerGas, maxPriorityFeePerGas };
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
  async newWallet(data: CreateWalletRequest): Promise<IWallet> {
    try {
      const password = await this.configService.get('DEFAULT_PASSWORD');
      if (data.test) {
        const w3 = this.getWeb3(data.network);
        const account = w3.eth.accounts.wallet.create(1, password);

        if (data.network === Networks.LOCAL) {
          const accounts = await this.local.eth.getAccounts();
          const tx_payload = {
            from: accounts[0],
            to: account[0].address,
            value: U.toWei('10'),
            gas: await w3.eth.estimateGas({
              from: accounts[0],
              to: account[0].address,
              value: U.toWei('10'),
            }),
          };
          await w3.eth.sendTransaction(tx_payload);
          return { address: account[0].address, keystore: account[0].encrypt(password) };
        } else {
          const pk = await this.configService.get('PRIV_KEY');
          const adminAcc = w3.eth.accounts.privateKeyToAccount(pk);
          const tx_payload = {
            from: adminAcc.address,
            to: account[0].address,
            value: U.toWei('0.8'),
            gas: await w3.eth.estimateGas({
              from: adminAcc.address,
              to: account[0].address,
              value: U.toWei('0.8'),
            }),
          };
          const signed = await adminAcc.signTransaction(tx_payload);
          await w3.eth.sendSignedTransaction(signed.rawTransaction);
          return { address: account[0].address, keystore: account[0].encrypt(password) };
        }
      }

      const account = this.ethereum.eth.accounts.create();
      return { address: account.address, keystore: account.encrypt(password) };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async getAdmin(data: GetAdminDto) {
    const w3 = this.getWeb3(data.network);
    if (data.network === Networks.LOCAL) {
      const accounts = await w3.eth.getAccounts();
      return accounts[0];
    }
    const pk = await this.configService.get('PRIV_KEY');
    const adminAcc = w3.eth.accounts.privateKeyToAccount(pk);
    return adminAcc.address;
  }

  async sendAdmin(data: SendAdminDto) {
    const w3 = this.getWeb3(data.network);
    if (data.network === Networks.LOCAL) {
      return await w3.eth.sendTransaction(data.payload);
    }
    const pk = await this.configService.get('PRIV_KEY');
    const adminAcc = w3.eth.accounts.privateKeyToAccount(pk);
    const signed = await adminAcc.signTransaction(data.payload);
    return await w3.eth.sendSignedTransaction(signed.rawTransaction);
  }

  getWeb3(network: Networks): Web3 {
    switch (network) {
      case Networks.ETHEREUM:
        return this.ethereum;
      case Networks.ETHEREUM_TEST:
        return this.ethereum;
      case Networks.POLYGON:
        return this.polygon;
      case Networks.POLYGON_TEST:
        return this.polygon;
      default:
        return this.local;
    }
  }
}
