import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from '../src/app.module';
import { CMD, FileTypes, Networks, ObjectTypes, Statuses, WEB3_SERVICE } from '../src/common/constants';
import { TokenModel } from '../src/repository/models/token.model';
import { ResponseDto } from '../src/common/dto/response.dto';
import { GetAllDto } from '../src/repository/dto/get-all.dto';
import { GetOneDto } from '../src/repository/dto/get-one.dto';
import { SqsClientModule, SqsClientService } from './sqs-client';
import deploy_data from './data/deploy_data_new.json';
import { UpdateStatusDto } from '../src/repository/dto/update-status.dto';
import { UpdateMetadataDto } from '../src/repository/dto/update-metadata.dto';

jest.useRealTimers();

const timeout = 600000;
const network = Networks.POLYGON_TEST;
let admin_acc_address: string;
let team_acc_address: string;
let contract_slug: string;
let contract_id: string;
let token1_uri_id: string;
let token10_uri_id: string;
let token1_uri: string;
let token10_uri: string;
let token_id: string;
let tx_receipt: object;

const contract_name = 'TestToken';
const metadata1 = {
  name: 'meta_data_1_name',
  description: 'meta_data_1_description',
  attributes: [
    {
      trait_type: 'attributes_trait_type',
      value: 'attributes_trait_value',
    },
  ],
};
const metadata1_updated = {
  name: 'meta_data_1_name_updated',
  description: 'meta_data_1_description_updated',
  attributes: [
    {
      trait_type: 'attributes_trait_type_updated',
      value: 'attributes_trait_value_updated',
    },
  ],
};
const metadata10 = {
  name: 'meta_data_10_name',
  description: 'meta_data_10_description',
  attributes: [
    {
      trait_type: 'attributes_trait_type',
      value: 'attributes_trait_value',
    },
  ],
};
const metadata10_updated = {
  name: 'meta_data_10_name_updated',
  description: 'meta_data_10_description_updated',
  attributes: [
    {
      trait_type: 'attributes_trait_type_updated',
      value: 'attributes_trait_value_updated',
    },
  ],
};

describe('App (e2e) latest', () => {
  let redis_client: ClientProxy;
  let sqs_client: SqsClientService;
  let app: INestApplication;
  let server: any;
  let merkle_root: string;
  let admin_acc_proof: string[];
  let team_acc_proof: string[];
  let token: TokenModel;
  let user2_mint_tx_payload: object;

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
    admin_acc_address = await lastValueFrom(redis_client.send({ cmd: CMD.GET_ADMIN }, { network }));
    expect(admin_acc_address).not.toBeUndefined();
  });

  afterAll(async () => {
    await app.close();
    await redis_client.close();
  });

  describe('AppController', () => {
    it(
      `GET /health - Gets the health status`,
      async () => {
        jest.setTimeout(timeout);
        const response = await request(server).get('/health').send();
        expect(response.status).toEqual(200);
        expect(response.body).toMatchObject({ status: 200, message: ['active'], data: null });
      },
      timeout,
    );
  });

  describe('Web3Controller', () => {
    it(
      '{cmd: CMD.CREATE_WALLET} Creates a new encrypted wallet keystore in DB.',
      async () => {
        jest.setTimeout(timeout);

        const response = await lastValueFrom(redis_client.send({ cmd: CMD.CREATE_WALLET }, { team_id: '1123456', test: true, network }));
        if (response.status === 'failed') console.log(response);

        expect(response.status).toBeTruthy();
        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ id: expect.any(String), address: expect.any(String) });

        team_acc_address = response.data.address;
      },
      timeout,
    );

    it(
      '{cmd: CMD.DEPLOY} Processes a deployment free collection',
      async () => {
        jest.setTimeout(timeout);

        const data = Object(deploy_data);
        data.from_address = team_acc_address;
        data.slug = uuidv4();
        data.price = '0';
        data.arguments = `100::0::10::10::true::${team_acc_address}::${contract_name}::TEST::/metadata/${data.slug}/`;
        data.network = network;

        const response: ResponseDto = await lastValueFrom(redis_client.send({ cmd: CMD.DEPLOY }, data));
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tx: expect.any(Object), contract: expect.any(Object), metadata: expect.any(Object) });

        contract_id = response.data.contract.id;
        contract_slug = response.data.contract.slug;
      },
      timeout,
    );

    it(
      '{cmd: CMD.COMMON} Read contract_name from contract',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.COMMON },
            {
              execute: true,
              network: network,
              from_address: team_acc_address,
              contract_id: contract_id,
              method_name: 'name',
              operation_type: 'readcontract',
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ name: contract_name });
      },
      timeout,
    );

    it(
      '{cmd: CMD.COMMON} toggleSaleActive',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.COMMON },
            {
              execute: true,
              network: network,
              from_address: team_acc_address,
              contract_id: contract_id,
              method_name: 'toggleSaleActive',
              operation_type: 'common',
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({
          payload: expect.any(Object),
          balance: expect.any(String),
          commission: expect.any(String),
          txModel: expect.any(Object),
        });
      },
      timeout,
    );

    it(
      '{cmd: CMD.COMMON} toggleWhitelistSaleActive',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.COMMON },
            {
              execute: true,
              network: network,
              from_address: team_acc_address,
              contract_id: contract_id,
              method_name: 'toggleWhitelistSaleActive',
              operation_type: 'common',
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({
          payload: expect.any(Object),
          balance: expect.any(String),
          commission: expect.any(String),
          txModel: expect.any(Object),
        });
      },
      timeout,
    );

    it(
      '{cmd: CMD.WHITELIST} add user1 and user2 to whitelist',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.WHITELIST },
            {
              execute: true,
              network: network,
              from_address: team_acc_address,
              contract_id: contract_id,
              method_name: 'setMerkleRoot',
              operation_type: 'whitelistadd',
              operation_options: {
                addresses: `${team_acc_address},${admin_acc_address}`,
              },
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tx: expect.any(Object) });

        merkle_root = response.data.root;
        admin_acc_proof = response.data.proof.find((p: any) => p.address === admin_acc_address).proof;
        team_acc_proof = response.data.proof.find((p: any) => p.address === team_acc_address).proof;
      },
      timeout,
    );

    it(
      '{cmd: CMD.GET_MERKLE_PROOF} getMerkleProof user1',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send({ cmd: CMD.GET_MERKLE_PROOF }, { addresses: team_acc_address, contract_id: contract_id }),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ proof: expect.any(Array), root: expect.any(String) });
        expect(response.data.root).toEqual(merkle_root);
        expect(response.data.proof).toEqual(team_acc_proof);
      },
      timeout,
    );

    it(
      '{cmd: CMD.GET_MERKLE_PROOF} getMerkleProof user2',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send({ cmd: CMD.GET_MERKLE_PROOF }, { addresses: admin_acc_address, contract_id: contract_id }),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ proof: expect.any(Array), root: expect.any(String) });
        expect(response.data.root).toEqual(merkle_root);
        expect(response.data.proof).toEqual(admin_acc_proof);
      },
      timeout,
    );

    it(
      '{cmd: CMD.MINT} buy user1 whitelist free collection',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.MINT },
            {
              execute: true,
              network: network,
              from_address: team_acc_address,
              contract_id: contract_id,
              method_name: 'buy',
              arguments: `${1}::${JSON.stringify(team_acc_proof)}`,
              operation_type: 'mint',
              operation_options: {
                mint_to: team_acc_address,
                qty: 1,
                asset_url: 'assets/1ab94f9c-b510-478d-99e3-35474853b253.jpeg',
                asset_type: 'image',
                meta_data: metadata1,
              },
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tx: expect.any(Object), token: expect.any(Object) });

        token = response.data.token;
      },
      timeout,
    );

    it(
      '{cmd: CMD.COMMON} get tokenURI by tokenId in blockchain',
      async () => {
        jest.setTimeout(timeout);

        expect(token).toBeTruthy();
        token1_uri_id = '0';

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.COMMON },
            {
              execute: true,
              network: network,
              contract_id: contract_id,
              from_address: team_acc_address,
              method_name: 'tokenURI',
              arguments: token1_uri_id,
              operation_type: 'readcontract',
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tokenURI: expect.any(String) });

        token1_uri = (response.data as any).tokenURI;
      },
      timeout,
    );

    it(
      '{cmd: CMD.MINT} buy user1 whitelist free collection with animation parameter',
      async () => {
        jest.setTimeout(timeout);

        let response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.MINT },
            {
              execute: true,
              network: network,
              from_address: team_acc_address,
              contract_id: contract_id,
              method_name: 'buy',
              arguments: `${1}::${JSON.stringify(team_acc_proof)}`,
              operation_type: 'mint',
              operation_options: {
                mint_to: team_acc_address,
                qty: 1,
                asset_url: 'assets/1ab94f9c-b510-478d-99e3-35474853b253.jpeg',
                asset_type: FileTypes.ANIMATION,
                meta_data: metadata1,
              },
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tx: expect.any(Object), token: expect.any(Object) });

        token = response.data.token;

        response = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.COMMON },
            {
              execute: true,
              network: network,
              contract_id: contract_id,
              from_address: team_acc_address,
              method_name: 'tokenURI',
              arguments: token.token_ids[0],
              operation_type: 'readcontract',
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tokenURI: expect.any(String) });

        const animation_token_uri = response.data.tokenURI;

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const get_response = await request(server).get(animation_token_uri).send();
        if (get_response.status != 200) console.log(get_response.body);

        expect(get_response.status).toEqual(200);
        expect(get_response.body.animation_url).toBeDefined();
        expect(get_response.body.animation_url.substring(0, 7)).toEqual('ipfs://');
      },
      timeout,
    );

    it(
      '{cmd: CMD.MINT} buy user2 whitelist nometadata free collection',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.MINT },
            {
              execute: false,
              network: network,
              from_address: admin_acc_address,
              contract_id: contract_id,
              method_name: 'buy',
              arguments: `${1}::${JSON.stringify(admin_acc_proof)}`,
              operation_type: 'mint',
              operation_options: {
                mint_to: admin_acc_address,
                qty: 1,
              },
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tx: expect.any(Object) });

        user2_mint_tx_payload = response.data.tx.payload;
        token_id = response.data.token.id;
      },
      timeout,
    );

    it(
      'Execute mint transaction on client side',
      async () => {
        jest.setTimeout(timeout);
        const tx = await lastValueFrom(redis_client.send({ cmd: CMD.SEND_ADMIN }, { network, payload: user2_mint_tx_payload }));
        expect(tx.status).toBeTruthy();
        tx_receipt = tx;
      },
      timeout,
    );

    it(
      '{cmd: CMD.MINT} buy user2 whitelist metadata10 free collection',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.MINT },
            {
              execute: false,
              network: network,
              from_address: admin_acc_address,
              contract_id: contract_id,
              method_name: 'buy',
              arguments: `${10}::${JSON.stringify(admin_acc_proof)}`,
              operation_type: 'mint',
              operation_options: {
                mint_to: admin_acc_address,
                qty: 10,
                asset_url: 'b8dfd07f-4572-472c-b11c-a6b1354c26c6.original.Dubai.jpg',
                asset_type: 'image',
                meta_data: metadata10,
              },
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tx: expect.any(Object) });

        user2_mint_tx_payload = response.data.tx.payload;
      },
      timeout,
    );

    it(
      'Execute mint transaction on client side',
      async () => {
        jest.setTimeout(timeout);
        const tx = await lastValueFrom(redis_client.send({ cmd: CMD.SEND_ADMIN }, { network, payload: user2_mint_tx_payload }));
        expect(tx.status).toBeTruthy();
        tx_receipt = tx;
      },
      timeout,
    );

    it(
      '{cmd: CMD.COMMON} get tokenURI by tokenId in blockchain',
      async () => {
        jest.setTimeout(timeout);

        expect(token).toBeTruthy();
        token10_uri_id = '7';

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.COMMON },
            {
              execute: true,
              network: network,
              contract_id: contract_id,
              from_address: team_acc_address,
              method_name: 'tokenURI',
              arguments: token10_uri_id,
              operation_type: 'readcontract',
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tokenURI: expect.any(String) });

        token10_uri = response.data.tokenURI;
      },
      timeout,
    );

    it(
      '{cmd: CMD.WHITELIST} remove user2 from whitelist',
      async () => {
        jest.setTimeout(timeout);

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.WHITELIST },
            {
              execute: true,
              network: network,
              from_address: team_acc_address,
              contract_id: contract_id,
              method_name: 'setMerkleRoot',
              operation_type: 'whitelistremove',
              operation_options: {
                addresses: `${admin_acc_address}`,
              },
            },
          ),
        );
        if (response.status != HttpStatus.OK) console.log(response);

        expect(response.message).toEqual(Statuses.COMPLETED);
        expect(response.data).toMatchObject({ tx: expect.any(Object) });
      },
      timeout,
    );

    it(
      '{cmd: CMD.MINT} buy user2 nowhitelist',
      async () => {
        jest.setTimeout(timeout);

        try {
          const response: ResponseDto = await firstValueFrom(
            redis_client.send(
              { cmd: CMD.MINT },
              {
                execute: false,
                network: network,
                from_address: admin_acc_address,
                contract_id: contract_id,
                method_name: 'buy',
                arguments: `1::${JSON.stringify(admin_acc_proof)}`,
                operation_type: 'mint',
                operation_options: {
                  nft_number: '1',
                  mint_to: admin_acc_address,
                  qty: 1,
                },
              },
            ),
          );
        } catch (error) {
          expect(error).toEqual({
            message:
              'VM Exception while processing transaction: revert Exclusible::buy: Address is not whitelisted - Merkle Invalid proof.',
            status: 500,
          });
        }
      },
      timeout,
    );
  });

  describe('DbController', () => {
    it(
      `{ cmd: CMD.ALL_OBJECTS } Get all contracts from DB whith pagination`,
      async () => {
        jest.setTimeout(timeout);

        const data: any = { object_type: ObjectTypes.CONTRACT };
        let response: ResponseDto = await lastValueFrom(redis_client.send({ cmd: CMD.ALL_OBJECTS }, { object_type: ObjectTypes.CONTRACT }));

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data.count).toBeGreaterThan(0);
        expect(response.data.rows).toMatchObject(expect.any(Array));
        expect(response.data.rows).toHaveLength(response.data.count);

        data.limit = 1;
        data.page = 1;
        response = await lastValueFrom(redis_client.send({ cmd: CMD.ALL_OBJECTS }, data));

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data.rows).toMatchObject(expect.any(Array));
        expect(response.data.rows).toHaveLength(1);

        const row = response.data.rows[0];
        data.page = 2;
        response = await lastValueFrom(redis_client.send({ cmd: CMD.ALL_OBJECTS }, data));

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data.rows).toMatchObject(expect.any(Array));
        expect(response.data.rows).toHaveLength(1);
        expect(response.data.rows[0]).not.toEqual(row);
      },
      timeout,
    );

    it(
      `{ cmd: CMD.ONE_OBJECT } Get one contract by id from DB with relations `,
      async () => {
        jest.setTimeout(timeout);

        const data: GetOneDto = { object_type: ObjectTypes.CONTRACT, where: { id: contract_id } };
        let response: ResponseDto = await lastValueFrom(redis_client.send({ cmd: CMD.ONE_OBJECT }, data));

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data).toMatchObject(expect.any(Object));

        data.include_child = true;
        response = await lastValueFrom(redis_client.send({ cmd: CMD.ONE_OBJECT }, data));

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data).toMatchObject(expect.any(Object));
        expect(response.data.tokens).toMatchObject(expect.any(Array));
        expect(response.data.metadata).toMatchObject(expect.any(Object));
        expect(response.data.transactions).toMatchObject(expect.any(Array));
      },
      timeout,
    );

    it(
      `{ cmd: CMD.UPDATE_STATUS } Update status of external minted token in DB`,
      async () => {
        jest.setTimeout(timeout);

        const get_data: GetOneDto = { object_type: ObjectTypes.TOKEN, where: { id: token_id } };
        let response: ResponseDto = await lastValueFrom(redis_client.send({ cmd: CMD.ONE_OBJECT }, get_data));

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data).toMatchObject(expect.any(Object));
        expect((tx_receipt as any).transactionHash).not.toBeUndefined();

        const hash = (tx_receipt as any).transactionHash;
        const update_data: UpdateStatusDto = {
          object_type: ObjectTypes.TOKEN,
          object_id: token_id,
          status: Statuses.PROCESSED,
          tx_hash: hash,
          tx_receipt: tx_receipt,
        };
        response = await lastValueFrom(redis_client.send({ cmd: CMD.UPDATE_STATUS }, update_data));

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data).toEqual(1);
      },
      timeout,
    );

    it(
      `{ cmd: CMD.UPDATE_METADATA } Update token metadata1`,
      async () => {
        jest.setTimeout(timeout);

        expect(token1_uri_id).not.toBeUndefined();

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.UPDATE_METADATA },
            {
              slug: contract_slug,
              token_id: +token1_uri_id,
              meta_data: metadata1_updated,
            },
          ),
        );

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data).toMatchObject({
          slug: contract_slug,
          contract_id: null,
          createdAt: expect.any(String),
          id: expect.any(String),
          meta_data: metadata1_updated,
          status: 'created',
          token_id: expect.any(Array),
          type: 'specified',
          updatedAt: expect.any(String),
        });
      },
      timeout,
    );

    it(
      `GET /metadata/:slug/:id - Gets metadata1 by slug and token1_id`,
      async () => {
        jest.setTimeout(timeout);

        const response = await request(server).get(`${token1_uri}`).send();

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.attributes).toEqual(metadata1_updated.attributes);
        expect(response.body.description).toEqual(metadata1_updated.description);
        expect(response.body.name).toEqual(metadata1_updated.name);
      },
      timeout,
    );

    it(
      `{ cmd: CMD.UPDATE_METADATA } Update token metadata10`,
      async () => {
        jest.setTimeout(timeout);
        await new Promise((resolve) => setTimeout(resolve, 5000));

        expect(token10_uri_id).not.toBeUndefined();

        const response: ResponseDto = await lastValueFrom(
          redis_client.send(
            { cmd: CMD.UPDATE_METADATA },
            {
              slug: contract_slug,
              token_id: +token10_uri_id,
              meta_data: metadata10_updated,
            },
          ),
        );

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.data).toMatchObject({
          slug: contract_slug,
          contract_id: null,
          createdAt: expect.any(String),
          id: expect.any(String),
          meta_data: metadata10_updated,
          status: 'created',
          token_id: expect.any(Array),
          type: 'specified',
          updatedAt: expect.any(String),
        });
      },
      timeout,
    );

    it(
      `GET /metadata/:slug/:id - Gets metadata10 by slug and token1_id`,
      async () => {
        jest.setTimeout(timeout);
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const response = await request(server).get(`${token10_uri}`).send();

        expect(response.status).toEqual(HttpStatus.OK);
        expect(response.body.description).toEqual(metadata10_updated.description);
        expect(response.body.name).toEqual(metadata10_updated.name);
      },
      timeout,
    );
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
        data.slug = uuidv4();
        data.price = '1';
        data.arguments = `100::1::10::10::true::${team_acc_address}::${contract_name}::TEST::/metadata/${data.slug}/`;
        data.network = network;
        const response = await sqs_client.send({ cmd: CMD.DEPLOY }, data);

        expect(response[0]).toMatchObject({
          Id: expect.any(String),
          MD5OfMessageBody: expect.any(String),
          MessageId: expect.any(String),
          SequenceNumber: expect.any(String),
        });
        await new Promise((resolve) => setTimeout(resolve, 5000));

        expect(logSpy).toBeCalledTimes(1);
      },
      timeout,
    );
  });
});
