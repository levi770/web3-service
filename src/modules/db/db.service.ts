import { AllObjectsDto } from './dto/allObjects.dto';
import { ContractModel } from './models/contract.model';
import { DbArgs } from './interfaces/dbArgs.interface';
import { GetAllDto } from './dto/getAll.dto';
import { GetOneDto } from './dto/getOne.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MetadataModel } from './models/metadata.model';
import { MetadataTypes, ObjectTypes, Statuses } from '../../common/constants';
import { Order } from 'sequelize';
import { ResponseDto } from '../../common/dto/response.dto';
import { RpcException } from '@nestjs/microservices';
import { SetMetadataDto } from './dto/setMetadata.dto';
import { TokenModel } from './models/token.model';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { UpdateStatusDto } from './dto/updateStatus.dto';
import { WhitelistModel } from './models/whitelist.model';
import { CreateObjects, CreatedObjects, FindModelResult } from '../../common/types';
import { WalletModel } from './models/wallet.model';
import { TransactionModel } from './models/transaction.model';
import { MetaDataDto } from '../web3/dto/metaData.dto';
import { GetMetadataDto } from './dto/getMetadata.dto';

/**
 * A service for managing objects in a database.
 *
 * @class DbService
 */
@Injectable()
export class DbService {
  constructor(
    @InjectModel(ContractModel) private contractRepository: typeof ContractModel,
    @InjectModel(TokenModel) private tokenRepository: typeof TokenModel,
    @InjectModel(WhitelistModel) private whitelistRepository: typeof WhitelistModel,
    @InjectModel(MetadataModel) private metadataRepository: typeof MetadataModel,
    @InjectModel(WalletModel) private walletsRepository: typeof WalletModel,
    @InjectModel(TransactionModel) private transactionsRepository: typeof TransactionModel,
  ) {}

  /**
   * Creates multiple objects of a specified type.
   */
  async create(objects: CreateObjects, objectType: ObjectTypes): Promise<CreatedObjects> {
    try {
      const repository = this.getRepository(objectType);
      const result = await repository.bulkCreate(objects as any, { returning: true });
      if (objectType === ObjectTypes.TOKEN) {
        (objects as TokenModel[]).forEach(async (token) => {
          const contract = await this.findOneById(token.contract_id, ObjectTypes.CONTRACT);
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
  async findOneById(id: string, objectType: ObjectTypes): Promise<FindModelResult> {
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
  async findOneByAddress(address: string, objectType: ObjectTypes): Promise<FindModelResult> {
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
  async getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<AllObjectsDto> {
    try {
      const args: DbArgs = {
        offset: !params || !params?.limit || !params?.page ? null : 0 + (+params?.page - 1) * +params.limit,
        limit: !params || !params?.limit ? null : +params?.limit,
        order: [[params?.order_by || 'createdAt', params?.order || 'DESC']] as Order,
        distinct: true,
      };
      if (params.where) {
        args.where = params.where;
      }
      if (params.include_child) {
        args.include = this.getIncludeModels(objectType);
      }
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
  async getOneObject(objectType: ObjectTypes, params: GetOneDto): Promise<FindModelResult> {
    try {
      const args: DbArgs = {};
      if (!params) {
        throw new RpcException('params can not be empty');
      }
      if (params.where) {
        args.where = params.where;
      }
      if (params.include_child) {
        args.include = this.getIncludeModels(objectType);
      }
      const repository = this.getRepository(objectType);
      let result = await repository.findOne(args);
      if (objectType === ObjectTypes.TOKEN) {
        const metadata = await this.metadataRepository.findOne({
          where: { id: (result as TokenModel).metadata_id },
        });
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
  async updateStatus(data: UpdateStatusDto, objectType: ObjectTypes): Promise<any> {
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

  /**
   * Gets the number of processed tokens associated with a contract.
   */
  async getTokenId(contract_id: string): Promise<number> {
    try {
      return await this.tokenRepository.count({ where: { contract_id, status: Statuses.PROCESSED } });
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
  async setMetadata(params: SetMetadataDto, objectType: ObjectTypes): Promise<boolean> {
    try {
      const metadata = (await this.findOneById(params.metadata_id, ObjectTypes.METADATA)) as MetadataModel;
      switch (objectType) {
        case ObjectTypes.CONTRACT: {
          const contract = await this.findOneById(params.object_id, ObjectTypes.CONTRACT);
          await metadata.$set('contract', contract);
          return true;
        }
        case ObjectTypes.TOKEN: {
          const token = await this.findOneById(params.object_id, ObjectTypes.TOKEN);
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
  async getMetadata(params: GetMetadataDto): Promise<MetaDataDto> {
    try {
      const metadata = await this.getOneObject(ObjectTypes.METADATA, {
        where: { address: params.address, token_id: params.id },
      });
      if (!metadata) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Metadata with this token_id not found',
        });
      }
      return (metadata as MetadataModel).meta_data;
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
      const metadata = (await this.getOneObject(ObjectTypes.METADATA, {
        where: { address: data.address, token_id: data.token_id },
      })) as MetadataModel;
      
      if (!metadata) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Metadata with this number not found',
        });
      }
      if (metadata.type !== MetadataTypes.COMMON) {
        for (const [key, value] of Object.entries(data.meta_data)) {
          metadata.meta_data[key] = value;
        }
        metadata.changed('meta_data', true);
        await metadata.save();
        return metadata;
      }

      const new_data = {
        status: Statuses.CREATED,
        address: metadata.address,
        type: MetadataTypes.SPECIFIED,
        meta_data: metadata.meta_data,
        token_id: data.token_id,
      };
      const new_metadata = (await this.create([new_data], ObjectTypes.METADATA)) as MetadataModel[];
      const token = (await this.getOneObject(ObjectTypes.TOKEN, { where: { token_id: data.token_id } })) as TokenModel;
      await this.setMetadata({ object_id: token.id, metadata_id: new_metadata[0].id }, ObjectTypes.TOKEN);
      return new_metadata[0];
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

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

  /**
   * Creates specified metadata from the provided token and metadata objects.
   */
  createSpecifiedMetadata(token_id: string, metadata: MetadataModel): object {
    return {
      status: Statuses.CREATED,
      type: MetadataTypes.SPECIFIED,
      meta_data: metadata.meta_data,
      token_id,
    };
  }
}
