import * as U from 'web3-utils';
import Web3 from 'web3';
import MerkleTree from 'merkletreejs';
import ganache from 'ganache';
import { TransactionReceipt } from 'web3-core';
import { ConfigService } from '@nestjs/config';
import { DeployDto } from './dto/deploy.dto';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { Networks, ObjectTypes, OperationTypes, Statuses } from '../common/constants';
import { RpcException } from '@nestjs/microservices';
import { TxPayloadDto } from './dto/txPayload.dto';
import { ITxOptions } from './interfaces/tx-options.interface';
import { TxResultDto } from './dto/txResult.dto';
import { WhitelistModel } from '../repository/models/whitelist.model';
import { RepositoryService } from '../repository/repository.service';
import { TransactionModel } from '../repository/models/transaction.model';
import { IWallet } from './interfaces/wallet.interface';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { SendAdminDto } from './dto/send-admin.dto';
import { GetAdminDto } from './dto/get-admin.dto';
import { WalletModel } from '../repository/models/wallet.model';
import { CallDto } from './dto/call.dto';
import { enumValuesToObject } from '../common/utils/enum.util';
import { ContractModel } from '../repository/models/contract.model';
import { EventBus } from '@nestjs/cqrs';
import { TxExecutedEvent } from './events/tx-executed.event';

/**
 * A service class for interacting with Web3.
 */
@Injectable()
export class Web3Service implements OnModuleInit {
  public networks = new Map<Networks, Web3>();
  constructor(
    private readonly config: ConfigService,
    private readonly repository: RepositoryService,
    private readonly eventBus: EventBus,
  ) {}

  async onModuleInit() {
    const net = enumValuesToObject(Networks);
    for (const key in net) {
      this.networks.set(net[key], await this.buildNetworkInstance(net[key]));
    }

    if (this.config.get('USE_GANACHE') === 'true') {
      const secretKey = this.config.get('PRIV_KEY');
      this.networks.set(
        Networks.LOCAL,
        new Web3(
          ganache.provider({
            wallet: { accounts: [{ secretKey, balance: U.toHex(U.toWei('1000')) }] },
            logging: { quiet: true },
          }),
        ),
      );
    }
  }

  async buildNetworkInstance(network: Networks) {
    switch (network) {
      case Networks.ETHEREUM:
        return new Web3(new Web3.providers.HttpProvider(this.config.get('ETHEREUM_HOST')));
      case Networks.ETHEREUM_TEST:
        return new Web3(new Web3.providers.HttpProvider(this.config.get('ETHEREUM_HOST')));
      case Networks.POLYGON:
        return new Web3(new Web3.providers.HttpProvider(this.config.get('POLYGON_HOST')));
      case Networks.POLYGON_TEST:
        return new Web3(new Web3.providers.HttpProvider(this.config.get('POLYGON_HOST')));
    }
  }

  async getWallet(data: CallDto | DeployDto): Promise<{ wallet: WalletModel; keystore: any }> {
    const wallet = await this.repository.findOneByAddress<WalletModel>(data.from_address, ObjectTypes.WALLET);
    if (data?.execute && !wallet) throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'from_address not found' });
    const keystore = data?.execute ? wallet.keystore : null;
    return { wallet, keystore };
  }

  /**
   * Sends a transaction to the Ethereum or Polygon network.
   */
  async processTx(txPayload: TxPayloadDto): Promise<TxResultDto> {
    const w3 = this.getWeb3(txPayload.network);
    const { maxPriorityFeePerGas } = await this.calculateGas(w3, txPayload.network);
    const gasPrice = await w3.eth.getGasPrice();
    const contractModel = txPayload.contract_model;
    const contractInst = txPayload.contract_inst;
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
        tx.to = contractInst.options.address;
        tx.value = +U.toWei(contractModel.price, 'ether');
        tx.gas = await w3.eth.estimateGas({
          from: txPayload.from_address,
          to: tx.to,
          data: txPayload.data,
          value: tx.value || 0,
        });
        break;
      default:
        const value = txPayload.value ? +U.toWei(txPayload.value, 'ether') : 0;
        tx.to = contractInst.options.address;
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
    if (+balance < +commission) throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Not enough balance' });
    if (!txPayload.execute) return { payload: tx, commission, balance };

    const txModelPayload = {
      network: txPayload.network,
      status: Statuses.CREATED,
      address: txPayload.from_address,
      tx_payload: tx,
    };
    const [txModel] = await this.repository.create<TransactionModel>([txModelPayload], ObjectTypes.TRANSACTION);
    contractModel.$add('transaction', txModel);

    const account = w3.eth.accounts.decrypt(txPayload.keystore, this.config.get('DEFAULT_PASSWORD'));
    const signed = await account.signTransaction(tx);
    const receipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);

    if (receipt.status) {
      this.eventBus.publish(new TxExecutedEvent({ payload: txPayload, receipt }));
      txModel.status = Statuses.PROCESSED;
      txModel.tx_receipt = receipt;
      await txModel.save();
    } else {
      txModel[0].status = Statuses.FAILED;
      await txModel[0].save();
    }

    return { payload: tx, commission, balance, txModel };
  }

  async calculateGas(w3: Web3, network: Networks): Promise<{ maxFeePerGas: number; maxPriorityFeePerGas: string }> {
    if (network === Networks.LOCAL) {
      const gasPrice = await w3.eth.getGasPrice();
      return { maxFeePerGas: +gasPrice, maxPriorityFeePerGas: gasPrice };
    }

    const block = await w3.eth.getBlock('latest');
    const maxPriorityFeePerGas = (
      await (
        await fetch((w3.currentProvider as any).host, {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'eth_maxPriorityFeePerGas' }),
        })
      ).json()
    ).result;
    const max_priority_fee = U.hexToNumber(maxPriorityFeePerGas);
    const maxFeePerGas = block.baseFeePerGas + +max_priority_fee;
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
      if (address.length > 1) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Only one address is allowed.' });
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
  async newWallet(data: CreateWalletDto): Promise<IWallet> {
    try {
      const w3 = this.getWeb3(data.network);
      const password = await this.config.get('DEFAULT_PASSWORD');
      if (data.test) {
        const account = w3.eth.accounts.wallet.create(1, password);
        if (data.network === Networks.LOCAL) {
          const accounts = await w3.eth.getAccounts();
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
          const pk = await this.config.get('PRIV_KEY');
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

      const account = w3.eth.accounts.create();
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
    if (data.network === Networks.LOCAL) return (await w3.eth.getAccounts())[0];
    const pk = await this.config.get('PRIV_KEY');
    const adminAcc = w3.eth.accounts.privateKeyToAccount(pk);
    return adminAcc.address;
  }

  async sendAdmin(data: SendAdminDto) {
    const w3 = this.getWeb3(data.network);
    if (data.network === Networks.LOCAL) return await w3.eth.sendTransaction(data.payload);
    const pk = await this.config.get('PRIV_KEY');
    const adminAcc = w3.eth.accounts.privateKeyToAccount(pk);
    const signed = await adminAcc.signTransaction(data.payload);
    return await w3.eth.sendSignedTransaction(signed.rawTransaction);
  }

  getWeb3(network: Networks): Web3 {
    return this.networks.get(network);
  }

  async getContract(data: CallDto, w3: Web3): Promise<{ contractModel: ContractModel; contractInst: any; abiObj: any }> {
    const contractModel = await this.repository.getOneObject<ContractModel>(ObjectTypes.CONTRACT, {
      where: { id: data.contract_id },
      include_child: true,
    });
    if (!contractModel) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'contract not found' });
    const contractInst = new w3.eth.Contract(contractModel.deploy_data.abi as U.AbiItem[], contractModel.address);
    const abiObj = contractModel.deploy_data.abi.find((x) => x.name === data.method_name && x.type === 'function');
    if (!abiObj) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'method not found' });
    return { contractModel, contractInst, abiObj };
  }

  async getTokenId(contractInst: any, qty: number) {
    try {
      const tokens_count = +(await contractInst.methods.totalSupply().call());
      const ids_range = [
        { value: tokens_count ?? 0, inclusive: true },
        { value: tokens_count + qty, inclusive: false },
      ];
      const ids_array = qty > 1 ? Array.from({ length: qty }, (v, k) => k + tokens_count) : [tokens_count];
      return { ids_range, ids_array };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  getArgs(args: string, inputs: U.AbiInput[]): any[] {
    try {
      if (!args || args === '') return [];
      const argsArr = args.toString().split('::');
      if (argsArr.length !== inputs.length)
        throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'arguments length is not valid' });
      if (argsArr.length !== 0) {
        return argsArr.map((value, index) => {
          if (inputs[index].type === 'bytes32[]') return JSON.parse(value);
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
}
