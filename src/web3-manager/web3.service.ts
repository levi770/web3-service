import Web3 from 'web3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { DeployDataDto } from '../common/dto/deployData.dto';
import { Contract, ContractSendMethod } from 'web3-eth-contract';
import { MintDataDto } from '../common/dto/mintData.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Observable } from 'rxjs';
import { JobResultDto } from '../common/dto/jobResult.dto';
import { ProcessTypes } from '../common/constants';

@Injectable()
export class Web3Service {
  constructor(
    @InjectQueue('web3')
    private web3Queue: Queue,
    private configService: ConfigService,
    private w3: Web3,
  ) {
    this.w3 = new Web3(new Web3.providers.HttpProvider(configService.get('WEB3_HOST')));
  }

  async process(data: MintDataDto | DeployDataDto, processType: ProcessTypes) {
    const jobId = data.jobId;

    const job$: Observable<JobResultDto> = new Observable((obs) => {
      this.web3Queue.on('active', (job, jobPromise) => {
        if (job.id === jobId) {
          obs.next({ jobId: job.id, status: 'active', data: job.data });
        }
      });

      this.web3Queue.on('completed', (job, result) => {
        if (job.id === jobId) {
          obs.next({ jobId: job.id, status: 'completed', data: job.data });
        }
      });
    });

    switch (processType) {
      case ProcessTypes.MINT:
        await this.web3Queue.add('mint', data, { jobId });
        break;

      case ProcessTypes.DEPLOY:
        await this.web3Queue.add('deploy', data, { jobId });
        break;
    }

    return job$;
  }

  async send(contract: Contract, data: ContractSendMethod, deploy: boolean) {
    try {
      const account = this.w3.eth.accounts.privateKeyToAccount(this.configService.get('PRIV_KEY'));

      const tx = {
        nonce: await this.w3.eth.getTransactionCount(account.address),
        from: account.address,
        to: contract.options.address,
        gas: await data.estimateGas({ from: account.address, value: 0 }),
        maxPriorityFeePerGas: await this.w3.eth.getGasPrice(),
        data: data.encodeABI(),
        value: 0,
      };

      if (deploy) {
        delete tx.to;
      }

      const comission = +tx.gas * +tx.maxPriorityFeePerGas;
      const balance = await this.w3.eth.getBalance(account.address);

      if (+balance < comission) {
        throw new RpcException('Not enough balance');
      }

      const signed = await account.signTransaction(tx);
      return await this.w3.eth.sendSignedTransaction(signed.rawTransaction);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
