import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { AppModule } from '../src/app.module';
import { lastValueFrom } from 'rxjs';
import { CMD } from '../src/common/constants';
import { CreateWalletDto } from '../src/web3/dto/createWallet.dto';
import Web3 from 'web3';
import { Account } from 'web3-core';
import { ResponseDto } from '../src/common/dto/response.dto';
import * as U from 'web3-utils';
import { DeployDataDto } from '../src/web3/dto/deployData.dto';
import { JobResultDto } from '../src/common/dto/jobResult.dto';
import deploy_data from './dto/deploy_data.dto.json';
import { DeployResultDto } from '../src/web3/dto/deployResult.dto';

jest.useRealTimers();

describe('AppController (e2e)', () => {
  let server: any;
  let client: ClientProxy;
  let app: INestApplication;
  let w3: Web3;
  let admin_acc: Account;
  let team_acc: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'WEB3_SERVICE',
            transport: Transport.REDIS,
            options: {
              host: process.env.REDIS_HOST,
              port: +process.env.REDIS_PORT,
            },
          },
        ]),
      ],
    }).compile();

    app = module.createNestApplication();
    server = app.getHttpAdapter().getInstance();

    app.connectMicroservice({
      transport: Transport.REDIS,
      options: {
        url: 'redis://0.0.0.0:6379',
      },
    });
    await app.startAllMicroservices();
    await app.init();

    client = app.get('WEB3_SERVICE');
    await client.connect();

    w3 = new Web3(new Web3.providers.HttpProvider(process.env.POLYGON_HOST));
    admin_acc = w3.eth.accounts.privateKeyToAccount(process.env.PRIV_KEY);
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  it(`GET /health - Gets the health status`, async () => {
    const response = await request(server).get('/health').send();
    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({ status: 200, message: 'active', result: null });
  });

  it('{ cmd: CMD.CREATE_WALLET } Creates a new encrypted wallet keystore in DB.', async () => {
    jest.setTimeout(60000);
    const data: CreateWalletDto = { team_id: '12345678' };
    const response: ResponseDto = await lastValueFrom(client.send({ cmd: CMD.CREATE_WALLET }, data));
    expect(response.status).toEqual(201);
    expect(response.message).toEqual('wallet created');
    expect(response.result).toMatchObject({ id: expect.any(String), address: expect.any(String) });
    team_acc = response.result.address;
    const signedTx = await admin_acc.signTransaction({
      from: admin_acc.address,
      to: response.result.address,
      value: U.toWei('0.05'),
      gas: await w3.eth.estimateGas({ from: admin_acc.address, to: response.result.address, value: U.toWei('0.01') }),
    });
    const tx = await w3.eth.sendSignedTransaction(signedTx.rawTransaction);
    expect(tx.status).toBeTruthy();
  }, 60000);

  it('{ cmd: CMD.DEPLOY } Processes a deployment.', async () => {
    jest.setTimeout(60000);
    deploy_data.from_address = team_acc;
    deploy_data.arguments = `100::1::${team_acc}::test contract::TEST::localhost:5000/metadata/`;
    const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.DEPLOY }, deploy_data));
    expect(response.jobId).toBeTruthy();
    expect(response.status).toEqual('completed');
    expect(response.data as DeployResultDto).toMatchObject({ tx: expect.any(Object) });
  }, 60000);
});
