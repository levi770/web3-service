import Web3 from 'web3'
import { CallDataDto } from './dto/callData.dto'
import { ConfigService } from '@nestjs/config'
import { Contract } from 'web3-eth-contract'
import { ContractModel } from '../db-manager/models/contract.model'
import { DeployDataDto } from './dto/deployData.dto'
import { GetJobDto } from './dto/getJob.dto'
import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Job, JobPromise, Queue } from 'bull'
import { JobResultDto } from '../common/dto/jobResult.dto'
import { MintDataDto } from './dto/mintData.dto'
import { Networks, OperationTypes, ProcessTypes } from '../common/constants'
import { Observable } from 'rxjs'
import { ResponseDto } from '../common/dto/response.dto'
import { RpcException } from '@nestjs/microservices'
import { TokenModel } from '../db-manager/models/token.model'
import { TransactionReceipt } from 'web3-core'
import { TxObj } from './interfaces/txObj.interface'
import { TxPayload } from './interfaces/tx.interface'
import { TxResultDto } from './dto/txResult.dto'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class Web3Service {
  private ethereum: Web3;
  private polygon: Web3;

  constructor(
    @InjectQueue('web3')
    private web3Queue: Queue,
    private configService: ConfigService,
  ) {
    this.ethereum = new Web3(new Web3.providers.HttpProvider(configService.get('ETHEREUM_HOST')));
    this.polygon = new Web3(new Web3.providers.HttpProvider(configService.get('POLYGON_HOST')));
  }

  async getJob(data: GetJobDto) {
    const job = await this.web3Queue.getJob(data.jobId);

    if (!job) {
      throw new RpcException('Job not found');
    }

    return new ResponseDto(HttpStatus.OK, null, job);
  }

  async process(data: CallDataDto | DeployDataDto, processType: ProcessTypes): Promise<Observable<JobResultDto>> {
    const jobId = uuidv4();

    const job$: Observable<JobResultDto> = new Observable((observer) => {
      const active = (job: Job<MintDataDto | DeployDataDto>, jobPromise: JobPromise) => {
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

  async send(txObj: TxObj): Promise<TxResultDto> {
    try {
      const w3: Web3 = txObj.network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const account = w3.eth.accounts.privateKeyToAccount(this.configService.get('PRIV_KEY'));
      const to = txObj.operationType === OperationTypes.DEPLOY ? null : txObj.contract.options.address;

      const tx: TxPayload = {
        nonce: await w3.eth.getTransactionCount(account.address),
        maxPriorityFeePerGas: await w3.eth.getGasPrice(),
        gas: await w3.eth.estimateGas({
          from: account.address,
          data: txObj.data,
          value: 0,
          to,
        }),
        from: account.address,
        data: txObj.data,
        value: 0,
        to,
      };

      const comission = (+tx.gas * +tx.maxPriorityFeePerGas).toString();
      const balance = await w3.eth.getBalance(account.address);

      if (+balance < +comission) {
        throw new RpcException('Not enough balance');
      }

      if (!txObj.execute) {
        return { tx, comission, balance };
      }

      const signed = await account.signTransaction(tx);
      const txReceipt = await w3.eth.sendSignedTransaction(signed.rawTransaction);

      return { tx, comission, balance, txReceipt };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getTxReceipt(txHash: string, network: Networks) {
    const w3: Web3 = network === Networks.ETHEREUM ? this.ethereum : this.polygon;
    return await w3.eth.getTransactionReceipt(txHash);
  }
}
