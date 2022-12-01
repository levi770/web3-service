import { Order, Op } from 'sequelize';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ObjectTypes } from '../common/constants';
import { GetAllDto } from './dto/getAll.dto';
import { NewContractDto } from './dto/newContract.dto';
import { NewTokenDto } from './dto/newToken.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/token.model';
import { MetaDataDto } from '../web3-manager/dto/metaData.dto';
import { GetOneDto } from './dto/getOne.dto';
import { DbArgsPayload } from './interfaces/dbArgsPayload.interface';
import { AllObjectsDto } from './dto/allObjects.dto';
import { RpcException } from '@nestjs/microservices';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { WhitelistDto } from '../web3-manager/dto/whitelist.dto';
import { WhitelistModel } from './models/whitelist.model';

@Injectable()
export class DbManagerService {
  constructor(
    @InjectModel(ContractModel) private contractRepository: typeof ContractModel,
    @InjectModel(TokenModel) private tokenRepository: typeof TokenModel,
    @InjectModel(WhitelistModel) private whitelistRepository: typeof WhitelistModel,
  ) {}

  async create(
    params: NewContractDto | NewTokenDto | WhitelistDto,
    objectType: ObjectTypes,
  ): Promise<ContractModel | TokenModel | WhitelistModel> {
    switch (objectType) {
      case ObjectTypes.CONTRACT:
        return await this.contractRepository.create({ ...params });

      case ObjectTypes.TOKEN:
        const contract = await this.findById((params as NewTokenDto).contract_id, ObjectTypes.CONTRACT);
        const token = await this.tokenRepository.create({ ...params });
        await contract.$add('token', [token.id]);
        return token;

      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.create({ ...params });
    }
  }

  async delete(params: string | WhitelistDto, objectType: ObjectTypes): Promise<number> {
    switch (objectType) {
      case ObjectTypes.CONTRACT:
        return await this.contractRepository.destroy({ where: { id: params } });

      case ObjectTypes.TOKEN:
        return await this.tokenRepository.destroy({ where: { id: params } });

      case ObjectTypes.WHITELIST:
        return await this.whitelistRepository.destroy({ where: { address: (params as WhitelistDto).address } });
    }
  }

  async findById(id: string, objectType: ObjectTypes): Promise<ContractModel | TokenModel | WhitelistModel> {
    switch (objectType) {
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
      const args: DbArgsPayload = {
        attributes: { exclude: ['updatedAt'] },
        offset: !params || !params.limit || !params.page ? null : 0 + (+params.page - 1) * +params.limit,
        limit: !params || !params.limit ? null : +params.limit,
        order: [[params.order_by || 'createdAt', params.order || 'DESC']] as Order,
      };

      let allObjects: AllObjectsDto;

      switch (objectType) {
        case ObjectTypes.TOKEN:
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

      if (!params.id && !params.address) {
        throw new RpcException('id or address is required');
      }

      let args: DbArgsPayload = {
        attributes: { exclude: ['updatedAt'] },
        where: params.id
          ? { id: params.id }
          : params.address
          ? { address: params.address }
          : { contract_id: params.contract_id },
      };

      let result: TokenModel | ContractModel | WhitelistModel;

      switch (objectType) {
        case ObjectTypes.TOKEN:
          args.attributes = { exclude: ['updatedAt'] };
          result = await this.tokenRepository.findOne(args);
          break;

        case ObjectTypes.CONTRACT:
          if (params.include_child) {
            args.include = [
              {
                model: TokenModel,
                attributes: { exclude: ['updatedAt'] },
              },
            ];
          }

          result = await this.contractRepository.findOne(args);
          break;

        case ObjectTypes.WHITELIST:
          result = await this.whitelistRepository.findOne(args);
          break;
      }

      return result;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getMetadata(id: string): Promise<MetaDataDto> {
    const token = await this.tokenRepository.findOne({ where: { nft_number: id } });

    if (!token) {
      throw new NotFoundException('Token with this number not found');
    }

    return token.meta_data;
  }

  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    const token = await this.tokenRepository.findOne({ where: { nft_number: data.id } });

    if (!token) {
      throw new RpcException('Token with this number not found');
    }

    try {
      for (const key in data.meta_data) {
        if (token.meta_data[key] !== undefined) {
          token.meta_data[key] = data.meta_data[key];
        }
      }

      token.changed('meta_data', true);
      await token.save();

      return new ResponseDto(HttpStatus.OK, null, 'data updated');
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
