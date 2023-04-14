import { S3 } from 'aws-sdk';
import FormData from 'form-data';
import { Order, Op } from 'sequelize';
import { lastValueFrom, map } from 'rxjs';
import { ContractModel } from './models/contract.model';
import { IDbQuery } from './interfaces/db-query.interface';
import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MetadataModel } from './models/metadata.model';
import { MetadataTypes, ObjectTypes, Statuses } from '../common/constants';
import { RpcException } from '@nestjs/microservices';
import { TokenModel } from './models/token.model';
import { UpdateMetadataDto } from './dto/update-metadata.dto';
import { WhitelistModel } from './models/whitelist.model';
import { Range } from '../common/types';
import { WalletModel } from './models/wallet.model';
import { TransactionModel } from './models/transaction.model';
import { GetMetadataDto } from '../common/dto/get-metadata.dto';
import { IMetadata } from './interfaces/metadata.interface';
import { IStatus } from './interfaces/status.interface';
import { WhitelistOptionsDto } from '../web3/dto/whitelist-options.dto';
import { HttpService } from '@nestjs/axios';
import { InjectAwsService } from 'nest-aws-sdk';
import { ConfigService } from '@nestjs/config';
import { MintOptionsDto } from '../web3/dto/mint-options.dto';
import { DeployDto } from '../web3/dto/deploy.dto';
import { IMetaData } from '../web3/interfaces/metadata.interface';
import { FileTypes } from '../common/constants';

/**
 * A service for managing objects in a database.
 */
@Injectable()
export class RepositoryService {
  constructor(
    @InjectModel(ContractModel) private readonly contractRepository: typeof ContractModel,
    @InjectModel(TokenModel) private readonly tokenRepository: typeof TokenModel,
    @InjectModel(WhitelistModel) private readonly whitelistRepository: typeof WhitelistModel,
    @InjectModel(MetadataModel) private readonly metadataRepository: typeof MetadataModel,
    @InjectModel(WalletModel) private readonly walletsRepository: typeof WalletModel,
    @InjectModel(TransactionModel) private readonly transactionsRepository: typeof TransactionModel,
    @InjectAwsService(S3) private readonly s3: S3,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  getRepository(objectType: ObjectTypes): any {
    switch (objectType) {
      case ObjectTypes.CONTRACT:
        return this.contractRepository;
      case ObjectTypes.TOKEN:
        return this.tokenRepository;
      case ObjectTypes.WHITELIST:
        return this.whitelistRepository;
      case ObjectTypes.METADATA:
        return this.metadataRepository;
      case ObjectTypes.WALLET:
        return this.walletsRepository;
      case ObjectTypes.TRANSACTION:
        return this.transactionsRepository;
    }
  }

  getIncludeModels(objectType: ObjectTypes): any[] {
    switch (objectType) {
      case ObjectTypes.TOKEN:
        return [{ model: MetadataModel }];
      case ObjectTypes.CONTRACT:
        return [{ model: TokenModel }, { model: MetadataModel }, { model: TransactionModel }];
      case ObjectTypes.WALLET:
        return [{ model: ContractModel }, { model: TokenModel }, { model: TransactionModel }];
    }
  }

  //#region DATABASE METHODS

  /**
   * Creates multiple objects of a specified type.
   */
  async create<T>(objects: Partial<T>[], objectType: ObjectTypes): Promise<T[]> {
    try {
      const repository = this.getRepository(objectType);
      const result = await repository.bulkCreate(objects, { returning: true });
      if (objectType === ObjectTypes.TOKEN) {
        (objects as Partial<TokenModel>[]).forEach(async (token) => {
          const contract = await this.findOneById<ContractModel>(token.contract_id, ObjectTypes.CONTRACT);
          await contract.$add('token', [token.id]);
        });
      }
      return result;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Deletes multiple objects of a specified type.
   */
  async delete(params: string[] | object, objectType: ObjectTypes): Promise<number> {
    try {
      const repository = this.getRepository(objectType);
      return await repository.destroy({ where: { ...params } });
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Searches for an object in the specified repository by id.
   */
  async findOneById<T>(id: string, objectType: ObjectTypes): Promise<T> {
    try {
      const repository = this.getRepository(objectType);
      return await repository.findOne({ where: { id } });
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Searches for an object in the specified repository by id.
   */
  async findOneByAddress<T>(address: string, objectType: ObjectTypes): Promise<T> {
    try {
      const repository = this.getRepository(objectType);
      return await repository.findOne({ where: { address } });
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Gets all objects of the specified type.
   */
  async getAllObjects<T>(objectType: ObjectTypes, params?: IDbQuery): Promise<{ count: number; rows: T[] }> {
    try {
      const args: IDbQuery = {
        offset: !params || !params?.limit || !params?.page ? null : 0 + (+params?.page - 1) * +params?.limit,
        limit: !params || !params?.limit ? null : +params?.limit,
        order: [[params?.order_by || 'createdAt', params?.sort || 'DESC']] as Order,
        distinct: true,
      };
      if (params?.where) args.where = params.where;
      if (params?.include_child) args.include = this.getIncludeModels(objectType);
      const repository = this.getRepository(objectType);
      return await repository.findAndCountAll(args);
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Gets a single object of the specified type.
   */
  async getOneObject<T>(objectType: ObjectTypes, params: IDbQuery): Promise<T> {
    try {
      const args: IDbQuery = {};
      if (!params) throw new RpcException('params can not be empty');
      if (params.where) args.where = params.where;
      if (params.include_child) args.include = this.getIncludeModels(objectType);
      const repository = this.getRepository(objectType);
      let result = await repository.findOne(args);
      if (objectType === ObjectTypes.TOKEN) {
        const metadata = await this.metadataRepository.findOne({ where: { id: (result as TokenModel).metadata_id } });
        result = { ...result, metadata };
      }
      return result;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Updates the status of an object.
   */
  async updateStatus(data: IStatus, objectType: ObjectTypes): Promise<number[]> {
    try {
      const repository = this.getRepository(objectType);
      return await repository.update(
        { status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt },
        { where: { id: data.object_id } },
      );
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  //#endregion

  //#region METADATA METHODS

  /**
   * Gets the number of processed tokens associated with a contract.
   */
  async getTokenId(contract_id: string, qty = 1): Promise<Range> {
    try {
      const count = await this.tokenRepository.sum('qty', { where: { contract_id, status: Statuses.PROCESSED } });
      return [
        { value: count ?? 0, inclusive: true },
        { value: count + qty, inclusive: false },
      ];
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Associates metadata with an object.
   */
  async setMetadata(params: IMetadata, objectType: ObjectTypes): Promise<boolean> {
    try {
      const metadata = (await this.findOneById(params.id, ObjectTypes.METADATA)) as MetadataModel;
      switch (objectType) {
        case ObjectTypes.CONTRACT: {
          const contract = await this.findOneById<ContractModel>(params.object_id, ObjectTypes.CONTRACT);
          await metadata.$set('contract', contract);
          return true;
        }
        case ObjectTypes.TOKEN: {
          const token = await this.findOneById<TokenModel>(params.object_id, ObjectTypes.TOKEN);
          await metadata.$add('token', [token.id]);
          return true;
        }
      }
      return false;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Gets the metadata associated with a token.
   */
  async getMetadata(params: GetMetadataDto): Promise<IMetaData> {
    try {
      const metadata = await this.getOneObject<MetadataModel>(ObjectTypes.METADATA, {
        where: { token_id: { [Op.contains]: params.id }, slug: params.slug },
      });
      if (!metadata) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Metadata with this token_id not found' });
      return metadata.meta_data;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Updates the metadata associated with a token.
   */
  async updateMetadata(data: UpdateMetadataDto): Promise<MetadataModel> {
    try {
      const metadata = await this.getOneObject<MetadataModel>(ObjectTypes.METADATA, {
        where: { token_id: { [Op.contains]: data.token_id }, slug: data.slug },
      });
      if (!metadata) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Metadata with this number not found' });

      if (metadata.type !== MetadataTypes.COMMON) {
        for (const [key, value] of Object.entries(data.meta_data)) {
          metadata.meta_data[key] = value;
        }
        metadata.changed('meta_data', true);
        await metadata.save();
        return metadata;
      }

      const new_data: Partial<MetadataModel> = {
        status: Statuses.CREATED,
        slug: metadata.slug,
        type: MetadataTypes.SPECIFIED,
        meta_data: metadata.meta_data,
        token_id: [
          { value: data.token_id, inclusive: true },
          { value: data.token_id + 1, inclusive: false },
        ],
      };
      const [new_metadata] = await this.create<MetadataModel>([new_data], ObjectTypes.METADATA);
      const token = await this.getOneObject<TokenModel>(ObjectTypes.TOKEN, { where: { token_id: data.token_id } });
      await this.setMetadata({ id: new_metadata.id, object_id: token.id }, ObjectTypes.TOKEN);
      return new_metadata;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  //#endregion

  //#region WHITELIST METHODS

  async addWhitelist(whitelistOptions: WhitelistOptionsDto, contractModel: ContractModel): Promise<WhitelistModel[]> {
    const addresses = whitelistOptions.addresses.split(',').map((address) => {
      return { status: Statuses.CREATED, contract_id: contractModel.id, address };
    });
    const addressArr = addresses.map((x) => x.address);
    const contractIdArr = addresses.map((x) => x.contract_id);
    const exist = await this.getAllObjects<WhitelistModel>(ObjectTypes.WHITELIST, {
      where: { address: addressArr, contract_id: contractIdArr },
    });
    // If any of the new objects already exist, remove them from the array
    if (exist.count) {
      (exist.rows as WhitelistModel[]).forEach((row) => {
        const index = addresses.findIndex((x) => x.address === row.address);
        if (index > -1) addresses.splice(index, 1);
      });
      if (addresses.length === 0)
        throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'All addresses already exist in whitelist' });
    }
    const whitelist = await this.create<WhitelistModel>(addresses, ObjectTypes.WHITELIST);
    if (whitelist.length === 0)
      throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to create whitelist object' });
    return whitelist;
  }

  async removeWhitelist(whitelistOptions: WhitelistOptionsDto, contractObj: ContractModel) {
    const addresses = whitelistOptions.addresses.split(',').map((address) => {
      return { status: Statuses.DELETED, contract_id: contractObj.id, address };
    });
    const addressArr = addresses.map((x) => x.address);
    const contractIdArr = addresses.map((x) => x.contract_id);
    const deleted = await this.delete({ address: addressArr, contract_id: contractIdArr }, ObjectTypes.WHITELIST);
    if (deleted === 0) throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to remove whitelist object' });
  }

  async getWhitelist(contractModel: ContractModel): Promise<WhitelistModel[]> {
    const whitelist = await this.getAllObjects<WhitelistModel>(ObjectTypes.WHITELIST, {
      where: { contract_id: contractModel.id },
    });
    return whitelist.rows;
  }

  //#endregion

  //#region IPFS METHODS

  /**
   * Uploads a file to IPFS.
   */
  async upload(asset_key: string): Promise<string> {
    const file = await this.getObjectFromS3(decodeURI(asset_key));
    return await this.uploadToPinata({ name: asset_key, data: file });
  }

  /**
   * Gets a file from S3.
   */
  async getObjectFromS3(key: string): Promise<Buffer> {
    try {
      const object = await this.s3.getObject({ Key: key, Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
      return object.Body as Buffer;
    } catch (error) {
      if (error.statusCode === 404) throw new RpcException({ status: error.statusCode, message: error.message });
      throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
    }
  }

  /**
   * Uploads a file to Pinata.
   */
  async uploadToPinata(file: { name: string; data: Buffer }): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file.data, file.name);
      const pinData = await lastValueFrom(
        this.httpService
          .post(this.config.get('PINATA_URL') + 'pinning/pinFileToIPFS', formData, {
            maxBodyLength: Infinity,
            headers: {
              'Content-Type': `multipart/form-data; boundary=${(formData as any).getBoundary()}`,
              pinata_api_key: this.config.get('PINATA_KEY'),
              pinata_secret_api_key: this.config.get('PINATA_SECRET'),
            },
          })
          .pipe(map((res) => res.data)),
      );
      return pinData.IpfsHash;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Retrieves metadata for a given contract.
   */
  async buildMetadata(data: MintOptionsDto | DeployDto): Promise<{ metadata: IMetaData; gw_link: string }> {
    const fileId = await this.upload(data.asset_url);
    const gateway = this.config.get('PINATA_GATEWAY');
    const metadata = data.meta_data;
    switch (data.asset_type) {
      case FileTypes.IMAGE:
        metadata.image = `ipfs://${fileId}`;
        break;
      case FileTypes.OBJECT:
        metadata.model_url = `ipfs://${fileId}`;
        break;
      case FileTypes.ANIMATION:
        metadata.animation_url = `ipfs://${fileId}`;
        break;
      default:
        throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'File type not supported' });
    }
    return { metadata, gw_link: `${gateway}${fileId}` };
  }

  //#endregion
}
