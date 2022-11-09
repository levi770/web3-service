import Web3 from 'web3';
import { v4 as uuidv4 } from 'uuid';
import { Contract, ContractSendMethod } from 'web3-eth-contract';
import { Job, JobPromise, Queue } from 'bull';
import { fromEvent, map, Observable, takeUntil } from 'rxjs';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { DeployDataDto } from './dto/deployData.dto';
import { MintDataDto } from './dto/mintData.dto';
import { JobResultDto } from '../common/dto/jobResult.dto';
import { Networks, ProcessTypes } from '../common/constants';
import { ContractModel } from '../common/models/contract.model';
import { TokenModel } from '../common/models/tokens.model';

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

  async process(data: MintDataDto | DeployDataDto, processType: ProcessTypes) {
    const jobId = uuidv4();

    const job$: Observable<JobResultDto> = new Observable((observer) => {
      const active = (job: Job<MintDataDto | DeployDataDto>, jobPromise: JobPromise) => {
        checkSubscriptions();
        observer.next(new JobResultDto(job.id, 'active', null));
      };

      const completed = (job: Job<MintDataDto | DeployDataDto>, result: ContractModel | TokenModel) => {
        checkSubscriptions();
        observer.next(new JobResultDto(job.id, 'completed', null));
        observer.complete();
        clearSubscriptions();
      };

      this.web3Queue.addListener('active', active);
      this.web3Queue.addListener('completed', completed);

      const checkSubscriptions = () => {
        if (observer.closed) {
          clearSubscriptions();
        }
      };

      const clearSubscriptions = () => {
        this.web3Queue.removeListener('active', active);
        this.web3Queue.removeListener('completed', completed);
      };

      switch (processType) {
        case ProcessTypes.MINT:
          this.web3Queue.add('mint', data, { jobId });
          break;

        case ProcessTypes.DEPLOY:
          this.web3Queue.add('deploy', data, { jobId });
          break;
      }
    });

    return job$.pipe(
      map((result: JobResultDto) => {
        if (result.jobId === jobId) {
          return result;
        }
      }),
    );
  }

  async send(contract: Contract, data: ContractSendMethod, deploy: boolean, network: Networks) {
    try {
      const w3: Web3 = network === Networks.ETHEREUM ? this.ethereum : this.polygon;
      const account = w3.eth.accounts.privateKeyToAccount(this.configService.get('PRIV_KEY'));

      const tx = {
        nonce: await w3.eth.getTransactionCount(account.address),
        from: account.address,
        to: contract.options.address,
        gas: await data.estimateGas({ from: account.address, value: 0 }),
        maxPriorityFeePerGas: await w3.eth.getGasPrice(),
        data: data.encodeABI(),
        value: 0,
      };

      if (deploy) {
        delete tx.to;
      }

      const comission = +tx.gas * +tx.maxPriorityFeePerGas;
      const balance = await w3.eth.getBalance(account.address);

      if (+balance < comission) {
        throw new BadRequestException('Not enough balance');
      }

      const signed = await account.signTransaction(tx);
      return await w3.eth.sendSignedTransaction(signed.rawTransaction);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
