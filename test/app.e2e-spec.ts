import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { lastValueFrom } from 'rxjs';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from '../src/app.module';
import { CMD, Networks, ObjectTypes, Statuses, WEB3_SERVICE } from '../src/common/constants';
import { JobResult } from '../src/common/dto/jobResult.dto';
import { DeployResponse } from '../src/modules/web3/dto/responses/deploy.response';
import { IWallet } from '../src/modules/db/interfaces/wallet.interface';
import { TokenModel } from '../src/modules/db/models/token.model';
import { WhitelistResponse } from '../src/modules/web3/dto/responses/whitelist.response';
import { GetJobRequest } from '../src/modules/web3/dto/requests/getJob.request';
import { Response } from '../src/common/dto/response.dto';
import { AllObjectsResponce } from '../src/modules/db/dto/responses/allObjects.response';
import { GetAllRequest } from '../src/modules/db/dto/requests/getAll.request';
import { GetOneRequest } from '../src/modules/db/dto/requests/getOne.request';
import { UpdateMetadataRequest } from '../src/modules/db/dto/requests/updateMetadata.request';
import { UpdateStatusRequest } from '../src/modules/db/dto/requests/updateStatus.request';
import { SqsClientModule, SqsClientService } from './sqs-client';
import deploy_data from './data/deploy_data_old.json';

const timeout = 60000;
const network = Networks.LOCAL;
let admin_acc_address: string;
let team_acc_address: string;
let contract_slug: string;
let contract_id: string;
let token_uri_id: number;
let token_uri: string;
let token_id: string;
let tx_receipt: object;

describe('App (e2e) old', () => {
  let redis_client: ClientProxy;
  let sqs_client: SqsClientService;
  let app: INestApplication;
  let server: any;
  let merkle_root: string;
  let admin_acc_proof: string[];
  let team_acc_proof: string[];
  let token: TokenModel;
  let user2_mint_tx_payload: object;
  const contract_name = 'TestToken';
  let jobId: string | number;
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
        SqsClientModule,
        ClientsModule.register([
          {
            name: WEB3_SERVICE,
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
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
      },
    });
    await app.startAllMicroservices();
    await app.init();
    server = app.getHttpAdapter().getInstance();
    redis_client = app.get(WEB3_SERVICE);
    await redis_client.connect();
    sqs_client = app.get(SqsClientService);
    admin_acc_address = await lastValueFrom(redis_client.send({ cmd: CMD.GET_ADMIN }, {}));
    expect(admin_acc_address).not.toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
    await redis_client.close();
  });

  describe('AppController', () => {
    it(`GET /health - Gets the health status`, async () => {
      const response = await request(server).get('/health').send();
      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({ status: 200, message: 'active', data: null });
    });
  });

  describe('Web3Controller', () => {
    it(
      '{cmd: CMD.CREATE_WALLET} Creates a new encrypted wallet keystore in DB.',
      async () => {
        jest.setTimeout(timeout);
        const data = { team_id: '1123456', test: true };
        const response = await lastValueFrom(redis_client.send({ cmd: CMD.CREATE_WALLET }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({ id: expect.any(String), address: expect.any(String) });
        const responceData = response.data as IWallet;
        jobId = response.jobId;
        team_acc_address = responceData.address;
      },
      timeout,
    );

    it(
      '{cmd: CMD.JOB} Get job from queue by jobId.',
      async () => {
        jest.setTimeout(timeout);
        expect(jobId).toBeTruthy();
        const data: GetJobRequest = { jobId: jobId.toString() };
        const response: Response = await lastValueFrom(redis_client.send({ cmd: CMD.JOB }, data));
        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.message).toEqual(expect.any(String));
        expect(response.data).toMatchObject(expect.any(Object));
        const responceData = response.data as any;
        expect(responceData.id).toEqual(jobId);
      },
      timeout,
    );

    it(
      '{cmd: CMD.DEPLOY} Processes a deployment',
      async () => {
        jest.setTimeout(timeout);
        const data = Object(deploy_data);
        data.from_address = team_acc_address;
        data.slug = uuidv4();
        data.arguments = `100::1::${team_acc_address}::${contract_name}::TEST::/metadata/${data.slug}/`;
        data.network = network;
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.DEPLOY }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({ tx: expect.any(Object), contract: expect.any(Object) });
        const responceData = response.data as any as DeployResponse;
        contract_id = responceData.contract.id;
        contract_slug = responceData.contract.slug;
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.COMMON }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.COMMON }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({
          payload: expect.any(Object),
          balance: expect.any(String),
          comission: expect.any(String),
          txObj: expect.any(Object),
        });
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.COMMON }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({
          payload: expect.any(Object),
          balance: expect.any(String),
          comission: expect.any(String),
          txObj: expect.any(Object),
        });
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.COMMON }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({
          payload: expect.any(Object),
          balance: expect.any(String),
          comission: expect.any(String),
          txObj: expect.any(Object),
        });
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.WHITELIST }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({ tx: expect.any(Object) });
        const responceData = response.data as any as WhitelistResponse;
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
          addresses: team_acc_address,
          contract_id: contract_id,
        };
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.GET_MERKLE_PROOF }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({
          proof: expect.any(Array),
          root: expect.any(String),
        });
        const responceData = response.data as any;
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
          addresses: admin_acc_address,
          contract_id: contract_id,
        };
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.GET_MERKLE_PROOF }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({
          proof: expect.any(Array),
          root: expect.any(String),
        });
        const responceData = response.data as any;
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.MINT }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({ tx: expect.any(Object), token: expect.any(Object) });
        const responceData = response.data as any;
        token = responceData.token;
      },
      timeout,
    );

    it(
      '{cmd: CMD.COMMON} get tokenURI by tokenId in blockchain',
      async () => {
        jest.setTimeout(timeout);
        expect(token).toBeTruthy();
        const data = {
          execute: true,
          network: network,
          contract_id: contract_id,
          from_address: team_acc_address,
          method_name: 'tokenURI',
          //arguments: token.token_id,
          operation_type: 'readcontract',
        };
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.COMMON }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({ tokenURI: expect.any(String) });
        //token_uri_id = token.token_id;
        token_uri = (response.data as any).tokenURI;
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.MINT }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('completed');
        expect(response.data).toMatchObject({ tx: expect.any(Object) });
        const responceData = response.data as any;
        user2_mint_tx_payload = responceData.tx.payload;
        token_id = responceData.token.id;
      },
      timeout,
    );

    it(
      'Execute mint transaction on client side',
      async () => {
        jest.setTimeout(timeout);
        const tx = await lastValueFrom(redis_client.send({ cmd: CMD.SEND_ADMIN }, user2_mint_tx_payload));
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.WHITELIST }, data));
        if (response.status === 'failed') {
          console.log(response);
        }
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
        const response: JobResult = await lastValueFrom(redis_client.send({ cmd: CMD.MINT }, data));
        expect(response.jobId).toBeTruthy();
        expect(response.status).toEqual('failed');
      },
      timeout,
    );
  });

  describe('DbController', () => {
    it(`{ cmd: CMD.ALL_OBJECTS } Get all contracts from DB whith pagination`, async () => {
      const data: GetAllRequest = { object_type: ObjectTypes.CONTRACT };
      let response: Response = await lastValueFrom(redis_client.send({ cmd: CMD.ALL_OBJECTS }, data));
      expect(response.status).toEqual(200);
      let responceData = response.data as AllObjectsResponce;
      expect(responceData.count).toBeGreaterThan(0);
      expect(responceData.rows).toMatchObject(expect.any(Array));
      expect(responceData.rows).toHaveLength(responceData.count);
      data.limit = 1;
      data.page = 1;
      response = await lastValueFrom(redis_client.send({ cmd: CMD.ALL_OBJECTS }, data));
      expect(response.status).toEqual(200);
      responceData = response.data as AllObjectsResponce;
      expect(responceData.rows).toMatchObject(expect.any(Array));
      expect(responceData.rows).toHaveLength(1);
      const row = responceData.rows[0];
      data.page = 2;
      response = await lastValueFrom(redis_client.send({ cmd: CMD.ALL_OBJECTS }, data));
      expect(response.status).toEqual(200);
      responceData = response.data as AllObjectsResponce;
      expect(responceData.rows).toMatchObject(expect.any(Array));
      expect(responceData.rows).toHaveLength(1);
      expect(responceData.rows[0]).not.toEqual(row);
    });

    it(`{ cmd: CMD.ONE_OBJECT } Get one contract by id from DB with relations `, async () => {
      const data: GetOneRequest = { object_type: ObjectTypes.CONTRACT, where: { id: contract_id } };
      let response: Response = await lastValueFrom(redis_client.send({ cmd: CMD.ONE_OBJECT }, data));
      expect(response.status).toEqual(200);
      expect(response.data).toMatchObject(expect.any(Object));
      data.include_child = true;
      response = await lastValueFrom(redis_client.send({ cmd: CMD.ONE_OBJECT }, data));
      expect(response.status).toEqual(200);
      expect(response.data).toMatchObject(expect.any(Object));
      const responceData = response.data as any;
      expect(responceData.tokens).toMatchObject(expect.any(Array));
      expect(responceData.metadata).toMatchObject(expect.any(Object));
      expect(responceData.transactions).toMatchObject(expect.any(Array));
    });

    it(`{ cmd: CMD.UPDATE_STATUS } Update status of external minted token in DB`, async () => {
      const get_data: GetOneRequest = { object_type: ObjectTypes.TOKEN, where: { id: token_id } };
      let response: Response = await lastValueFrom(redis_client.send({ cmd: CMD.ONE_OBJECT }, get_data));
      expect(response.status).toEqual(200);
      expect(response.data).toMatchObject(expect.any(Object));
      expect((tx_receipt as any).transactionHash).not.toBeUndefined();
      const hash = (tx_receipt as any).transactionHash;
      const update_data: UpdateStatusRequest = {
        object_type: ObjectTypes.TOKEN,
        object_id: token_id,
        status: Statuses.PROCESSED,
        tx_hash: hash,
        tx_receipt: tx_receipt,
      };
      response = await lastValueFrom(redis_client.send({ cmd: CMD.UPDATE_STATUS }, update_data));
      expect(response.status).toEqual(200);
      expect(response.data).toMatchObject(expect.any(Array));
    });

    it(`{ cmd: CMD.UPDATE_METADATA } Update token metadata`, async () => {
      expect(token_uri_id).not.toBeUndefined();
      const data: UpdateMetadataRequest = {
        slug: contract_slug,
        //token_id: token_uri_id.toString(),
        meta_data: metadata,
      };
      const response: Response = await lastValueFrom(redis_client.send({ cmd: CMD.UPDATE_METADATA }, data));
      expect(response.status).toEqual(200);
      expect(response.data).toMatchObject({
        slug: contract_slug,
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

    it(`GET /metadata/:slug/:id - Gets metadata by slug and token_id`, async () => {
      const response = await request(server).get(`${token_uri}`).send();
      expect(response.status).toEqual(200);
      expect(response.body.attributes).toEqual(metadata.attributes);
      expect(response.body.description).toEqual(metadata.description);
      expect(response.body.name).toEqual(metadata.name);
    });
  });

  describe('SqsHandler', () => {
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest.spyOn(sqs_client, 'receive');
    });

    afterEach(() => {
      logSpy.mockClear();
    });

    it(
      '{cmd: CMD.DEPLOY} Processes an SQS message to deploy a contract.',
      async () => {
        jest.setTimeout(timeout);
        const data = Object(deploy_data);
        data.from_address = team_acc_address;
        data.arguments = `100::1::${team_acc_address}::${contract_name}::TEST::localhost:5000/metadata/`;
        data.network = network;
        const response = await sqs_client.send({ cmd: CMD.DEPLOY }, data);
        expect(response[0]).toMatchObject({
          Id: expect.any(String),
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String),
          SequenceNumber: expect.any(String),
        });
        await new Promise((resolve) => setTimeout(resolve, 30000));
        expect(logSpy).toBeCalledTimes(1);
      },
      timeout,
    );
  });
});