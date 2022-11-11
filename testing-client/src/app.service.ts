import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, map } from 'rxjs';
import { DeployDataDto } from './dto/deployData.dto';
import { GetAllContractsDto } from './dto/getAllContracts.dto';
import { MintDataDto } from './dto/mintData.dto';

@Injectable()
export class AppService {
  constructor(@Inject('WEB3_SERVICE') private client: ClientProxy) {}

  async allContracts(query: GetAllContractsDto) {
    return lastValueFrom(this.client.send({ cmd: 'getAllContracts' }, query));
  }

  async mint(data: MintDataDto) {
    return lastValueFrom(this.client.send({ cmd: 'mintToken' }, data));
  }

  async deploy(data: DeployDataDto) {
    const obs$ = this.client.send({ cmd: 'deployContract' }, data);
    obs$.subscribe((r) => {
      console.log(r);
      return r;
    });
    //return lastValueFrom(this.client.send({ cmd: 'deployContract' }, data));
  }
}
