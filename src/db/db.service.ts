import { AllObjectsDto } from './dto/allObjects.dto';
import { ContractModel } from './models/contract.model';
import { DbArgs } from './interfaces/dbArgs.interface';
import { GetAllDto } from './dto/getAll.dto';
import { GetOneDto } from './dto/getOne.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MetadataModel } from './models/metadata.model';
import { MetadataTypes, ObjectTypes, Statuses } from '../common/constants';
import { Op, Order } from 'sequelize';
import { ResponseDto } from '../common/dto/response.dto';
import { RpcException } from '@nestjs/microservices';
import { SetMetadataDto } from './dto/setMetadata.dto';
import { TokenModel } from './models/token.model';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { UpdateStatusDto } from './dto/updateStatus.dto';
import { WhitelistModel } from './models/whitelist.model';
import { CreateObjects, CreatedObjects, FindModelResult } from '../common/types';
import { WalletModel } from './models/wallet.model';
import { TransactionModel } from './models/transaction.model';

/**
 * A service for managing objects in a database.
 *
 * @export
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
   *
   * @param {CreateObjects} objects - An array of objects to create.
   * @param {ObjectTypes} objectType - The type of object to create.
   * @returns {Promise<CreatedObjects>} A promise that resolves to an array of created objects.
   */
  async create(objects: CreateObjects, objectType: ObjectTypes): Promise<CreatedObjects> {
    switch (objectType) {
      case ObjectTypes.CONTRACT: {
        return await this.contractRepository.bulkCreate(objects as any, { returning: true });
      }

      case ObjectTypes.TOKEN: {
        const tokens = await this.tokenRepository.bulkCreate(objects as any, { returning: true });
        tokens.forEach(async (token) => {
          const contract = await this.findOneById(token.contract_id, ObjectTypes.CONTRACT);
          await contract.$add('token', [token.id]);
        });
        return tokens;
      }

      case ObjectTypes.WHITELIST: {
        return await this.whitelistRepository.bulkCreate(objects as any, { returning: true });
      }

      case ObjectTypes.METADATA: {
        return await this.metadataRepository.bulkCreate(objects as any, { returning: true });
      }

      case ObjectTypes.WALLET: {
        return await this.walletsRepository.bulkCreate(objects as any, { returning: true });
      }

      case ObjectTypes.TRANSACTION: {
        return await this.transactionsRepository.bulkCreate(objects as any, { returning: true });
      }
    }
  }

  /**
   * Deletes multiple objects of a specified type.
   *
   * @param {(string[] | object)} params - An array of object IDs or an object with properties to match for deletion.
   * @param {ObjectTypes} objectType - The type of object to delete.
   * @returns {Promise<number>} A promise that resolves to the number of deleted objects.
   */
  async delete(params: string[] | object, objectType: ObjectTypes): Promise<number> {
    switch (objectType) {
      case ObjectTypes.METADATA:
        return await this.metadataRepository.destroy({ where: { id: params } });

      case ObjectTypes.CONTRACT:
        return await this.contractRepository.destroy({ where: { id: params } });

      case ObjectTypes.TOKEN:
        return await this.tokenRepository.destroy({ where: { id: params } });

      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.destroy({ where: { ...params } });

      case ObjectTypes.WALLET:
        return await this.walletsRepository.destroy({ where: { id: params } });

      case ObjectTypes.TRANSACTION:
        return await this.transactionsRepository.destroy({ where: { id: params } });
    }
  }

  /**
   * Searches for an object in the specified repository based on the value of `objectType`.
   *
   * @param {string} id - The ID or address of the object to search for.
   * @param {ObjectTypes} objectType - The type of object to search for.
   * @return {Promise<FindModelResult>} - A promise that resolves to the found object, or `null` if no object was found.
   */
  async findOneById(id: string, objectType: ObjectTypes): Promise<FindModelResult> {
    switch (objectType) {
      case ObjectTypes.METADATA:
        return await this.metadataRepository.findOne({ where: { id } });

      case ObjectTypes.CONTRACT:
        return await this.contractRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });

      case ObjectTypes.TOKEN:
        return await this.tokenRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });

      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });

      case ObjectTypes.WALLET:
        return await this.walletsRepository.findOne({ where: { address: id } });

      case ObjectTypes.TRANSACTION:
        return await this.transactionsRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });
    }
  }

  /**
   * Gets all objects of the specified type.
   *
   * @param {ObjectTypes} objectType - The type of objects to retrieve.
   * @param {GetAllDto} [params] - An optional object with query parameters.
   * @return {Promise<AllObjectsDto>} - A promise that resolves to an object with the retrieved objects and the total number of objects.
   *
   * @throws {RpcException} If an error occurs while retrieving the objects.
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

      let allObjects: AllObjectsDto;

      switch (objectType) {
        case ObjectTypes.TOKEN:
          if (params.include_child) {
            args.include = [
              {
                model: MetadataModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
            ];
          }
          args.attributes = { exclude: ['contract_id', 'updatedAt'] };
          allObjects = await this.tokenRepository.findAndCountAll(args);
          break;

        case ObjectTypes.CONTRACT:
          if (params.include_child) {
            args.include = [
              {
                model: TokenModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
              {
                model: MetadataModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
              {
                model: TransactionModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
            ];
          }

          allObjects = await this.contractRepository.findAndCountAll(args);
          break;

        case ObjectTypes.WHITELIST:
          allObjects = await this.whitelistRepository.findAndCountAll(args);
          break;

        case ObjectTypes.WALLET:
          if (params.include_child) {
            args.include = [
              {
                model: ContractModel,
                attributes: { exclude: ['updatedAt'] },
              },
              {
                model: TokenModel,
                attributes: { exclude: ['updatedAt'] },
              },
              {
                model: TransactionModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
            ];
          }

          allObjects = await this.walletsRepository.findAndCountAll(args);
          break;

        case ObjectTypes.TRANSACTION:
          allObjects = await this.transactionsRepository.findAndCountAll(args);
          break;
      }

      return allObjects;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * Gets a single object of the specified type.
   *
   * @param {ObjectTypes} objectType - The type of object to retrieve.
   * @param {GetOneDto} params - An object with the ID, address, or token ID of the object to retrieve.
   * @return {Promise<FindModelResult>} - A promise that resolves to the retrieved object.
   *
   * @throws {RpcException} If an error occurs while retrieving the object.
   */
  async getOneObject(objectType: ObjectTypes, params: GetOneDto): Promise<FindModelResult> {
    try {
      if (!params) {
        throw new RpcException('params can not be empty');
      }
      if (!params.id && !params.address && !params.token_id) {
        throw new RpcException('id or address or token_id is required');
      }

      const args: DbArgs = {
        attributes: { exclude: ['updatedAt'] },
        where: params.id
          ? { id: params.id }
          : params.address
          ? { address: params.address }
          : params.token_id
          ? { token_id: params.token_id }
          : params.contract_id
          ? { contract_id: params.contract_id }
          : params.team_id
          ? { team_id: params.team_id }
          : {},
      };

      let result: any;

      switch (objectType) {
        case ObjectTypes.TOKEN:
          args.attributes = { exclude: ['updatedAt'] };
          result = await this.tokenRepository.findOne(args);

          if (params.include_child) {
            const metadata = await this.metadataRepository.findOne({
              where: { id: (result as TokenModel).metadata_id },
            });

            result = { ...result, metadata };
          }

          break;

        case ObjectTypes.CONTRACT:
          if (params.include_child) {
            args.include = [
              {
                model: TokenModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
              {
                model: MetadataModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
              {
                model: TransactionModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
            ];
          }

          result = await this.contractRepository.findOne(args);
          break;

        case ObjectTypes.WHITELIST:
          result = await this.whitelistRepository.findOne(args);
          break;

        case ObjectTypes.METADATA:
          result = await this.metadataRepository.findOne(args);
          break;

        case ObjectTypes.WALLET:
          if (params.include_child) {
            args.include = [
              {
                model: ContractModel,
                attributes: { exclude: ['updatedAt'] },
              },
              {
                model: TokenModel,
                attributes: { exclude: ['updatedAt'] },
              },
            ];
          }

          result = await this.walletsRepository.findOne(args);
          break;

        case ObjectTypes.TRANSACTION:
          result = await this.transactionsRepository.findOne(args);
          break;
      }

      return result;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * Updates the status of an object.
   *
   * @param {UpdateStatusDto} data - An object with the ID, type, and new status of the object to update.
   * @param {string} data.object_id - The ID of the object to update.
   * @param {ObjectTypes} data.object_type - The type of object to update.
   * @param {number} data.status - The new status of the object.
   * @param {string} [data.tx_hash] - The transaction hash of the update.
   * @param {string} [data.tx_receipt] - The transaction receipt of the update.
   * @return {Promise<ResponseDto>} - A promise that resolves to a response object indicating the result of the update.
   *
   * @throws {RpcException} If an error occurs while updating the status.
   */
  async updateStatus(data: UpdateStatusDto): Promise<ResponseDto> {
    const id = data.object_id;

    switch (data.object_type) {
      case ObjectTypes.CONTRACT:
        const contract = await this.contractRepository.findOne({ where: { id } });
        await contract.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });
        return new ResponseDto(HttpStatus.OK, 'status updated', null);

      case ObjectTypes.TOKEN:
        const token = await this.tokenRepository.findOne({ where: { id } });
        await token.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });
        return new ResponseDto(HttpStatus.OK, 'status updated', null);

      case ObjectTypes.WHITELIST:
        const whitelist = await this.whitelistRepository.update(
          { status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt },
          { where: { id } },
        );
        return new ResponseDto(HttpStatus.OK, 'status updated', null);

      case ObjectTypes.TRANSACTION:
        const tx = await this.transactionsRepository.findOne({ where: { id } });
        await tx.update({ status: data.status, tx_receipt: data.tx_receipt });
        return new ResponseDto(HttpStatus.OK, 'status updated', null);
    }

    return new ResponseDto(HttpStatus.OK, 'status not updated', null);
  }

  /**
   * Gets the number of processed tokens associated with a contract.
   *
   * @param {string} contract_id - The ID of the contract to search.
   * @return {Promise<number>} - A promise that resolves to the number of processed tokens.
   *
   * @throws {RpcException} If an error occurs while counting the tokens.
   */
  async getTokenId(contract_id: string): Promise<number> {
    return await this.tokenRepository.count({ where: { contract_id, status: Statuses.PROCESSED } });
  }

  /**
   * Associates metadata with an object.
   *
   * @param {SetMetadataDto} params - An object with the metadata ID and the object ID to associate.
   * @param {string} params.metadata_id - The ID of the metadata to associate.
   * @param {string} params.object_id - The ID of the object to associate the metadata with.
   * @param {ObjectTypes} objectType - The type of object to associate the metadata with.
   * @return {Promise<boolean>} - A promise that resolves to a boolean indicating whether the metadata was successfully associated.
   *
   * @throws {RpcException} If an error occurs while setting the metadata.
   */
  async setMetadata(params: SetMetadataDto, objectType: ObjectTypes): Promise<boolean> {
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
  }

  /**
   * Gets the metadata associated with a token.
   *
   * @param {string} id - The ID of the token to search for metadata.
   * @return {Promise<any>} - A promise that resolves to the metadata.
   *
   * @throws {RpcException} If an error occurs while getting the metadata.
   */
  async getMetadata(id: string): Promise<any> {
    const token = await this.getOneObject(ObjectTypes.TOKEN, { token_id: id, include_child: true });
    if (!token) {
      throw new RpcException('Token with this token_id not found');
    }
    return (token as TokenModel).metadata.meta_data;
  }

  /**
   * Updates the metadata associated with a token.
   *
   * @param {UpdateMetadataDto} data - The data to update the metadata with.
   * @return {Promise<ResponseDto>} - A promise that resolves to a response object indicating whether the metadata was updated successfully.
   *
   * @throws {RpcException} If an error occurs while updating the metadata.
   */
  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    try {
      const token = (await this.getOneObject(ObjectTypes.TOKEN, {
        token_id: data.id,
        include_child: true,
      })) as TokenModel;
      if (!token) {
        throw new RpcException('Token with this number not found');
      }

      const metadata =
        token?.metadata?.type === MetadataTypes.COMMON
          ? ((
              await this.create([this.createSpecifiedMetadata(token, token.metadata)], ObjectTypes.METADATA)
            )[0] as MetadataModel)
          : token.metadata;

      for (const [key, value] of Object.entries(data.meta_data)) {
        metadata.meta_data[key] = value;
      }

      metadata.changed('meta_data', true);
      await metadata.save();

      return new ResponseDto(HttpStatus.OK, 'data updated', null);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * Creates specified metadata from the provided token and metadata objects.
   *
   * @param {TokenModel} token - The token object to create the metadata for.
   * @param {MetadataModel} metadata - The metadata object to create the specified metadata from.
   * @return {object} - The specified metadata object.
   */
  createSpecifiedMetadata(token: TokenModel, metadata: MetadataModel): object {
    return {
      status: Statuses.CREATED,
      type: MetadataTypes.SPECIFIED,
      token_id: token.id,
      meta_data: metadata.meta_data,
    };
  }
}
