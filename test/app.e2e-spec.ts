import Web3 from 'web3';
import * as U from 'web3-utils';
import request from 'supertest';
import { Account } from 'web3-core';
import { lastValueFrom } from 'rxjs';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { AppModule } from '../src/app.module';
import { CMD, Networks, ObjectTypes, Statuses } from '../src/common/constants';
import { JobResultDto } from '../src/common/dto/jobResult.dto';
import { CreateWalletDto } from '../src/modules/web3/dto/createWallet.dto';
import { DeployResultDto } from '../src/modules/web3/dto/deployResult.dto';
import { WalletDto } from '../src/modules/db/dto/wallet.dto';
import { MerkleProofDto } from '../src/modules/web3/dto/merkleProof.dto';
import { MintResultDto } from '../src/modules/web3/dto/mintResult.dto';
import { TokenModel } from '../src/modules/db/models/token.model';
import { WhitelistResultDto } from '../src/modules/web3/dto/whitelistResult.dto';
import deploy_data from './dto/deploy_data.dto.json';
import { GetJobDto } from '../src/modules/web3/dto/getJob.dto';
import { ResponseDto } from '../src/common/dto/response.dto';
import { AllObjectsDto } from '../src/modules/db/dto/allObjects.dto';
import { GetAllDto } from '../src/modules/db/dto/getAll.dto';
import { GetOneDto } from '../src/modules/db/dto/getOne.dto';
import { UpdateMetadataDto } from '../src/modules/db/dto/updateMetadata.dto';
import { UpdateStatusDto } from '../src/modules/db/dto/updateStatus.dto';

//jest.useRealTimers();

var timeout = 5000;
var network = Networks.LOCAL;
var admin_acc_address: string;
var team_acc_address: string;
var contract_address: string;
var contract_id: string;
var token_uri_id: number;
var token_id: string;
var tx_receipt: object;

describe('AppController (e2e)', () => {
  let server: any;
  let client: ClientProxy;
  let app: INestApplication;

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
});

describe('Web3Controller (e2e)', () => {
  let server: any;
  let client: ClientProxy;
  let app: INestApplication;
  let w3: Web3;
  let admin_acc: Account;
  let merkle_root: string;
  let admin_acc_proof: string[];
  let team_acc_proof: string[];
  let token: TokenModel;
  let user2_mint_tx_payload: object;
  let contract_name = 'TestToken';
  let jobId: string | number;

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
    w3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCAL_HOST));
    admin_acc = w3.eth.accounts.privateKeyToAccount(process.env.PRIV_KEY);
    admin_acc_address = admin_acc.address;
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  it(
    '{cmd: CMD.CREATE_WALLET} Creates a new encrypted wallet keystore in DB.',
    async () => {
      jest.setTimeout(timeout);
      const data: CreateWalletDto = { team_id: '12345678' };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.CREATE_WALLET }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ id: expect.any(String), address: expect.any(String) });
      const responceData = response.data as WalletDto;
      jobId = response.jobId;
      team_acc_address = responceData.address;
      const signedTx = await admin_acc.signTransaction({
        from: admin_acc_address,
        to: responceData.address,
        value: U.toWei('1'),
        gas: await w3.eth.estimateGas({ from: admin_acc_address, to: responceData.address, value: U.toWei('1') }),
      });
      const tx = await w3.eth.sendSignedTransaction(signedTx.rawTransaction);
      expect(tx.status).toBeTruthy();
    },
    timeout,
  );

  it(
    '{cmd: CMD.JOB} Get job from queue by jobId.',
    async () => {
      jest.setTimeout(timeout);
      const data: GetJobDto = { jobId: jobId.toString() };
      const response: ResponseDto = await lastValueFrom(client.send({ cmd: CMD.JOB }, data));
      expect(response.status).toEqual(HttpStatus.OK);
      expect(response.message).toEqual(expect.any(String));
      expect(response.result).toMatchObject(expect.any(Object));
      const responceData = response.result as any;
      expect(responceData.id).toEqual(jobId);
    },
    timeout,
  );

  it(
    '{cmd: CMD.DEPLOY} Processes a deployment',
    async () => {
      jest.setTimeout(timeout);
      const data = Object(deploy_data);
      // let response = await lastValueFrom(
      //   client.send({ cmd: CMD.PREDICT_ADDRESS }, { owner: team_acc_address, network }),
      // );
      // expect(response.status).toEqual(HttpStatus.OK);
      // const predicted_address = response.result;
      data.from_address = team_acc_address;
      data.arguments = `100::1::${team_acc_address}::${contract_name}::TEST::localhost:5000/metadata/`;
      data.network = network;
      const response = await lastValueFrom(client.send({ cmd: CMD.DEPLOY }, deploy_data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object), contract: expect.any(Object) });
      const responceData = response.data as DeployResultDto;
      contract_id = responceData.contract.id;
      contract_address = responceData.contract.address;
      //expect(contract_address).toEqual(predicted_address);
    },
    timeout,
  );

  it(
    '{cmd: CMD.COMMON} Read contract_name from contract',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: true,
        network: network,
        from_address: team_acc_address,
        contract_id: contract_id,
        method_name: 'name',
        operation_type: 'readcontract',
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.COMMON }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ name: contract_name });
    },
    timeout,
  );

  it(
    '{cmd: CMD.COMMON} toggleSaleActive',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: true,
        network: network,
        from_address: team_acc_address,
        contract_id: contract_id,
        method_name: 'toggleSaleActive',
        operation_type: 'common',
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.COMMON }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object) });
    },
    timeout,
  );

  it(
    '{cmd: CMD.COMMON} toggleSaleFree',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: true,
        network: network,
        from_address: team_acc_address,
        contract_id: contract_id,
        method_name: 'toggleSaleFree',
        operation_type: 'common',
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.COMMON }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object) });
    },
    timeout,
  );

  it(
    '{cmd: CMD.COMMON} editSaleRestrictions',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: true,
        network: network,
        from_address: team_acc_address,
        contract_id: contract_id,
        method_name: 'editSaleRestrictions',
        operation_type: 'common',
        arguments: '100',
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.COMMON }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object) });
    },
    timeout,
  );

  it(
    '{cmd: CMD.WHITELIST} add user1 and user2 to whitelist',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: true,
        network: network,
        from_address: team_acc_address,
        contract_id: contract_id,
        method_name: 'setWhitelistFree',
        operation_type: 'whitelistadd',
        operation_options: {
          addresses: `${team_acc_address},${admin_acc_address}`,
        },
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.WHITELIST }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object) });
      const responceData = response.data as WhitelistResultDto;
      merkle_root = responceData.root;
      admin_acc_proof = (responceData.proof.find((p) => (p as any).address === admin_acc_address) as any).proof;
      team_acc_proof = (responceData.proof.find((p) => (p as any).address === team_acc_address) as any).proof;
    },
    timeout,
  );

  it(
    '{cmd: CMD.GET_MERKLE_PROOF} getMerkleProof user1',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        address: team_acc_address,
        contract_id: contract_id,
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.GET_MERKLE_PROOF }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({
        proof: expect.any(Array),
        root: expect.any(String),
      });
      const responceData = response.data as MerkleProofDto;
      expect(responceData.root).toEqual(merkle_root);
      expect(responceData.proof).toEqual(team_acc_proof);
    },
    timeout,
  );

  it(
    '{cmd: CMD.GET_MERKLE_PROOF} getMerkleProof user2',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        address: admin_acc_address,
        contract_id: contract_id,
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.GET_MERKLE_PROOF }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({
        proof: expect.any(Array),
        root: expect.any(String),
      });
      const responceData = response.data as MerkleProofDto;
      expect(responceData.root).toEqual(merkle_root);
      expect(responceData.proof).toEqual(admin_acc_proof);
    },
    timeout,
  );

  it(
    '{cmd: CMD.MINT} buyFree user1 whitelist',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: true,
        network: network,
        from_address: team_acc_address,
        contract_id: contract_id,
        method_name: 'buyFree',
        arguments: `1::${JSON.stringify(team_acc_proof)}`,
        operation_type: 'mint',
        operation_options: {
          nft_number: '1',
          mint_to: team_acc_address,
          asset_url: 'b8dfd07f-4572-472c-b11c-a6b1354c26c6.original.Dubai.jpg',
          asset_type: 'image',
          meta_data: {
            name: 'meta_data_name',
            description: 'meta_data_description',
            attributes: [
              {
                trait_type: 'attributes_trait_type',
                value: 'attributes_trait_value',
              },
            ],
          },
        },
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.MINT }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object), token: expect.any(Object) });
      const responceData = response.data as MintResultDto;
      token = responceData.token;
    },
    timeout,
  );

  it(
    '{cmd: CMD.COMMON} get tokenURI by tokenId in blockchain',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        network: network,
        contract_id: contract_id,
        from_address: team_acc_address,
        method_name: 'tokenURI',
        arguments: token.token_id,
        operation_type: 'readcontract',
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.COMMON }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tokenURI: expect.any(String) });
      token_uri_id = token.token_id;
    },
    timeout,
  );

  it(
    '{cmd: CMD.MINT} buyFree user2 whitelist nometadata',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: false,
        network: network,
        from_address: admin_acc_address,
        contract_id: contract_id,
        method_name: 'buyFree',
        arguments: `1::${JSON.stringify(admin_acc_proof)}`,
        operation_type: 'mint',
        operation_options: {
          nft_number: '1',
          mint_to: admin_acc_address,
        },
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.MINT }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object) });
      const responceData = response.data as MintResultDto;
      user2_mint_tx_payload = responceData.tx.tx;
      token_id = responceData.token.id;
    },
    timeout,
  );

  it(
    'Execute mint transaction on client side',
    async () => {
      jest.setTimeout(timeout);
      const signedTx = await admin_acc.signTransaction(user2_mint_tx_payload);
      const tx = await w3.eth.sendSignedTransaction(signedTx.rawTransaction);
      expect(tx.status).toBeTruthy();
      tx_receipt = tx;
    },
    timeout,
  );

  it(
    '{cmd: CMD.WHITELIST} remove user2 from whitelist',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: true,
        network: network,
        from_address: team_acc_address,
        contract_id: contract_id,
        method_name: 'setWhitelistFree',
        operation_type: 'whitelistremove',
        operation_options: {
          addresses: `${admin_acc_address}`,
        },
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.WHITELIST }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('completed');
      expect(response.data).toMatchObject({ tx: expect.any(Object) });
    },
    timeout,
  );

  it(
    '{cmd: CMD.MINT} buyFree user2 nowhitelist',
    async () => {
      jest.setTimeout(timeout);
      const data = {
        execute: false,
        network: network,
        from_address: admin_acc_address,
        contract_id: contract_id,
        method_name: 'buyFree',
        arguments: `1::${JSON.stringify(admin_acc_proof)}`,
        operation_type: 'mint',
        operation_options: {
          nft_number: '1',
          mint_to: admin_acc_address,
        },
      };
      const response: JobResultDto = await lastValueFrom(client.send({ cmd: CMD.MINT }, data));
      expect(response.jobId).toBeTruthy();
      expect(response.status).toEqual('failed');
    },
    timeout,
  );
});

describe('DbController (e2e)', () => {
  let server: any;
  let client: ClientProxy;
  let app: INestApplication;
  const metadata = {
    name: 'meta_data_name_updated',
    description: 'meta_data_description_updated',
    attributes: [
      {
        trait_type: 'attributes_trait_type_updated',
        value: 'attributes_trait_value_updated',
      },
    ],
  };

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
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  it(`{ cmd: CMD.ALL_OBJECTS } Get all contracts from DB whith pagination`, async () => {
    const data: GetAllDto = {};
    let response: ResponseDto = await lastValueFrom(client.send({ cmd: CMD.ALL_OBJECTS }, data));
    expect(response.status).toEqual(400);
    data.object_type = ObjectTypes.CONTRACT;
    response = await lastValueFrom(client.send({ cmd: CMD.ALL_OBJECTS }, data));
    expect(response.status).toEqual(200);
    let responceData = response.result as AllObjectsDto;
    expect(responceData.count).toBeGreaterThan(0);
    expect(responceData.rows).toMatchObject(expect.any(Array));
    expect(responceData.rows).toHaveLength(responceData.count);
    data.limit = 1;
    data.page = 1;
    response = await lastValueFrom(client.send({ cmd: CMD.ALL_OBJECTS }, data));
    expect(response.status).toEqual(200);
    responceData = response.result as AllObjectsDto;
    expect(responceData.rows).toMatchObject(expect.any(Array));
    expect(responceData.rows).toHaveLength(1);
    const row = responceData.rows[0];
    data.page = 2;
    response = await lastValueFrom(client.send({ cmd: CMD.ALL_OBJECTS }, data));
    expect(response.status).toEqual(200);
    responceData = response.result as AllObjectsDto;
    expect(responceData.rows).toMatchObject(expect.any(Array));
    expect(responceData.rows).toHaveLength(1);
    expect(responceData.rows[0]).not.toEqual(row);
  });

  it(`{ cmd: CMD.ONE_OBJECT } Get one contract by id from DB with relations `, async () => {
    const data: GetOneDto = { object_type: ObjectTypes.CONTRACT, where: { id: contract_id } };
    let response: ResponseDto = await lastValueFrom(client.send({ cmd: CMD.ONE_OBJECT }, data));
    expect(response.status).toEqual(200);
    expect(response.result).toMatchObject(expect.any(Object));
    data.include_child = true;
    response = await lastValueFrom(client.send({ cmd: CMD.ONE_OBJECT }, data));
    expect(response.status).toEqual(200);
    expect(response.result).toMatchObject(expect.any(Object));
    const responceData = response.result as any;
    expect(responceData.tokens).toMatchObject(expect.any(Array));
    expect(responceData.metadata).toMatchObject(expect.any(Object));
    expect(responceData.transactions).toMatchObject(expect.any(Array));
  });

  it(`{ cmd: CMD.UPDATE_STATUS } Update status of external minted token in DB`, async () => {
    let get_data: GetOneDto = { object_type: ObjectTypes.TOKEN, where: { id: token_id } };
    let response: ResponseDto = await lastValueFrom(client.send({ cmd: CMD.ONE_OBJECT }, get_data));
    expect(response.status).toEqual(200);
    expect(response.result).toMatchObject(expect.any(Object));
    const hash = (tx_receipt as any).transactionHash;
    const update_data: UpdateStatusDto = {
      object_type: ObjectTypes.TOKEN,
      object_id: token_id,
      status: Statuses.PROCESSED,
      tx_hash: hash,
      tx_receipt: tx_receipt,
    };
    response = await lastValueFrom(client.send({ cmd: CMD.UPDATE_STATUS }, update_data));
    expect(response.status).toEqual(200);
    expect(response.result).toMatchObject(expect.any(Array));
    const responceData = response.result as any;
  });

  it(`{ cmd: CMD.UPDATE_METADATA } Update token metadata`, async () => {
    const data: UpdateMetadataDto = {
      address: contract_address,
      token_id: token_uri_id.toString(),
      meta_data: metadata,
    };
    const response: ResponseDto = await lastValueFrom(client.send({ cmd: CMD.UPDATE_METADATA }, data));
    expect(response.status).toEqual(200);
    expect(response.result).toMatchObject({
      address: contract_address,
      contract_id: null,
      createdAt: expect.any(String),
      id: expect.any(String),
      meta_data: {
        attributes: [
          {
            trait_type: 'attributes_trait_type_updated',
            value: 'attributes_trait_value_updated',
          },
        ],
        description: 'meta_data_description_updated',
        image: expect.any(String),
        name: 'meta_data_name_updated',
      },
      status: 'created',
      token_id: token_uri_id,
      type: 'specified',
      updatedAt: expect.any(String),
    });
  });

  it(`GET /metadata/:address/:id - Gets metadata by address and token_id`, async () => {
    const response = await request(server).get(`/metadata/${contract_address}/${token_uri_id}`).send();
    expect(response.status).toEqual(200);
    expect(response.body.attributes).toEqual(metadata.attributes);
    expect(response.body.description).toEqual(metadata.description);
    expect(response.body.name).toEqual(metadata.name);
  });
});
