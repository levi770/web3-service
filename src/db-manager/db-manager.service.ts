import { AllObjectsDto } from './dto/allObjects.dto'
import { ContractModel } from './models/contract.model'
import { DbArgs } from './interfaces/dbArgs.interface'
import { GetAllDto } from './dto/getAll.dto'
import { GetOneDto } from './dto/getOne.dto'
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { MetaDataDto } from '../web3-manager/dto/metaData.dto'
import { MetadataModel } from './models/metadata.model'
import { MetadataTypes, ObjectTypes, Statuses } from '../common/constants'
import { NewContractDto } from './dto/newContract.dto'
import { NewMetadataDto } from './dto/newMetadata.dto'
import { NewTokenDto } from './dto/newToken.dto'
import { Op, Order } from 'sequelize'
import { ResponseDto } from '../common/dto/response.dto'
import { RpcException } from '@nestjs/microservices'
import { SetMetadataDto } from './dto/setMetadata.dto'
import { Token } from 'aws-sdk/lib/token'
import { TokenModel } from './models/token.model'
import { UpdateMetadataDto } from './dto/updateMetadata.dto'
import { UpdateStatusDto } from './dto/updateStatus.dto'
import { WhitelistDto } from '../web3-manager/dto/whitelist.dto'
import { WhitelistModel } from './models/whitelist.model'
@Injectable()
export class DbManagerService {
  constructor(
    @InjectModel(ContractModel) private contractRepository: typeof ContractModel,
    @InjectModel(TokenModel) private tokenRepository: typeof TokenModel,
    @InjectModel(WhitelistModel) private whitelistRepository: typeof WhitelistModel,
    @InjectModel(MetadataModel) private metadataRepository: typeof MetadataModel,
  ) {}

  async create(
    params: NewContractDto | NewTokenDto | WhitelistDto | NewMetadataDto,
    objectType: ObjectTypes,
  ): Promise<ContractModel | TokenModel | WhitelistModel | MetadataModel> {
    switch (objectType) {
      case ObjectTypes.CONTRACT: {
        return await this.contractRepository.create({ ...params });
      }

      case ObjectTypes.TOKEN: {
        const contract = await this.findById((params as NewTokenDto).contract_id, ObjectTypes.CONTRACT);
        const token = await this.tokenRepository.create({ ...params });
        await contract.$add('token', [token.id]);
        return token;
      }

      case ObjectTypes.WHITELIST: {
        return await this.whitelistRepository.create({ ...params });
      }

      case ObjectTypes.METADATA: {
        return await this.metadataRepository.create({ ...params });
      }
    }
  }

  async delete(params: string | WhitelistDto, objectType: ObjectTypes): Promise<number> {
    switch (objectType) {
      case ObjectTypes.METADATA:
        return await this.metadataRepository.destroy({ where: { id: params } });

      case ObjectTypes.CONTRACT:
        return await this.contractRepository.destroy({ where: { id: params } });

      case ObjectTypes.TOKEN:
        return await this.tokenRepository.destroy({ where: { id: params } });

      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.destroy({ where: { address: (params as WhitelistDto).address } });
    }
  }

  async findById(
    id: string,
    objectType: ObjectTypes,
  ): Promise<ContractModel | TokenModel | WhitelistModel | MetadataModel> {
    switch (objectType) {
      case ObjectTypes.METADATA:
        return await this.metadataRepository.findOne({ where: { id } });

      case ObjectTypes.CONTRACT:
        return await this.contractRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });

      case ObjectTypes.TOKEN:
        return await this.tokenRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });

      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.findOne({ where: { [Op.or]: [{ id }, { address: id }] } });
    }
  }

  async getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<AllObjectsDto> {
    try {
      const args: DbArgs = {
        attributes: { exclude: ['updatedAt'] },
        offset: !params || !params?.limit || !params?.page ? null : 0 + (+params?.page - 1) * +params.limit,
        limit: !params || !params?.limit ? null : +params?.limit,
        order: [[params?.order_by || 'createdAt', params?.order || 'DESC']] as Order,
      };

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
            ];
          }

          allObjects = await this.contractRepository.findAndCountAll(args);
          break;

        case ObjectTypes.WHITELIST:
          allObjects = await this.whitelistRepository.findAndCountAll(args);
          break;
      }

      return allObjects;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getOneObject(objectType: ObjectTypes, params: GetOneDto) {
    try {
      if (!params) {
        throw new RpcException('params can not be empty');
      }

      if (!params.id && !params.address && !params.token_id) {
        throw new RpcException('id or address or token_id is required');
      }

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

      let result: TokenModel | ContractModel | WhitelistModel | MetadataModel;

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

          args.attributes = { exclude: ['updatedAt'] };
          result = await this.tokenRepository.findOne(args);
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
      }

      return result;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async updateStatus(data: UpdateStatusDto): Promise<ResponseDto> {
    const id = data.object_id;

    switch (data.object_type) {
      case ObjectTypes.CONTRACT:
        const contract = await this.contractRepository.findOne({ where: { id } });
        await contract.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });

        return new ResponseDto(HttpStatus.OK, null, 'status updated');

      case ObjectTypes.TOKEN:
        const token = await this.tokenRepository.findOne({ where: { id } });
        await token.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });

        return new ResponseDto(HttpStatus.OK, null, 'status updated');

      case ObjectTypes.WHITELIST:
        const whitelist = await this.whitelistRepository.findOne({ where: { id } });
        await whitelist.update({ status: data.status, tx_hash: data.tx_hash, tx_receipt: data.tx_receipt });

        return new ResponseDto(HttpStatus.OK, null, 'status updated');
    }

    return new ResponseDto(HttpStatus.OK, null, 'status not updated');
  }

  async setMetadata(params: SetMetadataDto, objectType: ObjectTypes): Promise<boolean> {
    const metadata = (await this.findById(params.metadata_id, ObjectTypes.METADATA)) as MetadataModel;

    switch (objectType) {
      case ObjectTypes.CONTRACT: {
        const contract = await this.findById(params.object_id, ObjectTypes.CONTRACT);
        await metadata.$set('contract', contract);

        return true;
      }

      case ObjectTypes.TOKEN: {
        const token = await this.findById(params.object_id, ObjectTypes.TOKEN);
        await metadata.$add('token', [token.id]);

        return true;
      }
    }

    return false;
  }

  async getMetadata(id: string): Promise<any> {
    const token = await this.getOneObject(ObjectTypes.TOKEN, { token_id: id, include_child: true });

    if (!token) {
      throw new NotFoundException('Token with this token_id not found');
    }

    return (token as TokenModel).metadata.meta_data;
  }

  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    const token = await this.getOneObject(ObjectTypes.TOKEN, { token_id: data.id });

    if (!token) {
      throw new RpcException('Token with this number not found');
    }

    let metadata = (await this.getOneObject(ObjectTypes.METADATA, {
      id: (token as TokenModel).metadata_id,
    })) as MetadataModel;

    if (!metadata) {
      throw new RpcException('Metadata not found');
    }

    if (metadata.type === MetadataTypes.COMMON) {
      const newMetadata = (await this.create(
        { status: Statuses.CREATED, type: MetadataTypes.SPECIFIED, token_id: token.id, meta_data: metadata.meta_data },
        ObjectTypes.METADATA,
      )) as MetadataModel;

      metadata = newMetadata;
    }

    try {
      for (const key in data.meta_data) {
        if (metadata.meta_data[key] !== undefined) {
          metadata.meta_data[key] = data.meta_data[key];
        }
      }

      metadata.changed('meta_data', true);
      await metadata.save();

      return new ResponseDto(HttpStatus.OK, null, 'data updated');
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
