import { AllObjectsDto } from './dto/allObjects.dto';
import { ContractModel } from './models/contract.model';
import { DbArgs } from './interfaces/dbArgs.interface';
import { GetAllDto } from './dto/getAll.dto';
import { GetOneDto } from './dto/getOne.dto';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MetadataModel } from './models/metadata.model';
import { MetadataTypes, ObjectTypes, Statuses } from '../common/constants';
import { NewContractDto } from './dto/newContract.dto';
import { NewMetadataDto } from './dto/newMetadata.dto';
import { NewTokenDto } from './dto/newToken.dto';
import { Op, Order } from 'sequelize';
import { ResponseDto } from '../common/dto/response.dto';
import { RpcException } from '@nestjs/microservices';
import { SetMetadataDto } from './dto/setMetadata.dto';
import { TokenModel } from './models/token.model';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { UpdateStatusDto } from './dto/updateStatus.dto';
import { WhitelistDto } from '../web3-manager/dto/whitelist.dto';
import { WhitelistModel } from './models/whitelist.model';

@Injectable()
/**
 * A service for managing objects in a database.
 *
 * @export
 * @class DbManagerService
 */
export class DbManagerService {
  /**
   * Creates an instance of DbManagerService.
   *
   * @param {typeof ContractModel} contractRepository - The repository for contract objects.
   * @param {typeof TokenModel} tokenRepository - The repository for token objects.
   * @param {typeof WhitelistModel} whitelistRepository - The repository for whitelist objects.
   * @param {typeof MetadataModel} metadataRepository - The repository for metadata objects.
   * 
   * @memberof DbManagerService
   * @constructor
   */
  constructor(
    @InjectModel(ContractModel)
    private contractRepository: typeof ContractModel,
    @InjectModel(TokenModel)
    private tokenRepository: typeof TokenModel,
    @InjectModel(WhitelistModel)
    private whitelistRepository: typeof WhitelistModel,
    @InjectModel(MetadataModel)
    private metadataRepository: typeof MetadataModel,
  ) {}

  /**
   * Creates multiple objects of a specified type.
   *
   * @param {(NewContractDto[] | NewTokenDto[] | WhitelistDto[] | NewMetadataDto[])} objects - An array of objects to create.
   * @param {ObjectTypes} objectType - The type of object to create.
   * @returns {Promise<(ContractModel[] | TokenModel[] | WhitelistModel[] | MetadataModel[])>} A promise that resolves to an
   * array of created objects.
   */
  async create(
    objects: NewContractDto[] | NewTokenDto[] | WhitelistDto[] | NewMetadataDto[],
    objectType: ObjectTypes,
  ): Promise<ContractModel[] | TokenModel[] | WhitelistModel[] | MetadataModel[]> {
    // The function has a switch statement that checks the value of objectType and executes a different block of code
    // based on the value.
    switch (objectType) {
      // If objectType is CONTRACT, the function uses the contractRepository object to bulk create the objects and returns
      // the resulting array of ContractModel objects.
      case ObjectTypes.CONTRACT: {
        return await this.contractRepository.bulkCreate(objects as any, { returning: true });
      }

      // If objectType is TOKEN, the function uses the tokenRepository object to bulk create the objects and then iterates
      // over the resulting array of TokenModel objects.
      case ObjectTypes.TOKEN: {
        const tokens = await this.tokenRepository.bulkCreate(objects as any, { returning: true });
        // For each TokenModel object, the function finds the corresponding ContractModel object using the findById function
        // and adds the TokenModel object to the ContractModel object using the $add method.
        tokens.forEach(async (token) => {
          const contract = await this.findById(token.contract_id, ObjectTypes.CONTRACT);
          await contract.$add('token', [token.id]);
        });
        // Finally, the function returns the array of TokenModel objects.
        return tokens;
      }

      // If objectType is WHITELIST, the function uses the whitelistRepository object to bulk create the objects and returns
      // the resulting array of WhitelistModel objects.
      case ObjectTypes.WHITELIST: {
        return await this.whitelistRepository.bulkCreate(objects as any, { returning: true });
      }

      // If objectType is METADATA, the function uses the metadataRepository object to bulk create the objects and returns
      // the resulting array of MetadataModel objects.
      case ObjectTypes.METADATA: {
        return await this.metadataRepository.bulkCreate(objects as any, { returning: true });
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
    // The function has a switch statement that checks the value of objectType and executes a different block
    // of code based on the value.
    switch (objectType) {
      // If objectType is METADATA, the function uses the metadataRepository object to delete the MetadataModel objects
      // that match the criteria specified in the where object.The where object specifies that only MetadataModel objects
      // with an id equal to the values in the params array should be deleted.
      case ObjectTypes.METADATA:
        return await this.metadataRepository.destroy({ where: { id: params } });

      // If objectType is CONTRACT, the function uses the contractRepository object to delete the ContractModel objects
      // that match the criteria specified in the where object.The where object specifies that only ContractModel objects
      // with an id equal to the values in the params array should be deleted.
      case ObjectTypes.CONTRACT:
        return await this.contractRepository.destroy({ where: { id: params } });

      // If objectType is TOKEN, the function uses the tokenRepository object to delete the TokenModel objects that match
      // the criteria specified in the where object.The where object specifies that only TokenModel objects with an id equal
      // to the values in the params array should be deleted.
      case ObjectTypes.TOKEN:
        return await this.tokenRepository.destroy({ where: { id: params } });

      // If objectType is WHITELIST, the function uses the whitelistRepository object to delete the WhitelistModel objects
      // that match the criteria specified in the where object.The where object specifies that only WhitelistModel objects
      // with properties equal to the values in the params object should be deleted.The ...params syntax is the spread
      // operator and is used to expand the properties of the params object into the where object.
      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.destroy({ where: { ...params } });
    }
  }

  /**
   * Searches for an object in the specified repository based on the value of `objectType`.
   *
   * @param {string} id - The ID or address of the object to search for.
   * @param {ObjectTypes} objectType - The type of object to search for.
   * @return {Promise<ContractModel | TokenModel | WhitelistModel | MetadataModel>} - A promise that resolves to the found object, or `null` if no object was found.
   */
  async findById(
    id: string,
    objectType: ObjectTypes,
  ): Promise<ContractModel | TokenModel | WhitelistModel | MetadataModel> {
    // The findById function uses a switch statement to determine which repository to search based on the value of objectType.
    switch (objectType) {
      // If objectType is ObjectTypes.METADATA, the function will search the metadataRepository for an object with an id
      // that matches the provided id.
      case ObjectTypes.METADATA:
        return await this.metadataRepository.findOne({ where: { id } });

      // If objectType is ObjectTypes.CONTRACT, the function will search the contractRepository for an object with an id
      // or an address that matches the provided id.
      case ObjectTypes.CONTRACT:
        return await this.contractRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });

      // If objectType is ObjectTypes.TOKEN, the function will search the tokenRepository for an object with an id
      // or an address that matches the provided id.
      case ObjectTypes.TOKEN:
        return await this.tokenRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });

      // And if objectType is ObjectTypes.WHITELIST, the function will search the whitelistRepository for an object with an id
      // or an address that matches the provided id.
      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });
    }
  }

  /**
   * Gets all objects of the specified type.
   *
   * @param {ObjectTypes} objectType - The type of objects to retrieve.
   * @param {GetAllDto} [params] - An optional object with query parameters.
   * @param {number} [params.limit] - The maximum number of objects to return.
   * @param {number} [params.page] - The page number to retrieve.
   * @param {string} [params.order_by] - The name of the attribute to sort the results by.
   * @param {string} [params.order] - The sort order, either "ASC" or "DESC".
   * @param {Object} [params.where] - An object with attributes to filter the results by.
   * @param {boolean} [params.include_child] - Whether to include child objects in the results.
   * @return {Promise<AllObjectsDto>} - A promise that resolves to an object with the retrieved objects and the total number of objects.
   *
   * @throws {RpcException} If an error occurs while retrieving the objects.
   */
  async getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<AllObjectsDto> {
    try {
      // Create an object with the query parameters to pass to the repository.
      const args: DbArgs = {
        offset: !params || !params?.limit || !params?.page ? null : 0 + (+params?.page - 1) * +params.limit,
        limit: !params || !params?.limit ? null : +params?.limit,
        order: [[params?.order_by || 'createdAt', params?.order || 'DESC']] as Order,
        distinct: true,
      };

      // If the "where" parameter is present, add it to the query parameters object.
      if (params.where) {
        args.where = params.where;
      }

      // Declare a variable to store the retrieved objects.
      let allObjects: AllObjectsDto;

      // Use a switch statement to determine which repository to use based on the value of "objectType".
      switch (objectType) {
        // If "objectType" is ObjectTypes.TOKEN, use the tokenRepository to retrieve the objects.
        case ObjectTypes.TOKEN:
          // If the "include_child" parameter is present, include child objects in the results.
          if (params.include_child) {
            args.include = [
              {
                model: MetadataModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
            ];
          }
          // Exclude the "contract_id" and "updatedAt" attributes from the results.
          args.attributes = { exclude: ['contract_id', 'updatedAt'] };
          allObjects = await this.tokenRepository.findAndCountAll(args);
          break;

        // If "objectType" is ObjectTypes.CONTRACT, use the contractRepository to retrieve the objects.
        case ObjectTypes.CONTRACT:
          // If the "include_child" parameter is present, include child objects in the results.
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
            ];
          }

          allObjects = await this.contractRepository.findAndCountAll(args);
          break;

        // If "objectType" is ObjectTypes.WHITELIST, use the whitelistRepository to retrieve the objects.
        case ObjectTypes.WHITELIST:
          allObjects = await this.whitelistRepository.findAndCountAll(args);
          break;
      }

      // Return the retrieved objects.
      return allObjects;
    } catch (error) {
      // If an error occurs while retrieving the objects, throw an RpcException.
      throw new RpcException(error);
    }
  }

  /**
   * Gets a single object of the specified type.
   *
   * @param {ObjectTypes} objectType - The type of object to retrieve.
   * @param {GetOneDto} params - An object with the ID, address, or token ID of the object to retrieve.
   * @param {string} [params.id] - The ID of the object to retrieve.
   * @param {string} [params.address] - The address of the object to retrieve.
   * @param {string} [params.token_id] - The token ID of the object to retrieve.
   * @param {boolean} [params.include_child] - Whether to include child objects in the result.
   * @return {Promise<any>} - A promise that resolves to the retrieved object.
   *
   * @throws {RpcException} If an error occurs while retrieving the object.
   */
  async getOneObject(objectType: ObjectTypes, params: GetOneDto): Promise<any> {
    try {
      // Validate the "params" object.
      if (!params) {
        throw new RpcException('params can not be empty');
      }
      if (!params.id && !params.address && !params.token_id) {
        throw new RpcException('id or address or token_id is required');
      }

      // Create an object with the query parameters to pass to the repository.
      let args: DbArgs = {
        attributes: { exclude: ['updatedAt'] },
        where: params.id
          ? { id: params.id }
          : params.address
          ? { address: params.address }
          : params.token_id
          ? { token_id: params.token_id }
          : { contract_id: params.contract_id },
      };

      // Declare a variable to store the retrieved object.
      let result: any;

      // Use a switch statement to determine which repository to use based on the value of "objectType".
      switch (objectType) {
        // If "objectType" is ObjectTypes.TOKEN, use the tokenRepository to retrieve the object.
        case ObjectTypes.TOKEN:
          // Exclude the "updatedAt" attribute from the results.
          args.attributes = { exclude: ['updatedAt'] };
          result = await this.tokenRepository.findOne(args);

          // If the "include_child" parameter is present, include the child metadata object in the results.
          if (params.include_child) {
            const metadata = await this.metadataRepository.findOne({
              where: { id: (result as TokenModel).metadata_id },
            });

            result = { ...result, metadata };
          }

          break;

        // If "objectType" is ObjectTypes.CONTRACT, use the contractRepository to retrieve the object.
        case ObjectTypes.CONTRACT:
          // If the "include_child" parameter is present, include child objects in the results.
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
            ];
          }

          result = await this.contractRepository.findOne(args);
          break;

        // If "objectType" is ObjectTypes.WHITELIST, use the whitelistRepository to retrieve the object.
        case ObjectTypes.WHITELIST:
          result = await this.whitelistRepository.findOne(args);
          break;

        // If "objectType" is ObjectTypes.METADATA, use the metadataRepository to retrieve the object.
        case ObjectTypes.METADATA:
          result = await this.metadataRepository.findOne(args);
          break;
      }

      return result;
    } catch (error) {
      // If an error occurs while retrieving the objects, throw an RpcException.
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
    // Get the ID of the object to update.
    const id = data.object_id;

    // Use a switch statement to determine which repository to use based on the value of "object_type".
    switch (data.object_type) {
      // If "object_type" is ObjectTypes.CONTRACT, use the contractRepository to update the object.
      case ObjectTypes.CONTRACT:
        // Get the contract with the specified ID.
        const contract = await this.contractRepository.findOne({ where: { id } });
        // Update the contract with the new status, transaction hash, and transaction receipt.
        await contract.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });
        // Return a response indicating that the status was updated.
        return new ResponseDto(HttpStatus.OK, null, 'status updated');

      // If "object_type" is ObjectTypes.TOKEN, use the tokenRepository to update the object.
      case ObjectTypes.TOKEN:
        // Get the token with the specified ID.
        const token = await this.tokenRepository.findOne({ where: { id } });
        // Update the token with the new status, transaction hash, and transaction receipt.
        await token.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });
        // Return a response indicating that the status was updated.
        return new ResponseDto(HttpStatus.OK, null, 'status updated');

      // If "object_type" is ObjectTypes.WHITELIST, use the whitelistRepository to update the object.
      case ObjectTypes.WHITELIST:
        // Get the whitelist with the specified ID.
        const whitelist = await this.whitelistRepository.findOne({ where: { id } });
        // Update the whitelist with the new status, transaction hash, and transaction receipt.
        await whitelist.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });
        // Return a response indicating that the status was updated.
        return new ResponseDto(HttpStatus.OK, null, 'status updated');
    }

    // If the object type is not recognized, return a response indicating that the status was not updated.
    return new ResponseDto(HttpStatus.OK, null, 'status not updated');
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
    // Get the metadata to associate with the object.
    const metadata = (await this.findById(params.metadata_id, ObjectTypes.METADATA)) as MetadataModel;

    // Use a switch statement to determine which repository to use based on the value of "objectType".
    switch (objectType) {
      // If "objectType" is ObjectTypes.CONTRACT, use the contractRepository to update the object.
      case ObjectTypes.CONTRACT: {
        // Get the contract to associate with the metadata.
        const contract = await this.findById(params.object_id, ObjectTypes.CONTRACT);
        // Set the contract as the "contract" property of the metadata.
        await metadata.$set('contract', contract);
        // Return a boolean indicating that the metadata was successfully associated.
        return true;
      }

      // If "objectType" is ObjectTypes.TOKEN, use the tokenRepository to update the object.
      case ObjectTypes.TOKEN: {
        // Get the token to associate with the metadata.
        const token = await this.findById(params.object_id, ObjectTypes.TOKEN);
        // Add the token to the "token" property of the metadata.
        await metadata.$add('token', [token.id]);
        // Return a boolean indicating that the metadata was successfully associated.
        return true;
      }
    }

    // If the object type is not recognized, return a boolean indicating that the metadata was not associated.
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
    // Get the token with the specified ID.
    const token = await this.getOneObject(ObjectTypes.TOKEN, { token_id: id, include_child: true });
    // If the token is not found, throw a RpcException.
    if (!token) {
      throw new RpcException('Token with this token_id not found');
    }
    // Return the metadata associated with the token.
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
      // Get the token with the specified ID.
      const token = (await this.getOneObject(ObjectTypes.TOKEN, {
        token_id: data.id,
        include_child: true,
      })) as TokenModel;
      // If the token is not found, throw an RpcException.
      if (!token) {
        throw new RpcException('Token with this number not found');
      }

      // If the token has common metadata, create new metadata with the data from the token's metadata.
      // Otherwise, use the metadata that is already associated with the token.
      const metadata =
        token?.metadata?.type === MetadataTypes.COMMON
          ? ((
              await this.create([this.createSpecifiedMetadata(token, token.metadata)], ObjectTypes.METADATA)
            )[0] as MetadataModel)
          : token.metadata;

      // Update the metadata with the specified data.
      for (const [key, value] of Object.entries(data.meta_data)) {
        metadata.meta_data[key] = value;
      }

      // Mark the metadata as changed.
      metadata.changed('meta_data', true);
      // Save the updated metadata.
      await metadata.save();

      // Return a response indicating that the metadata was updated successfully.
      return new ResponseDto(HttpStatus.OK, null, 'data updated');
    } catch (error) {
      // If an error occurs while retrieving the objects, throw an RpcException.
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
